<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ReportTemplate;
use App\Models\Report;
use App\Models\AcademicYear;
use Carbon\Carbon;

class MyReportController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        // Find templates available to this user based on their job grade
        // Global templates (job_grade_id = null) might also be available, depending on logic.
        // Usually, templates are assigned to a specific job grade.
        $templates = ReportTemplate::with('jobGrade')
            ->where(function($q) use ($user) {
                if ($user->employee && $user->employee->job_grade_id) {
                    $q->where('job_grade_id', $user->employee->job_grade_id);
                } else {
                    // Fallback for users without employee record, maybe they don't have any templates
                    $q->where('id', 0); // impossible condition if no job grade
                }
            })
            ->get();

        // Find past reports submitted by this user
        $myReports = Report::with(['template'])
            ->where('submitter_id', $user->id)
            ->latest()
            ->paginate(15);

        $stats = [
            'total' => Report::where('submitter_id', $user->id)->count(),
            'pending' => Report::where('submitter_id', $user->id)->where('status', 'pending')->count(),
            'reviewed' => Report::where('submitter_id', $user->id)->where('status', 'reviewed')->count(),
            'returned' => Report::where('submitter_id', $user->id)->where('status', 'returned')->count(),
        ];

        return Inertia::render('HR/Reports/MyReports/Index', [
            'templates' => $templates,
            'myReports' => $myReports,
            'stats' => $stats
        ]);
    }

    public function create(ReportTemplate $template)
    {
        $template->load('fields');

        return Inertia::render('HR/Reports/MyReports/Create', [
            'template' => $template
        ]);
    }

    public function store(Request $request, ReportTemplate $template)
    {
        $validated = $request->validate([
            'period_start_date' => 'nullable|date',
            'period_end_date' => 'nullable|date',
            'period_label' => 'nullable|string|max:255',
            'data' => 'required|array',
        ]);

        $user = auth()->user();
        
        $activeYear = AcademicYear::currentForBranch($user->branch_id);
        $activeSemester = $activeYear ? $activeYear->activeSemester : null;

        Report::create([
            'branch_id' => $user->branch_id,
            'report_template_id' => $template->id,
            'submitter_id' => $user->id,
            'status' => 'pending',
            'data' => $validated['data'],
            'period_type' => $template->period_type,
            'period_start_date' => $validated['period_start_date'] ?? null,
            'period_end_date' => $validated['period_end_date'] ?? null,
            'period_label' => $validated['period_label'] ?? null,
            'academic_year_id' => $activeYear ? $activeYear->id : null,
            'semester_id' => $activeSemester ? $activeSemester->id : null,
        ]);

        return redirect()->route('hr.reports.my-reports.index')
            ->with('success', 'تم رفع التقرير بنجاح وهو الآن قيد المراجعة.');
    }

    public function show(Report $report)
    {
        // Ensure the report belongs to the authenticated user
        if ($report->submitter_id !== auth()->id()) {
            abort(403, 'غير مصرح لك بعرض هذا التقرير');
        }

        $report->load(['template.fields', 'submitter.employee.jobGrade', 'reviewer', 'academicYear', 'semester']);
        
        return Inertia::render('HR/Reports/Review', [
            'report' => $report
        ]);
    }
}
