<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\ReportTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض التقارير', only: ['index', 'showTemplate', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة تقرير', only: ['store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل تقرير', only: ['review']),
        ];
    }
    public function index(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;
        
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير الفرع', 'مدير النظام', 'مدير عام']);
        $branchId = session('active_branch_id') ?: $user->branch_id;

        // Reports pending review by this manager or all reports for branch managers
        if ($isAdmin) {
            $reportsQuery = Report::with(['template', 'submitter.employee.jobGrade'])
                ->when($branchId, function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
        } else {
            if ($employee) {
                $reportsQuery = Report::with(['template', 'submitter.employee.jobGrade'])
                    ->whereHas('submitter.employee', function($q) use ($employee) {
                        $q->where('manager_id', $employee->id);
                    })
                    ->when($branchId, function($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    });
            } else {
                $reportsQuery = Report::where('id', 0);
            }
        }

        $reportsToReview = $reportsQuery->latest()->get();

        $stats = [
            'total' => $reportsToReview->count(),
            'pending' => $reportsToReview->where('status', 'pending')->count(),
            'reviewed' => $reportsToReview->where('status', 'reviewed')->count(),
            'returned' => $reportsToReview->where('status', 'returned')->count(),
        ];

        return Inertia::render('HR/Reports/Index', [
            'reportsToReview' => $reportsToReview,
            'stats' => $stats,
        ]);
    }

    public function showTemplate(ReportTemplate $template)
    {
        $template->load('fields');
        return Inertia::render('HR/Reports/Submit', [
            'template' => $template
        ]);
    }

    public function store(Request $request, ReportTemplate $template)
    {
        // Dynamic validation based on template fields
        $rules = [];
        $template->load('fields');
        foreach ($template->fields as $field) {
            $rule = $field->is_required ? ['required'] : ['nullable'];
            if ($field->type === 'image') {
                $rule[] = 'image';
                $rule[] = 'max:5120'; // 5MB max
            }
            $rules['field_' . $field->id] = $rule;
        }

        $validated = $request->validate($rules);

        // Process data (upload images)
        $data = [];
        foreach ($template->fields as $field) {
            $key = 'field_' . $field->id;
            if ($request->hasFile($key)) {
                $path = $request->file($key)->store('reports/images', 'public');
                $data[$field->id] = $path;
            } else {
                $data[$field->id] = $request->input($key);
            }
        }

        $user = $request->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';
        $branchId = $isAdmin ? session('active_branch_id') : $user->branch_id;

        Report::create([
            'branch_id' => $branchId,
            'report_template_id' => $template->id,
            'submitter_id' => $user->id,
            'status' => 'pending',
            'data' => $data,
        ]);

        return redirect()->route('reports.index')->with('success', 'تم تقديم التقرير بنجاح');
    }

    public function show(Report $report)
    {
        $report->load(['template.fields', 'submitter.employee.jobGrade', 'reviewer']);
        return Inertia::render('HR/Reports/Review', [
            'report' => $report
        ]);
    }

    public function review(Request $request, Report $report)
    {
        if ($request->user()->id === $report->submitter_id) {
            abort(403, 'لا يمكنك اعتماد تقريرك الخاص، يجب أن يتم اعتماده من قبل مديرك المباشر.');
        }

        $validated = $request->validate([
            'status' => 'required|in:reviewed,returned',
            'manager_notes' => 'nullable|string'
        ]);

        $report->update([
            'status' => $validated['status'],
            'manager_notes' => $validated['manager_notes'],
            'reviewer_id' => $request->user()->id,
        ]);

        $statusText = $validated['status'] === 'reviewed' ? 'مراجعة واعتماد' : 'إعادة';
        return redirect()->route('reports.index')->with('success', "تم $statusText التقرير بنجاح");
    }
}
