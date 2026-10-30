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
                
                $startDate = now()->startOfWeek();
                $endDate = now()->endOfWeek();
                
                if ($template->period_type === 'monthly') {
                    $startDate = now()->startOfMonth();
                    $endDate = now()->endOfMonth();
                } elseif ($template->period_type === 'daily') {
                    $startDate = now()->startOfDay();
                    $endDate = now()->endOfDay();
                }

                if ($source === 'classroom_visits') {
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
                } elseif ($source === 'teacher_app_activation') {
                    $teachers = \App\Models\User::whereHas('role', function ($q) {
                            $q->where('name', 'like', '%معلم%')
                              ->orWhere('name', 'like', '%مدرس%')
                              ->orWhere('name', 'Teacher');
                        })
                        ->when($user->branch_id, function ($q) use ($user) {
                            $q->where(fn($sq) => $sq->where('branch_id', $user->branch_id)->orWhereNull('branch_id'));
                        })
                        ->get();

                    $teacherIds = $teachers->pluck('id')->toArray();

                    $prepsByTeacher = \App\Models\LessonPreparation::with('subject')
                        ->whereIn('teacher_id', $teacherIds)
                        ->whereBetween('preparation_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->groupBy('teacher_id');

                    $booksByTeacher = \App\Models\FollowupBook::with('subject')
                        ->whereIn('teacher_id', $teacherIds)
                        ->whereBetween('date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->groupBy('teacher_id');

                    $timetablesByTeacher = \App\Models\MasterTimetable::with('subject')
                        ->whereIn('teacher_id', $teacherIds)
                        ->get()
                        ->groupBy('teacher_id');

                    $libraryByTeacher = \App\Models\LibraryItem::whereIn('uploader_id', $teacherIds)
                        ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->groupBy('uploader_id');

                    $activationRows = $teachers->map(function ($teacher) use ($prepsByTeacher, $booksByTeacher, $timetablesByTeacher, $libraryByTeacher) {
                        $tPreps = $prepsByTeacher->get($teacher->id, collect());
                        $tBooks = $booksByTeacher->get($teacher->id, collect());
                        $tTimetable = $timetablesByTeacher->get($teacher->id, collect());
                        $tLibrary = $libraryByTeacher->get($teacher->id, collect());

                        $subjects = $tTimetable->pluck('subject.name')
                            ->merge($tPreps->pluck('subject.name'))
                            ->merge($tBooks->pluck('subject.name'))
                            ->filter()
                            ->unique()
                            ->implode('، ');

                        $daysMap = [
                            6 => 'sat_status', // السبت
                            0 => 'sun_status', // الأحد
                            1 => 'mon_status', // الإثنين
                            2 => 'tue_status', // الثلاثاء
                            3 => 'wed_status', // الأربعاء
                        ];

                        $dayResults = [];
                        $activeDaysCount = 0;

                        foreach ($daysMap as $dayNum => $colKey) {
                            $hasPrep = $tPreps->contains(fn($p) => $p->preparation_date && $p->preparation_date->dayOfWeek === $dayNum);
                            $hasBook = $tBooks->contains(fn($b) => $b->date && $b->date->dayOfWeek === $dayNum)
                                || $tPreps->contains(fn($p) => $p->preparation_date && $p->preparation_date->dayOfWeek === $dayNum && !empty($p->homework));

                            if ($hasPrep || $hasBook) {
                                $activeDaysCount++;
                                $dayResults[$colKey] = 'ت:' . ($hasPrep ? '✓' : '✗') . ' | م:' . ($hasBook ? '✓' : '✗');
                            } else {
                                $dayResults[$colKey] = '✗';
                            }
                        }

                        $percentage = (int) round(($activeDaysCount / 5) * 100);
                        if ($percentage >= 80) {
                            $evalLabel = "ممتاز ({$percentage}%)";
                        } elseif ($percentage >= 60) {
                            $evalLabel = "جيد جداً ({$percentage}%)";
                        } elseif ($percentage >= 40) {
                            $evalLabel = "جيد ({$percentage}%)";
                        } elseif ($percentage > 0) {
                            $evalLabel = "ضعيف ({$percentage}%)";
                        } else {
                            $evalLabel = "لم يفعّل (0%)";
                        }

                        $interactiveCount = $tLibrary->count() + $tPreps->count() + $tBooks->count();
                        $notesText = $interactiveCount > 0
                            ? "تحضير: {$tPreps->count()} | متابعة: {$tBooks->count()} | مكتبة: {$tLibrary->count()}"
                            : 'لم يتم رفع أي دروس خلال الفترة';

                        return array_merge([
                            'id'                        => $teacher->id,
                            'teacher_name'              => $teacher->name,
                            'subject_name'              => $subjects ?: 'غير محدد',
                        ], $dayResults, [
                            'weekly_eval'               => $evalLabel,
                            'interactive_lessons_count' => $interactiveCount,
                            'notes'                     => $notesText,
                        ]);
                    })->values();

                    $fieldArr['prefilled_data'] = $activationRows;
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
            if ($field->type === 'data_source' || $field->type === 'activities_matrix' || $field->type === 'tasks_matrix' || $field->type === 'matrix_text' || $field->type === 'teacher_status_matrix' || $field->type === 'teacher_discipline_matrix') {
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
            
            if ($field->type === 'data_source' || $field->type === 'activities_matrix' || $field->type === 'tasks_matrix' || $field->type === 'matrix_text' || $field->type === 'teacher_status_matrix' || $field->type === 'teacher_discipline_matrix') {
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
