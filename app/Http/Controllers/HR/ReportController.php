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

        $reportsQuery = Report::with(['template', 'submitter.employee.jobGrade', 'reviewer'])
            ->when($branchId, function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });

        // Reports pending review by this manager or all reports for branch managers
        if (!$isAdmin) {
            if ($employee) {
                $reportsQuery->whereHas('submitter.employee', function($q) use ($employee) {
                    $q->where('manager_id', $employee->id);
                });
            } else {
                $reportsQuery->where('id', 0);
            }
        }

        $baseStatQuery = clone $reportsQuery;

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $reportsQuery->where(function ($q) use ($search) {
                $q->whereHas('submitter', function($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                })->orWhereHas('template', function($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $reportsQuery->where('status', $request->status);
        }

        if ($request->filled('date_start')) {
            $reportsQuery->whereDate('created_at', '>=', $request->date_start);
        }

        if ($request->filled('date_end')) {
            $reportsQuery->whereDate('created_at', '<=', $request->date_end);
        }

        $reportsToReview = $reportsQuery->latest()->paginate(15)->withQueryString();

        $stats = [
            'total' => (clone $baseStatQuery)->count(),
            'pending' => (clone $baseStatQuery)->where('status', 'pending')->count(),
            'reviewed' => (clone $baseStatQuery)->where('status', 'reviewed')->count(),
            'returned' => (clone $baseStatQuery)->where('status', 'returned')->count(),
        ];

        return Inertia::render('HR/Reports/Index', [
            'reportsToReview' => $reportsToReview,
            'stats' => $stats,
            'filters' => (object) $request->only(['search', 'status', 'date_start', 'date_end']),
            'stats' => $stats,
        ]);
    }

    public function showTemplate(ReportTemplate $template)
    {
        $template->load('fields');
        
        $user = auth()->user();
        $templateArray = $template->toArray();
        
        $fieldsArray = $template->fields->map(function ($field) use ($user, $template) {
            $fieldArr = $field->toArray();
            
            if ($field->type === 'data_source') {
                $options = is_array($field->options) ? $field->options : json_decode($field->options, true) ?? [];
                $source = $options['source'] ?? null;
                
                if ($source === 'classroom_visits') {
                    $startDate = now()->startOfWeek();
                    $endDate = now()->endOfWeek();
                    
                    if ($template->period_type === 'monthly') {
                        $startDate = now()->startOfMonth();
                        $endDate = now()->endOfMonth();
                    } elseif ($template->period_type === 'daily') {
                        $startDate = now()->startOfDay();
                        $endDate = now()->endOfDay();
                    }
                    
                    $visits = \App\Models\ClassroomVisit::with('teacher')
                        ->where('supervisor_id', $user->id)
                        ->whereBetween('visit_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function($visit) {
                            return [
                                'id' => $visit->id,
                                'day' => $visit->visit_date->locale('ar')->isoFormat('dddd'),
                                'date' => $visit->visit_date->format('Y-m-d'),
                                'teacher_name' => $visit->teacher ? $visit->teacher->name : '',
                                'visit_type' => $visit->visit_type,
                                'notes' => $visit->notes,
                                'evaluation' => $visit->score,
                                'discussed_points' => $visit->discussed_points
                            ];
                        });
                        
                    $fieldArr['prefilled_data'] = $visits;
                }
            }
            return $fieldArr;
        })->toArray();

        $templateArray['fields'] = $fieldsArray;

        return Inertia::render('HR/Reports/Submit', [
            'template' => $templateArray
        ]);
    }

    public function store(Request $request, ReportTemplate $template)
    {
        // Dynamic validation based on template fields
        $rules = [];
        $template->load('fields');
        foreach ($template->fields as $field) {
            if ($field->type === 'data_source' || $field->type === 'activities_matrix' || $field->type === 'tasks_matrix' || $field->type === 'matrix_text') {
                $rules['field_' . $field->id] = ['nullable', 'array'];
                continue;
            }
            
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
            
            if ($field->type === 'data_source' || $field->type === 'activities_matrix' || $field->type === 'tasks_matrix' || $field->type === 'matrix_text') {
                $data[$field->id] = $request->input($key, []);
            } elseif ($request->hasFile($key)) {
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

    public function destroy(Request $request, Report $report)
    {
        if ($report->status !== 'returned') {
            abort(403, 'لا يمكن حذف التقرير إلا إذا كان مرفوضاً (معاداً).');
        }

        $report->delete();

        return redirect()->back()->with('success', 'تم حذف التقرير المرفوض بنجاح.');
    }
}
