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

                if ($source === 'classroom_visits') {
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
                } elseif ($source === 'teacher_absences') {
                    $statusMap = [
                        'absent'  => 'غياب',
                        'late'    => 'تأخر',
                        'excused' => 'استئذان',
                        'leave'   => 'إجازة',
                        'present' => 'حاضر',
                    ];
                    $attendances = \App\Models\Attendance::with('employee.user')
                        ->whereIn('status', ['absent', 'late', 'excused', 'leave'])
                        ->whereBetween('date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($att) use ($statusMap) {
                            return [
                                'id'              => $att->id,
                                'day'             => $att->date ? $att->date->locale('ar')->isoFormat('dddd') : '',
                                'date'            => $att->date ? $att->date->format('Y-m-d') : '',
                                'teacher_name'    => $att->employee && $att->employee->user ? $att->employee->user->name : '',
                                'attendance_type' => $statusMap[$att->status] ?? $att->status,
                                'late_minutes'    => $att->late_minutes ? $att->late_minutes . ' دقيقة' : '-',
                                'check_in'        => $att->check_in ?? '-',
                                'check_out'       => $att->check_out ?? '-',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $attendances;
                } elseif ($source === 'study_plans') {
                    $statusMap = [
                        'approved' => 'حسب الخطة (معتمدة)',
                        'pending'  => 'قيد المراجعة',
                        'rejected' => 'مرفوضة / متأخر',
                        'draft'    => 'مسودة',
                    ];
                    $plans = \App\Models\StudyPlan::with(['teacher', 'grade', 'subject'])
                        ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($plan) use ($statusMap) {
                            return [
                                'id'           => $plan->id,
                                'date'         => $plan->created_at ? $plan->created_at->format('Y-m-d') : '',
                                'teacher_name' => $plan->teacher ? $plan->teacher->name : '',
                                'subject_name' => $plan->subject ? $plan->subject->name : '',
                                'grade_name'   => $plan->grade ? $plan->grade->name : '',
                                'plan_title'   => $plan->title ?? '',
                                'plan_status'  => $statusMap[$plan->status] ?? $plan->status,
                                'notes'        => $plan->admin_feedback ?: ($plan->notes ?? ''),
                            ];
                        });

                    $fieldArr['prefilled_data'] = $plans;
                } elseif ($source === 'followup_books') {
                    $books = \App\Models\FollowupBook::with(['teacher', 'subject', 'division'])
                        ->when($user->branch_id, fn($q) => $q->where('branch_id', $user->branch_id))
                        ->whereBetween('date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($book) {
                            return [
                                'id'            => $book->id,
                                'day'           => $book->date ? $book->date->locale('ar')->isoFormat('dddd') : '',
                                'date'          => $book->date ? $book->date->format('Y-m-d') : '',
                                'teacher_name'  => $book->teacher ? $book->teacher->name : '',
                                'subject_name'  => $book->subject ? $book->subject->name : '',
                                'division_name' => $book->division ? $book->division->name : '',
                                'lesson_title'  => $book->lesson_title ?? '',
                                'homework'      => $book->homework ?? '',
                                'notes'         => $book->notes ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $books;
                } elseif ($source === 'employee_leaves') {
                    $statusMap = [
                        'approved' => 'مقبولة',
                        'pending'  => 'قيد المراجعة',
                        'rejected' => 'مرفوضة',
                    ];
                    $leaves = \App\Models\Leave::with(['employee.user', 'leaveType'])
                        ->where(function ($q) use ($startDate, $endDate) {
                            $q->whereBetween('start_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                              ->orWhereBetween('end_date', [$startDate->startOfDay(), $endDate->endOfDay()]);
                        })
                        ->get()
                        ->map(function ($leave) use ($statusMap) {
                            $daysCount = ($leave->start_date && $leave->end_date)
                                ? $leave->start_date->diffInDays($leave->end_date) + 1
                                : 1;
                            return [
                                'id'            => $leave->id,
                                'employee_name' => $leave->employee && $leave->employee->user ? $leave->employee->user->name : '',
                                'leave_type'    => $leave->leaveType ? $leave->leaveType->name : '',
                                'start_date'    => $leave->start_date ? $leave->start_date->format('Y-m-d') : '',
                                'end_date'      => $leave->end_date ? $leave->end_date->format('Y-m-d') : '',
                                'days_count'    => $daysCount . ' يوم',
                                'reason'        => $leave->reason ?? '',
                                'status'        => $statusMap[$leave->status] ?? $leave->status,
                            ];
                        });

                    $fieldArr['prefilled_data'] = $leaves;
                } elseif ($source === 'parent_visits') {
                    $pVisits = \App\Models\ParentVisit::with('student.user')
                        ->when($user->branch_id, fn($q) => $q->where('branch_id', $user->branch_id))
                        ->whereBetween('visit_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($pv) {
                            return [
                                'id'               => $pv->id,
                                'day'              => $pv->visit_date ? $pv->visit_date->locale('ar')->isoFormat('dddd') : '',
                                'date'             => $pv->visit_date ? $pv->visit_date->format('Y-m-d') : '',
                                'visitor_name'     => $pv->visitor_name ?? '',
                                'visitor_relation' => $pv->visitor_relation ?? 'ولي أمر',
                                'student_name'     => $pv->student && $pv->student->user ? $pv->student->user->name : ($pv->student->name ?? ''),
                                'purpose'          => $pv->purpose ?? '',
                                'action_taken'     => $pv->status ?? '',
                                'notes'            => $pv->notes ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $pVisits;
                } elseif ($source === 'student_absences') {
                    $statusMap = [
                        'absent'  => 'غائب',
                        'late'    => 'متأخر',
                        'excused' => 'غائب بعذر',
                    ];
                    $sAbsences = \App\Models\AttendanceLog::with(['user.student.currentEnrollment.division.grade'])
                        ->whereIn('status', ['absent', 'late', 'excused'])
                        ->whereBetween('attendance_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($log) use ($statusMap) {
                            $enrollment = $log->user?->student?->currentEnrollment;
                            return [
                                'id'              => $log->id,
                                'day'             => $log->attendance_date ? $log->attendance_date->locale('ar')->isoFormat('dddd') : '',
                                'date'            => $log->attendance_date ? $log->attendance_date->format('Y-m-d') : '',
                                'student_name'    => $log->user ? $log->user->name : '',
                                'grade_name'      => $enrollment?->division?->grade?->name ?? '-',
                                'division_name'   => $enrollment?->division?->name ?? '-',
                                'attendance_type' => $statusMap[$log->status] ?? $log->status,
                            ];
                        });

                    $fieldArr['prefilled_data'] = $sAbsences;
                } elseif ($source === 'student_violations') {
                    $statusMap = [
                        'pending'   => 'قيد المعالجة',
                        'resolved'  => 'تمت المعالجة',
                        'escalated' => 'مصعدة',
                    ];
                    $sViolations = \App\Models\StudentViolation::with(['student.user', 'student.currentEnrollment.division.grade', 'violationType'])
                        ->when($user->branch_id, fn($q) => $q->where('branch_id', $user->branch_id))
                        ->whereBetween('violation_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($sv) use ($statusMap) {
                            $enrollment = $sv->student?->currentEnrollment;
                            return [
                                'id'             => $sv->id,
                                'date'           => $sv->violation_date ? $sv->violation_date->format('Y-m-d') : '',
                                'student_name'   => $sv->student?->user?->name ?? '',
                                'grade_name'     => $enrollment?->division?->grade?->name ?? '-',
                                'division_name'  => $enrollment?->division?->name ?? '-',
                                'violation_type' => $sv->violationType ? $sv->violationType->name : '',
                                'action_taken'   => $sv->action_taken ?? '',
                                'status'         => $statusMap[$sv->status] ?? ($sv->status ?? ''),
                                'details'        => $sv->details ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $sViolations;
                } elseif ($source === 'parent_summons') {
                    $statusMap = [
                        'pending'   => 'بانتظار الحضور',
                        'attended'  => 'حضر ولي الأمر',
                        'cancelled' => 'ملغى',
                    ];
                    $summons = \App\Models\ParentSummon::with(['student.user', 'student.currentEnrollment.division.grade'])
                        ->when($user->branch_id, fn($q) => $q->where('branch_id', $user->branch_id))
                        ->whereBetween('summon_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($ps) use ($statusMap) {
                            $enrollment = $ps->student?->currentEnrollment;
                            return [
                                'id'            => $ps->id,
                                'date'          => $ps->summon_date ? $ps->summon_date->format('Y-m-d') : '',
                                'student_name'  => $ps->student?->user?->name ?? '',
                                'grade_name'    => $enrollment?->division?->grade?->name ?? '-',
                                'division_name' => $enrollment?->division?->name ?? '-',
                                'reason'        => $ps->reason ?? '',
                                'status'        => $statusMap[$ps->status] ?? ($ps->status ?? ''),
                                'notes'         => $ps->notes ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $summons;
                } elseif ($source === 'student_pledges') {
                    $pledges = \App\Models\StudentPledge::with(['student.user', 'student.currentEnrollment.division.grade'])
                        ->when($user->branch_id, fn($q) => $q->where('branch_id', $user->branch_id))
                        ->whereBetween('date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($sp) {
                            $enrollment = $sp->student?->currentEnrollment;
                            return [
                                'id'             => $sp->id,
                                'date'           => $sp->date ? $sp->date->format('Y-m-d') : '',
                                'student_name'   => $sp->student?->user?->name ?? '',
                                'grade_name'     => $enrollment?->division?->grade?->name ?? '-',
                                'division_name'  => $enrollment?->division?->name ?? '-',
                                'pledge_text'    => $sp->pledge_text ?? '',
                                'student_signed' => $sp->is_signed_by_student ? 'تم التوقيع' : 'لم يوقع',
                                'parent_signed'  => $sp->is_signed_by_parent ? 'تم التوقيع' : 'لم يوقع',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $pledges;
                } elseif ($source === 'clinic_visits') {
                    $cVisits = \App\Models\ClinicVisit::with(['student.user', 'student.currentEnrollment.division.grade'])
                        ->whereBetween('visited_at', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($cv) {
                            $enrollment = $cv->student?->currentEnrollment;
                            return [
                                'id'            => $cv->id,
                                'date'          => $cv->visited_at ? $cv->visited_at->format('Y-m-d H:i') : '',
                                'student_name'  => $cv->student?->user?->name ?? '',
                                'grade_name'    => $enrollment?->division?->grade?->name ?? '-',
                                'division_name' => $enrollment?->division?->name ?? '-',
                                'symptoms'      => $cv->symptoms ?? '',
                                'action_taken'  => $cv->action_taken ?? '',
                                'status'        => $cv->status ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $cVisits;
                } elseif ($source === 'class_coverages') {
                    $coverages = \App\Models\ClassCoverage::with(['absentTeacher', 'substituteTeacher', 'period', 'division.grade', 'subject'])
                        ->when($user->branch_id, fn($q) => $q->where('branch_id', $user->branch_id))
                        ->whereBetween('coverage_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($cov) {
                            $divLabel = ($cov->division?->grade?->name ? $cov->division->grade->name . ' - ' : '') . ($cov->division?->name ?? '');
                            return [
                                'id'                 => $cov->id,
                                'day'                => $cov->coverage_date ? $cov->coverage_date->locale('ar')->isoFormat('dddd') : '',
                                'date'               => $cov->coverage_date ? $cov->coverage_date->format('Y-m-d') : '',
                                'period_name'        => $cov->period ? $cov->period->name : '',
                                'division_name'      => $divLabel ?: '-',
                                'subject_name'       => $cov->subject ? $cov->subject->name : '',
                                'absent_teacher'     => $cov->absentTeacher ? $cov->absentTeacher->name : '',
                                'substitute_teacher' => $cov->substituteTeacher ? $cov->substituteTeacher->name : '',
                                'notes'              => $cov->notes ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $coverages;
                } elseif ($source === 'meetings') {
                    $meetings = \App\Models\Meeting::withCount('participants')
                        ->when($user->branch_id, fn($q) => $q->where('branch_id', $user->branch_id))
                        ->whereBetween('date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($m) {
                            return [
                                'id'                 => $m->id,
                                'date'               => $m->date ? $m->date->format('Y-m-d') : '',
                                'meeting_time'       => $m->time ? \Carbon\Carbon::parse($m->time)->format('H:i') : '',
                                'meeting_title'      => $m->title ?? '',
                                'meeting_type'       => $m->type ?? '',
                                'participants_count' => $m->participants_count ?? 0,
                                'outcomes'           => $m->outcomes ?? '',
                                'recommendations'    => $m->recommendations ?? '',
                                'status'             => $m->status ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $meetings;
                } elseif ($source === 'employee_achievements') {
                    $achievements = \App\Models\EmployeeAchievement::with(['user', 'achievementType'])
                        ->when($user->branch_id, fn($q) => $q->where('branch_id', $user->branch_id))
                        ->whereBetween('achievement_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($ach) {
                            return [
                                'id'               => $ach->id,
                                'date'             => $ach->achievement_date ? $ach->achievement_date->format('Y-m-d') : '',
                                'employee_name'    => $ach->user ? $ach->user->name : '',
                                'achievement_type' => $ach->achievementType ? $ach->achievementType->name : '',
                                'points'           => $ach->points ?? 0,
                                'details'          => $ach->details ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $achievements;
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
