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
        $user = auth()->user();

        $templateArray = $template->toArray();

        // Get working days from active AcademicYear
        $activeYear = AcademicYear::currentForBranch($user->branch_id);
        $workingDays = $activeYear && $activeYear->working_days ? $activeYear->working_days : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
        
        $daysAr = [
            'Saturday' => 'السبت',
            'Sunday' => 'الأحد',
            'Monday' => 'الإثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
        ];
        
        $templateArray['working_days'] = array_map(function($day) use ($daysAr) {
            return $daysAr[$day] ?? $day;
        }, $workingDays);

        $fieldsArray = $template->fields->map(function ($field) use ($user, $template) {
            $fieldArr = $field->toArray();

            if ($field->type === 'data_source') {
                $options = is_array($field->options) ? $field->options : json_decode($field->options, true) ?? [];
                $source = $options['source'] ?? null;

                if ($source === 'classroom_visits') {
                    $startDate = request()->has('start_date') ? \Carbon\Carbon::parse(request()->get('start_date')) : now()->startOfWeek();
                    $endDate   = request()->has('end_date') ? \Carbon\Carbon::parse(request()->get('end_date')) : now()->endOfWeek();

                    if (!request()->has('start_date') && !request()->has('end_date')) {
                        if ($template->period_type === 'monthly') {
                            $startDate = now()->startOfMonth();
                            $endDate   = now()->endOfMonth();
                        } elseif ($template->period_type === 'daily') {
                            $startDate = now()->startOfDay();
                            $endDate   = now()->endOfDay();
                        }
                    }

                    $visits = \App\Models\ClassroomVisit::with('teacher')
                        ->where('supervisor_id', $user->id)
                        ->whereBetween('visit_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($visit) {
                            return [
                                'id'               => $visit->id,
                                'day'              => $visit->visit_date->locale('ar')->isoFormat('dddd'),
                                'date'             => $visit->visit_date->format('Y-m-d'),
                                'teacher_name'     => $visit->teacher ? $visit->teacher->name : '',
                                'visit_type'       => $visit->visit_type,
                                'notes'            => $visit->notes,
                                'evaluation'       => $visit->score,
                                'discussed_points' => $visit->discussed_points,
                            ];
                        });

                    $fieldArr['prefilled_data'] = $visits;
                } elseif ($source === 'employee_violations') {
                    $startDate = request()->has('start_date') ? \Carbon\Carbon::parse(request()->get('start_date')) : now()->startOfWeek();
                    $endDate   = request()->has('end_date') ? \Carbon\Carbon::parse(request()->get('end_date')) : now()->endOfWeek();

                    if (!request()->has('start_date') && !request()->has('end_date')) {
                        if ($template->period_type === 'monthly') {
                            $startDate = now()->startOfMonth();
                            $endDate   = now()->endOfMonth();
                        } elseif ($template->period_type === 'daily') {
                            $startDate = now()->startOfDay();
                            $endDate   = now()->endOfDay();
                        }
                    }

                    $violations = \App\Models\EmployeeViolation::with(['user', 'violationType'])
                        ->whereBetween('violation_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($violation) {
                            return [
                                'id'               => $violation->id,
                                'employee_name'    => $violation->user ? $violation->user->name : '',
                                'violation_type'   => $violation->violationType ? $violation->violationType->name : '',
                                'violation_date'   => \Carbon\Carbon::parse($violation->violation_date)->format('Y-m-d'),
                                'repetition_level' => $violation->repetition_level ?? '',
                                'action_taken'     => $violation->action_taken ?? '',
                                'status'           => $violation->status ?? '',
                                'details'          => $violation->details ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $violations;
                }
            }

            return $fieldArr;
        })->toArray();

        $templateArray['fields'] = $fieldsArray;

        return Inertia::render('HR/Reports/MyReports/Create', [
            'template' => $templateArray,
        ]);
    }

    public function store(Request $request, ReportTemplate $template)
    {
        $rules = [
            'data' => 'required|array',
        ];

        if (!empty($template->period_type) && $template->period_type !== 'none') {
            $rules['period_start_date'] = 'required|date';
            $rules['period_end_date'] = 'required|date';
            $rules['period_label'] = 'required|string|max:255';
        } else {
            $rules['period_start_date'] = 'nullable|date';
            $rules['period_end_date'] = 'nullable|date';
            $rules['period_label'] = 'nullable|string|max:255';
        }

        $validated = $request->validate($rules);

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

    public function destroy(Report $report)
    {
        if ($report->submitter_id !== auth()->id()) {
            abort(403, 'غير مصرح لك بحذف هذا التقرير');
        }

        if ($report->status !== 'returned') {
            abort(403, 'لا يمكن حذف التقرير إلا إذا كان مرفوضاً (معاداً).');
        }

        $report->delete();

        return redirect()->route('hr.reports.my-reports.index')
            ->with('success', 'تم حذف التقرير المرفوض بنجاح.');
    }
}
