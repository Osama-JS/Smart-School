<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\ReportTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;
        
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';
        $branchId = $isAdmin ? session('active_branch_id') : $user->branch_id;

        // 1. Templates available for this employee to fill
        $availableTemplates = [];
        if ($employee && $employee->job_grade_id) {
            $availableTemplates = ReportTemplate::where(function($q) use ($branchId) {
                if ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                }
            })
            ->where('job_grade_id', $employee->job_grade_id)
            ->get();
        }

        // 2. Reports submitted by this employee
        $myReports = Report::with('template', 'reviewer')
            ->where('submitter_id', $user->id)
            ->latest()
            ->get();

        // 3. Reports pending review by this manager
        // This manager can review reports if they are the direct manager
        // or based on job grade hierarchy. Using explicit manager_id for now.
        $reportsToReview = [];
        if ($employee) {
            $reportsToReview = Report::with(['template', 'submitter.employee.jobGrade'])
                ->whereHas('submitter.employee', function($q) use ($employee) {
                    $q->where('manager_id', $employee->id);
                })
                ->where(function($q) use ($branchId) {
                    if ($branchId) {
                        $q->where('branch_id', $branchId);
                    }
                })
                ->latest()
                ->get();
        }

        return Inertia::render('HR/Reports/Index', [
            'availableTemplates' => $availableTemplates,
            'myReports' => $myReports,
            'reportsToReview' => $reportsToReview,
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
