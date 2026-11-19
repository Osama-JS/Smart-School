<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\User;
use App\Models\Subject;
use App\Models\Attendance;
use App\Models\ActivityLog;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use App\Services\ServerMonitorService;

class DashboardController extends Controller
{
    public function index(Request $request, ServerMonitorService $serverMonitor)
    {
        $user = auth()->user();
        $roleName = $user->role ? $user->role->name : null;

        // Early role redirects to dedicated portals (avoid unnecessary queries)
        if ($roleName === 'طالب') {
            return redirect()->route('student.dashboard');
        }
        if ($roleName === 'ولي أمر') {
            return redirect()->route('parent.dashboard');
        }

        $isSystemAdmin = $roleName === 'مدير النظام';
        $branchId = $isSystemAdmin ? null : $user->branch_id;

        $latestNews = \App\Models\News::with('attachments')
            ->where('is_published', true)
            ->where('published_at', '<=', now())
            ->when(!$isSystemAdmin, function ($query) use ($user) {
                return $query->whereHas('author', function($q) use ($user) {
                    $q->whereNull('branch_id')
                      ->orWhere('branch_id', $user->branch_id);
                });
            })
            ->latest('published_at')
            ->take(5)
            ->get()
            ->map(function($news) {
                return [
                    'id' => $news->id,
                    'title' => $news->title,
                    'category' => $news->category,
                    'image_url' => $news->image_url,
                    'published_at' => $news->published_at ? $news->published_at->diffForHumans() : '',
                    'excerpt' => \Illuminate\Support\Str::limit(strip_tags($news->content), 80)
                ];
            });

        $quickTasks = \App\Models\Task::where('assigned_to', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'text' => $task->title,
                    'completed' => $task->status === 'completed',
                ];
            });

        $pendingAppraisals = $this->getPendingAppraisalsForUser($user);

        if ($isSystemAdmin) {
            $totalBranches = \App\Models\Branch::count();
            $activeBranches = \App\Models\Branch::where('is_active', true)->count();
            $totalUsers = User::count();
            $totalStudents = User::whereHas('role', fn($q) => $q->where('name', 'طالب'))->count();
            $totalTeachers = User::whereHas('role', fn($q) => $q->where('name', 'معلم'))->count();
            $pendingRequestsCount = \App\Models\EmployeeRequest::where('status', 'pending')->count();
            $activeAppraisalCyclesCount = \App\Models\AppraisalCycle::where('status', 'active')->count();
            $pendingAppraisalsCount = \App\Models\EmployeeAppraisal::where('status', '!=', 'completed')->count();

            $managerRoleIds = \App\Models\Role::whereIn('name', ['مدير الفرع', 'مدير فرع'])->pluck('id');
            $totalManagers = $managerRoleIds->isNotEmpty() ? User::whereIn('role_id', $managerRoleIds)->count() : 0;

            $recentActivities = ActivityLog::with('user')->latest()->take(8)->get()->map(function($log) {
                return [
                    'text' => $log->action . ' بواسطة ' . ($log->user ? $log->user->name : 'نظام'),
                    'time' => $log->created_at->diffForHumans(),
                    'type' => $this->classifyActivityType($log->action),
                ];
            });

            $todayDate = Carbon::today()->toDateString();
            $branchOverview = \App\Models\Branch::all()->map(function ($branch) use ($todayDate) {
                $studentsCount = User::where('branch_id', $branch->id)
                    ->whereHas('role', fn($q) => $q->where('name', 'طالب'))
                    ->count();
                $teachersCount = User::where('branch_id', $branch->id)
                    ->whereHas('role', fn($q) => $q->where('name', 'معلم'))
                    ->count();
                $employeesCount = \App\Models\Employee::whereHas('user', fn($q) => $q->where('branch_id', $branch->id))->count();

                $attTotal = \DB::table('attendances')
                    ->where('branch_id', $branch->id)
                    ->whereDate('date', $todayDate)
                    ->count();
                $attPresent = \DB::table('attendances')
                    ->where('branch_id', $branch->id)
                    ->whereDate('date', $todayDate)
                    ->whereIn('status', ['present', 'late'])
                    ->count();

                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'is_active' => (bool) $branch->is_active,
                    'students_count' => $studentsCount,
                    'teachers_count' => $teachersCount,
                    'employees_count' => $employeesCount,
                    'today_attendance_rate' => $attTotal > 0 ? round(($attPresent / $attTotal) * 100, 1) : 0,
                ];
            })->values();

            $serverMetrics = $serverMonitor->getMetrics();

            return Inertia::render('SystemAdminDashboard', [
                'stats' => [
                    'branches' => number_format($totalBranches),
                    'active_branches' => number_format($activeBranches),
                    'users' => number_format($totalUsers),
                    'managers' => number_format($totalManagers),
                ],
                'systemSummary' => [
                    'total_students' => $totalStudents,
                    'total_teachers' => $totalTeachers,
                    'pending_requests' => $pendingRequestsCount,
                    'active_appraisal_cycles' => $activeAppraisalCyclesCount,
                    'pending_appraisals' => $pendingAppraisalsCount,
                ],
                'branchOverview' => $branchOverview,
                'recentActivities' => $recentActivities,
                'serverMetrics' => $serverMetrics,
                'latestNews' => $latestNews,
            ]);
        }

        // --- Teacher Dashboard ---
        if ($roleName === 'معلم') {
            // Teacher's Schedule for today
            $todayTimetable = \App\Models\MasterTimetable::with(['period', 'division.grade.section', 'subject'])
                ->where('teacher_id', $user->id)
                ->today()
                ->get()
                ->sortBy(function($t) { return $t->period->start_time ?? ''; })
                ->values();

            // Attendance Status
            $todayAttendance = Attendance::where('employee_id', optional($user->employee)->id)
                ->whereDate('date', Carbon::today())
                ->first();

            // Upcoming Meetings
            $upcomingMeetings = \App\Models\Meeting::whereHas('participants', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->where(function($q) {
                    $q->whereDate('date', '>=', Carbon::today())
                      ->orWhere('status', 'scheduled');
                })
                ->orderBy('date')->orderBy('time')
                ->take(5)
                ->get();

            // Teacher Stats
            $teacherDivisions = \App\Models\MasterTimetable::where('teacher_id', $user->id)->distinct('division_id')->pluck('division_id');
            $totalDivisions = $teacherDivisions->count();
            $totalSubjects = \App\Models\MasterTimetable::where('teacher_id', $user->id)->distinct('subject_id')->count('subject_id');
            $totalStudents = \App\Models\Enrollment::whereIn('division_id', $teacherDivisions)->count();

            // Success Rate & Trend
            $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');
            $activeSemester = \App\Models\Semester::where('academic_year_id', $activeYearId)->where('is_active', true)->first();
            
            $averageScore = 0;
            $previousAverageScore = 0;
            $successRateTrend = 0;

            if ($activeSemester) {
                $averageScore = \App\Models\SemesterResult::where('semester_id', $activeSemester->id)
                    ->whereHas('enrollment', function($q) use ($teacherDivisions) {
                        $q->whereIn('division_id', $teacherDivisions);
                    })->avg('semester_total');
                
                $previousSemester = \App\Models\Semester::where('id', '<', $activeSemester->id)->orderByDesc('id')->first();
                if ($previousSemester) {
                    $previousAverageScore = \App\Models\SemesterResult::where('semester_id', $previousSemester->id)
                        ->whereHas('enrollment', function($q) use ($teacherDivisions) {
                            $q->whereIn('division_id', $teacherDivisions);
                        })->avg('semester_total');
                }
            } else {
                $averageScore = \App\Models\SemesterResult::whereHas('enrollment', function($q) use ($teacherDivisions) {
                    $q->whereIn('division_id', $teacherDivisions);
                })->avg('semester_total');
            }

            $successRate = $averageScore ? round($averageScore) : 0;
            $prevSuccessRate = $previousAverageScore ? round($previousAverageScore) : 0;
            
            if ($prevSuccessRate > 0) {
                $successRateTrend = round((($successRate - $prevSuccessRate) / $prevSuccessRate) * 100);
            } else if ($successRate > 0 && $prevSuccessRate == 0) {
                $successRateTrend = 100;
            }

            // Leaderboard
            $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');
            $leaderboard = \App\Models\EmployeeAchievement::selectRaw('user_id, SUM(points) as total_points')
                ->where('academic_year_id', $activeYearId)
                ->where('points', '>', 0)
                ->groupBy('user_id')
                ->orderByDesc('total_points')
                ->with('user:id,name')
                ->take(5)
                ->get();

            // Top Students
            $topStudents = \App\Models\StudentAchievement::selectRaw('student_id, SUM(points) as total_points')
                ->where('academic_year_id', $activeYearId)
                ->whereHas('student.enrollments', function($q) use ($teacherDivisions) {
                    $q->whereIn('division_id', $teacherDivisions);
                })
                ->groupBy('student_id')
                ->orderByDesc('total_points')
                ->with('student.user:id,name')
                ->take(3)
                ->get()
                ->map(function($achievement) {
                    return [
                        'name' => $achievement->student->user->name ?? 'طالب',
                        'score' => (int) $achievement->total_points
                    ];
                });

            // Teacher Gamification Progress
            $teacherPoints = \App\Models\EmployeeAchievement::where('user_id', $user->id)
                ->where('academic_year_id', $activeYearId)
                ->sum('points') ?? 0;

            $currentTier = \App\Models\GamificationTier::where('min_points', '<=', $teacherPoints)
                ->orderByDesc('min_points')
                ->first();

            $nextTier = \App\Models\GamificationTier::where('min_points', '>', $teacherPoints)
                ->orderBy('min_points')
                ->first();

            $progress = 100;
            if ($nextTier && $currentTier) {
                $progress = (($teacherPoints - $currentTier->min_points) / max(1, $nextTier->min_points - $currentTier->min_points)) * 100;
            } elseif ($nextTier && !$currentTier) {
                $progress = ($teacherPoints / max(1, $nextTier->min_points)) * 100;
            }

            $teacherProgress = [
                'points' => (int) $teacherPoints,
                'current_tier' => $currentTier ? $currentTier->name : 'مبتدئ',
                'next_tier' => $nextTier ? $nextTier->name : 'الحد الأقصى',
                'min_points' => $currentTier ? $currentTier->min_points : 0,
                'max_points' => $nextTier ? $nextTier->min_points : $teacherPoints,
                'percentage' => min(100, max(0, $progress)),
                'color_class' => $currentTier ? $currentTier->color_class : 'slate',
                'points_needed' => $nextTier ? ($nextTier->min_points - $teacherPoints) : 0,
            ];

            // Class Performance Chart Data
            $subjectId = request('subject_id');
            $semesterId = request('semester_id');

            $classPerformance = \App\Models\Division::whereIn('id', $teacherDivisions)
                ->with('grade')
                ->get()
                ->map(function ($division) use ($user, $subjectId, $semesterId) {
                    $scoreQuery = \App\Models\SemesterResult::whereHas('enrollment', function($q) use ($division) {
                        $q->where('division_id', $division->id);
                    });
                    if ($subjectId) {
                        $scoreQuery->where('subject_id', $subjectId);
                    }
                    if ($semesterId) {
                        $scoreQuery->where('semester_id', $semesterId);
                    }
                    $score = $scoreQuery->avg('semester_total');
                    
                    $attendanceQuery = \App\Models\ClassAttendance::where('division_id', $division->id);
                    // Usually ClassAttendance doesn't track semester_id directly, but maybe subject_id if it's period-based. We'll leave it as is or add subject filter if it exists.
                    if ($subjectId && \Illuminate\Support\Facades\Schema::hasColumn('class_attendances', 'subject_id')) {
                        $attendanceQuery->where('subject_id', $subjectId);
                    }
                    $totalAttendanceRecords = (clone $attendanceQuery)->count();
                    $presentRecords = $attendanceQuery->whereIn('status', ['present', 'late'])->count();
                        
                    $attendance = $totalAttendanceRecords > 0 ? ($presentRecords / $totalAttendanceRecords) * 100 : 0;

                    return [
                        'name' => ($division->grade ? $division->grade->name : '') . ' - ' . $division->name,
                        'score' => $score ? round($score, 1) : 0,
                        'attendance' => round($attendance, 1)
                    ];
                });

            $teacherSubjectsIds = \App\Models\MasterTimetable::where('teacher_id', $user->id)->distinct('subject_id')->pluck('subject_id');
            $teacherSubjects = \App\Models\Subject::whereIn('id', $teacherSubjectsIds)->get(['id', 'name']);
            $semesters = \App\Models\Semester::where('academic_year_id', $activeYearId)->get(['id', 'name']);

            // Today's substitute class coverages assigned to this teacher
            $todayCoverages = \App\Models\ClassCoverage::with([
                    'period',
                    'division.grade',
                    'subject',
                    'absentTeacher:id,name',
                ])
                ->where('substitute_teacher_id', $user->id)
                ->whereDate('coverage_date', Carbon::today())
                ->orderBy('period_id')
                ->get();

            // Today's lesson preparations summary & latest supervisor feedback
            $preparedTodayCount = \App\Models\LessonPreparation::where('teacher_id', $user->id)
                ->whereDate('preparation_date', Carbon::today())
                ->count();
            $latestFeedbackPrep = \App\Models\LessonPreparation::with(['subject:id,name', 'reviewer:id,name'])
                ->where('teacher_id', $user->id)
                ->whereNotNull('reviewed_at')
                ->latest('reviewed_at')
                ->first();
            $todayPrepSummary = [
                'total_classes_today' => $todayTimetable->count(),
                'prepared_today' => $preparedTodayCount,
                'latest_feedback' => $latestFeedbackPrep ? [
                    'id' => $latestFeedbackPrep->id,
                    'lesson_title' => $latestFeedbackPrep->lesson_title,
                    'subject_name' => $latestFeedbackPrep->subject?->name,
                    'supervisor_rating' => $latestFeedbackPrep->supervisor_rating,
                    'supervisor_notes' => $latestFeedbackPrep->supervisor_notes,
                    'reviewer_name' => $latestFeedbackPrep->reviewer?->name,
                    'reviewed_at' => $latestFeedbackPrep->reviewed_at?->diffForHumans(),
                ] : null,
            ];

            return Inertia::render('Dashboards/TeacherDashboard', [
                'todayTimetable' => $todayTimetable,
                'attendanceStatus' => $todayAttendance,
                'upcomingMeetings' => $upcomingMeetings,
                'todayCoverages' => $todayCoverages,
                'todayPrepSummary' => $todayPrepSummary,
                'pendingAppraisals' => $pendingAppraisals,
                'stats' => [
                    'divisions' => $totalDivisions,
                    'subjects' => $totalSubjects,
                    'students' => $totalStudents,
                    'successRate' => $successRate,
                    'successRateTrend' => $successRateTrend,
                ],
                'leaderboard' => $leaderboard,
                'topStudents' => $topStudents,
                'teacherProgress' => $teacherProgress,
                'classPerformance' => $classPerformance,
                'teacherSubjects' => $teacherSubjects,
                'semesters' => $semesters,
                'filters' => request()->only(['subject_id', 'semester_id']),
                'quickTasks' => $quickTasks,
                'latestNews' => $latestNews
            ]);
        }

        // --- Branch Manager Dashboard ---
        if (in_array($roleName, ['مدير الفرع', 'مدير فرع'], true)) {
            $studentsQuery = User::whereHas('role', function($q) { $q->where('name', 'طالب'); });
            if ($branchId) $studentsQuery->where('branch_id', $branchId);
            $totalStudents = $studentsQuery->count();
            $branchStudentUserIds = (clone $studentsQuery)->pluck('id');

            $teachersQuery = User::whereHas('role', function($q) { $q->where('name', 'معلم'); });
            if ($branchId) $teachersQuery->where('branch_id', $branchId);
            $totalTeachers = $teachersQuery->count();

            $subjectsQuery = Subject::query();
            if ($branchId) $subjectsQuery->where('branch_id', $branchId);
            $totalSubjects = $subjectsQuery->count();

            $attendanceQuery = Attendance::whereDate('date', Carbon::today());
            if ($branchId) $attendanceQuery->where('branch_id', $branchId);
            $totalAttendance = $attendanceQuery->count();
            $presentToday = (clone $attendanceQuery)->whereIn('status', ['present', 'late'])->count();
            $absentToday = (clone $attendanceQuery)->whereIn('status', ['absent', 'excused'])->count();
            $attendancePercentage = $totalAttendance > 0 ? round(($presentToday / $totalAttendance) * 100, 1) : 0;

            // Real Today's Student Attendance (from AttendanceLog)
            $studentLogQuery = \App\Models\AttendanceLog::whereDate('attendance_date', Carbon::today())
                ->when($branchId, fn($q) => $q->whereIn('user_id', $branchStudentUserIds));
            $studentTotalToday = (clone $studentLogQuery)->count();
            $studentPresentToday = (clone $studentLogQuery)->whereIn('status', ['present', 'late'])->count();
            $studentAbsentToday = (clone $studentLogQuery)->whereIn('status', ['absent', 'unexcused'])->count();
            $studentAttendancePercentage = $studentTotalToday > 0
                ? round(($studentPresentToday / $studentTotalToday) * 100, 1)
                : 0;

            $activitiesQuery = ActivityLog::with('user')->latest()->take(6);
            if ($branchId) $activitiesQuery->where('branch_id', $branchId);
            $recentActivities = $activitiesQuery->get()->map(function($log) {
                return [
                    'text' => $log->action . ' بواسطة ' . ($log->user ? $log->user->name : 'نظام'),
                    'time' => $log->created_at->diffForHumans(),
                    'type' => $this->classifyActivityType($log->action),
                ];
            });

            // Real 5-day trends (oldest -> today) for Employees & Students
            $weeklyEmployeeData = [];
            $weeklyStudentData = [];
            $days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            for ($i = 4; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $dayName = $days[$date->dayOfWeek];

                $dayAttendanceQuery = Attendance::whereDate('date', $date);
                if ($branchId) $dayAttendanceQuery->where('branch_id', $branchId);
                $empTotal = (clone $dayAttendanceQuery)->count();
                $empPresent = (clone $dayAttendanceQuery)->whereIn('status', ['present', 'late'])->count();
                $empAbsent = (clone $dayAttendanceQuery)->whereIn('status', ['absent', 'excused'])->count();
                $weeklyEmployeeData[] = [
                    'day' => $dayName,
                    'date' => $date->format('Y-m-d'),
                    'percentage' => $empTotal > 0 ? round(($empPresent / $empTotal) * 100, 1) : 0,
                    'present' => $empPresent,
                    'absent' => $empAbsent,
                ];

                $dayStudentQuery = \App\Models\AttendanceLog::whereDate('attendance_date', $date)
                    ->when($branchId, fn($q) => $q->whereIn('user_id', $branchStudentUserIds));
                $stuTotal = (clone $dayStudentQuery)->count();
                $stuPresent = (clone $dayStudentQuery)->whereIn('status', ['present', 'late'])->count();
                $stuAbsent = (clone $dayStudentQuery)->whereIn('status', ['absent', 'unexcused'])->count();
                $weeklyStudentData[] = [
                    'day' => $dayName,
                    'date' => $date->format('Y-m-d'),
                    'percentage' => $stuTotal > 0 ? round(($stuPresent / $stuTotal) * 100, 1) : 0,
                    'present' => $stuPresent,
                    'absent' => $stuAbsent,
                ];
            }

            // Real Actionable System Alerts for Branch Manager
            $systemAlerts = [];
            $pendingReqCount = \App\Models\EmployeeRequest::where('status', 'pending')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->count();
            if ($pendingReqCount > 0) {
                $systemAlerts[] = [
                    'title' => 'طلبات موظفين بانتظار المراجعة',
                    'description' => "يوجد ({$pendingReqCount}) طلب إداري قيد الانتظار",
                    'count' => $pendingReqCount,
                    'type' => 'warning',
                    'href' => route('hr.requests.index'),
                ];
            }

            $pendingLeaveCount = \App\Models\Leave::where('status', 'pending')
                ->when($branchId, fn($q) => $q->whereHas('employee.user', fn($uq) => $uq->where('branch_id', $branchId)))
                ->count();
            if ($pendingLeaveCount > 0) {
                $systemAlerts[] = [
                    'title' => 'طلبات إجازات معلقة',
                    'description' => "توجد ({$pendingLeaveCount}) إجازة بانتظار البت فيها",
                    'count' => $pendingLeaveCount,
                    'type' => 'info',
                    'href' => route('hr.leaves'),
                ];
            }

            $pendingAppraisalCount = \App\Models\EmployeeAppraisal::whereIn('status', ['pending_manager', 'pending_hr'])
                ->when($branchId, fn($q) => $q->whereHas('employee.user', fn($uq) => $uq->where('branch_id', $branchId)))
                ->count();
            if ($pendingAppraisalCount > 0) {
                $systemAlerts[] = [
                    'title' => 'تقييمات موظفين قيد الإجراء',
                    'description' => "يوجد ({$pendingAppraisalCount}) تقييم بانتظار التقييم أو اعتماد HR",
                    'count' => $pendingAppraisalCount,
                    'type' => 'info',
                    'href' => route('hr.appraisals.index'),
                ];
            }

            $unreviewedPrepCount = \App\Models\LessonPreparation::where('status', 'published')
                ->whereNull('reviewed_at')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->count();
            if ($unreviewedPrepCount > 0) {
                $systemAlerts[] = [
                    'title' => 'دفاتر تحضير بانتظار المراجعة الإشرافية',
                    'description' => "يوجد ({$unreviewedPrepCount}) تحضير منشور لم يُراجع بعد",
                    'count' => $unreviewedPrepCount,
                    'type' => 'warning',
                    'href' => route('academic.lesson-preparations'),
                ];
            }

            $pendingStudyPlanCount = \App\Models\StudyPlan::where('status', 'pending')
                ->when($branchId, fn($q) => $q->whereHas('teacher', fn($uq) => $uq->where('branch_id', $branchId)))
                ->count();
            if ($pendingStudyPlanCount > 0) {
                $systemAlerts[] = [
                    'title' => 'خطط دراسية تنتظر الاعتماد',
                    'description' => "يوجد ({$pendingStudyPlanCount}) خطة دراسية بانتظار المراجعة",
                    'count' => $pendingStudyPlanCount,
                    'type' => 'info',
                    'href' => route('academic.study-plans.index'),
                ];
            }

            if ($absentToday > 0) {
                $systemAlerts[] = [
                    'title' => 'حالات غياب موظفين اليوم',
                    'description' => "سُجّل غياب/إجازة ({$absentToday}) موظف اليوم",
                    'count' => $absentToday,
                    'type' => 'danger',
                    'href' => route('hr.attendance'),
                ];
            }

            return Inertia::render('Dashboards/BranchManagerDashboard', [
                'stats' => [
                    'students' => number_format($totalStudents),
                    'teachers' => number_format($totalTeachers),
                    'subjects' => number_format($totalSubjects),
                    'attendance_percentage' => $attendancePercentage . '%',
                    'present_today' => number_format($presentToday),
                    'absent_today' => number_format($absentToday),
                    'student_attendance_percentage' => $studentAttendancePercentage . '%',
                    'student_present_today' => number_format($studentPresentToday),
                    'student_absent_today' => number_format($studentAbsentToday),
                ],
                'systemAlerts' => $systemAlerts,
                'recentActivities' => $recentActivities,
                'weeklyEmployeeData' => $weeklyEmployeeData,
                'weeklyStudentData' => $weeklyStudentData,
                'weeklyData' => $weeklyEmployeeData,
                'pendingAppraisals' => $pendingAppraisals,
                'quickTasks' => $quickTasks,
                'latestNews' => $latestNews
            ]);
        }

        // --- Educational Supervisor Dashboard ---
        if ($roleName && str_contains($roleName, 'مشرف')) {
            $employeeId = optional($user->employee)->id;
            $todayAttendance = Attendance::where('employee_id', $employeeId)
                ->whereDate('date', Carbon::today())
                ->first();

            $unreviewedPreparationsCount = \App\Models\LessonPreparation::where('status', 'published')
                ->whereNull('reviewed_at')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->count();

            $reviewedThisMonthCount = \App\Models\LessonPreparation::where('reviewed_by', $user->id)
                ->whereMonth('reviewed_at', now()->month)
                ->whereYear('reviewed_at', now()->year)
                ->count();

            $pendingStudyPlansCount = \App\Models\StudyPlan::where('status', 'pending')
                ->when($branchId, fn($q) => $q->whereHas('teacher', fn($uq) => $uq->where('branch_id', $branchId)))
                ->count();

            $visitsThisMonthCount = \App\Models\ClassroomVisit::where('supervisor_id', $user->id)
                ->whereMonth('visit_date', now()->month)
                ->whereYear('visit_date', now()->year)
                ->count();

            $pendingCommitteeAppraisalsCount = \App\Models\EmployeeAppraisalEvaluator::where('evaluator_user_id', $user->id)
                ->where('status', 'pending')
                ->whereHas('appraisal', fn($q) => $q->where('status', 'pending_manager'))
                ->count();

            $recentUnreviewedPreps = \App\Models\LessonPreparation::with([
                    'teacher:id,name',
                    'subject:id,name',
                    'grade:id,name',
                    'division:id,name',
                ])
                ->where('status', 'published')
                ->whereNull('reviewed_at')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->latest('preparation_date')
                ->take(6)
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'lesson_title' => $p->lesson_title,
                    'teacher_name' => $p->teacher?->name ?? 'معلم',
                    'subject_name' => $p->subject?->name ?? '',
                    'grade_name' => $p->grade?->name ?? '',
                    'division_name' => $p->division?->name ?? '',
                    'preparation_date' => $p->preparation_date?->format('Y-m-d'),
                    'curriculum_progress' => $p->curriculum_progress,
                ]);

            $pendingStudyPlansList = \App\Models\StudyPlan::with([
                    'teacher:id,name',
                    'subject:id,name',
                    'grade:id,name',
                ])
                ->where('status', 'pending')
                ->when($branchId, fn($q) => $q->whereHas('teacher', fn($uq) => $uq->where('branch_id', $branchId)))
                ->latest()
                ->take(5)
                ->get()
                ->map(fn($sp) => [
                    'id' => $sp->id,
                    'title' => $sp->title,
                    'month' => $sp->month,
                    'teacher_name' => $sp->teacher?->name ?? 'معلم',
                    'subject_name' => $sp->subject?->name ?? '',
                    'grade_name' => $sp->grade?->name ?? '',
                ]);

            $recentVisits = \App\Models\ClassroomVisit::with([
                    'teacher:id,name',
                    'grade:id,name',
                    'division:id,name',
                ])
                ->where('supervisor_id', $user->id)
                ->latest('visit_date')
                ->take(5)
                ->get()
                ->map(fn($v) => [
                    'id' => $v->id,
                    'teacher_name' => $v->teacher?->name ?? 'معلم',
                    'grade_name' => $v->grade?->name ?? '',
                    'division_name' => $v->division?->name ?? '',
                    'visit_date' => $v->visit_date?->format('Y-m-d'),
                    'visit_type' => $v->visit_type,
                    'score' => $v->score,
                    'is_approved' => (bool) $v->is_approved,
                ]);

            $upcomingMeetings = \App\Models\Meeting::whereHas('participants', fn($q) => $q->where('user_id', $user->id))
                ->where(function($q) {
                    $q->whereDate('date', '>=', Carbon::today())
                      ->orWhere('status', 'scheduled');
                })
                ->orderBy('date')->orderBy('time')
                ->take(5)
                ->get();

            return Inertia::render('Dashboards/SupervisorDashboard', [
                'stats' => [
                    'unreviewed_preparations' => $unreviewedPreparationsCount,
                    'reviewed_this_month' => $reviewedThisMonthCount,
                    'pending_study_plans' => $pendingStudyPlansCount,
                    'visits_this_month' => $visitsThisMonthCount,
                    'pending_committee_appraisals' => $pendingCommitteeAppraisalsCount,
                ],
                'recentUnreviewedPreps' => $recentUnreviewedPreps,
                'pendingStudyPlansList' => $pendingStudyPlansList,
                'recentVisits' => $recentVisits,
                'pendingAppraisals' => $pendingAppraisals,
                'attendanceStatus' => $todayAttendance,
                'upcomingMeetings' => $upcomingMeetings,
                'quickTasks' => $quickTasks,
                'latestNews' => $latestNews,
            ]);
        }

        // --- Other Employees Dashboard ---
        
        $employeeId = optional($user->employee)->id;
        $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');

        $todayAttendance = Attendance::where('employee_id', $employeeId)
            ->whereDate('date', Carbon::today())
            ->first();

        // 1. Performance Metrics (Real Data)
        // Discipline Percentage
        $totalAttendanceDays = Attendance::where('employee_id', $employeeId)
            ->where('academic_year_id', $activeYearId)
            ->count();
            
        $presentDays = Attendance::where('employee_id', $employeeId)
            ->where('academic_year_id', $activeYearId)
            ->whereIn('status', ['present', 'late'])
            ->count();
            
        $disciplinePercentage = $totalAttendanceDays > 0 
            ? round(($presentDays / $totalAttendanceDays) * 100) 
            : 100;

        // Leave Balance
        $leaveBalanceQuery = \App\Models\LeaveBalance::where('employee_id', $employeeId)
            ->where('academic_year_id', $activeYearId)
            ->get();
            
        $totalLeaves = $leaveBalanceQuery->sum('total_days');
        $usedLeaves = $leaveBalanceQuery->sum('used_days');
        $remainingLeaves = $leaveBalanceQuery->isEmpty() ? 0 : ($totalLeaves - $usedLeaves);
        $performanceMetrics = [
            'discipline_percentage' => $disciplinePercentage,
            'remaining_leaves' => $remainingLeaves,
            'total_leaves' => $totalLeaves > 0 ? $totalLeaves : 21,
            'used_leaves' => $usedLeaves,
        ];

        // 3. Recent Appraisal (Real Data)
        $latestAppraisal = \App\Models\EmployeeAppraisal::with(['scores.kpi', 'cycle'])
            ->where('employee_id', $employeeId)
            ->where('status', 'completed')
            ->orderBy('id', 'desc')
            ->first();

        $recentAppraisal = null;
        if ($latestAppraisal) {
            $scoresList = $latestAppraisal->scores->sortByDesc('manager_score');

            $kpiStrengths = [];
            foreach ($scoresList as $score) {
                if ($score->kpi) {
                    $kpiStrengths[] = $score->kpi->name;
                }
            }
            $kpiImprovements = array_reverse($kpiStrengths);

            $idpStrengths = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) ($latestAppraisal->strengths ?? '')))));
            $idpImprovements = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) ($latestAppraisal->improvement_areas ?? '')))));

            $recentAppraisal = [
                'id' => $latestAppraisal->id,
                'final_score' => $latestAppraisal->final_score ?? 0,
                'cycle_name' => $latestAppraisal->cycle?->title ?? 'التقييم الأخير',
                'strengths' => !empty($idpStrengths) ? array_slice($idpStrengths, 0, 3) : array_slice($kpiStrengths, 0, 2),
                'improvements' => !empty($idpImprovements) ? array_slice($idpImprovements, 0, 3) : array_slice($kpiImprovements, 0, 2),
                'strengths_text' => $latestAppraisal->strengths,
                'improvement_areas_text' => $latestAppraisal->improvement_areas,
                'recommended_training' => $latestAppraisal->recommended_training,
                'final_recommendation' => \App\Models\EmployeeAppraisal::recommendationLabel($latestAppraisal->final_recommendation),
                'comments' => $latestAppraisal->manager_comments ?? 'لا توجد ملاحظات مسجلة.',
            ];
        }

        // 2. Daily Timeline (Meetings + Today's Tasks)
        $todaysMeetings = \App\Models\Meeting::whereHas('participants', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereDate('date', Carbon::today())
            ->get()
            ->map(function ($meeting) {
                $startTime = Carbon::parse($meeting->time);
                $endTime = $startTime->copy()->addHours(1);
                return [
                    'id' => 'meeting_' . $meeting->id,
                    'title' => $meeting->title,
                    'type' => 'meeting',
                    'location' => $meeting->location ?? 'غرفة الاجتماعات',
                    'start_time' => $startTime->format('H:i'),
                    'end_time' => $endTime->format('H:i'),
                    'start_datetime' => $startTime,
                ];
            });

        $todaysDueTasks = \App\Models\Task::where('assigned_to', $user->id)
            ->whereDate('due_date', Carbon::today())
            ->where('status', '!=', 'completed')
            ->get()
            ->map(function ($task) {
                $startTime = Carbon::today()->setTime(9, 0);
                return [
                    'id' => 'task_' . $task->id,
                    'title' => $task->title,
                    'type' => 'task',
                    'location' => 'مهمة مستحقة اليوم',
                    'start_time' => $startTime->format('H:i'),
                    'end_time' => $startTime->copy()->addMinutes(30)->format('H:i'),
                    'start_datetime' => $startTime,
                ];
            });

        $todayTimeline = collect($todaysMeetings)
            ->concat($todaysDueTasks)
            ->sortBy('start_datetime')
            ->values()
            ->map(function ($item) {
                $item['formatted_time'] = Carbon::parse($item['start_time'])->translatedFormat('h:i A') . ' - ' . Carbon::parse($item['end_time'])->translatedFormat('h:i A');
                unset($item['start_datetime']);
                return $item;
            });

        $upcomingMeetings = \App\Models\Meeting::whereHas('participants', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where(function($q) {
                $q->whereDate('date', '>=', Carbon::today())
                  ->orWhere('status', 'scheduled');
            })
            ->orderBy('date')->orderBy('time')
            ->take(5)
            ->get();

        $pendingViolations = \App\Models\EmployeeViolation::with('violationType')
            ->where('user_id', $user->id)
            ->whereNull('employee_signature')
            ->get();

        $leaderboard = \App\Models\EmployeeAchievement::selectRaw('user_id, SUM(points) as total_points')
            ->where('academic_year_id', $activeYearId)
            ->where('points', '>', 0)
            ->groupBy('user_id')
            ->orderByDesc('total_points')
            ->with('user:id,name')
            ->take(5)
            ->get();

        return Inertia::render('Dashboards/EmployeeDashboard', [
            'attendanceStatus' => $todayAttendance,
            'upcomingMeetings' => $upcomingMeetings,
            'pendingViolations' => $pendingViolations,
            'pendingAppraisals' => $pendingAppraisals,
            'leaderboard' => $leaderboard,
            'quickTasks' => $quickTasks,
            'latestNews' => $latestNews,
            'performanceMetrics' => $performanceMetrics,
            'todayTimeline' => $todayTimeline,
            'recentAppraisal' => $recentAppraisal,
        ]);
    }

    private function classifyActivityType(?string $action): string
    {
        $text = mb_strtolower((string) $action);

        foreach (['delete', 'destroy', 'reject', 'return', 'violation', 'disable', 'حذف', 'رفض', 'إلغاء', 'مخالفة', 'إرجاع', 'تعطيل'] as $kw) {
            if (str_contains($text, $kw)) {
                return 'warning';
            }
        }

        foreach (['create', 'store', 'approve', 'publish', 'activate', 'إنشاء', 'إضافة', 'اعتماد', 'موافقة', 'نشر', 'تفعيل', 'تسجيل'] as $kw) {
            if (str_contains($text, $kw)) {
                return 'success';
            }
        }

        return 'info';
    }

    private function getPendingAppraisalsForUser(User $user): array
    {
        $empId = $user->employee?->id;
        $roleName = $user->role?->name;
        $isSystemAdmin = $roleName === 'مدير النظام';
        $isBranchManager = in_array($roleName, ['مدير الفرع', 'مدير فرع'], true);
        $canManageHr = $user->hasPermission('إدارة التقييمات الإدارية') || $isSystemAdmin || $isBranchManager;

        $selfItems = $empId
            ? \App\Models\EmployeeAppraisal::with('cycle:id,title')
                ->where('employee_id', $empId)
                ->where('status', 'pending_self')
                ->latest()
                ->get()
            : collect();

        $evalItems = \App\Models\EmployeeAppraisal::with(['cycle:id,title', 'employee.user:id,name'])
            ->where('status', 'pending_manager')
            ->where(function ($q) use ($user, $empId) {
                $q->whereHas('evaluators', fn($eq) => $eq->where('evaluator_user_id', $user->id)->where('status', 'pending'));
                if ($empId) {
                    $q->orWhere(function ($mq) use ($empId, $user) {
                        $mq->where('manager_id', $empId)
                           ->whereDoesntHave('evaluators', fn($eq) => $eq->where('evaluator_user_id', $user->id)->where('status', 'submitted'));
                    });
                }
            })
            ->latest()
            ->get();

        $hrItems = $canManageHr
            ? \App\Models\EmployeeAppraisal::with(['cycle:id,title', 'employee.user:id,name'])
                ->where('status', 'pending_hr')
                ->when(!$isSystemAdmin && $user->branch_id, fn($q) => $q->whereHas('employee.user', fn($uq) => $uq->where('branch_id', $user->branch_id)))
                ->latest()
                ->get()
            : collect();

        $combined = collect();
        foreach ($selfItems as $item) {
            $combined->push([
                'id' => $item->id,
                'action_type' => 'self',
                'employee_name' => $user->name,
                'cycle_title' => $item->cycle?->title ?? 'دورة تقييم',
                'status' => $item->status,
            ]);
        }
        foreach ($evalItems as $item) {
            $combined->push([
                'id' => $item->id,
                'action_type' => 'evaluator',
                'employee_name' => $item->employee?->user?->name ?? 'موظف',
                'cycle_title' => $item->cycle?->title ?? 'دورة تقييم',
                'status' => $item->status,
            ]);
        }
        foreach ($hrItems as $item) {
            $combined->push([
                'id' => $item->id,
                'action_type' => 'hr',
                'employee_name' => $item->employee?->user?->name ?? 'موظف',
                'cycle_title' => $item->cycle?->title ?? 'دورة تقييم',
                'status' => $item->status,
            ]);
        }

        return [
            'total' => $selfItems->count() + $evalItems->count() + $hrItems->count(),
            'self_count' => $selfItems->count(),
            'evaluator_count' => $evalItems->count(),
            'hr_count' => $hrItems->count(),
            'items' => $combined->take(4)->values()->all(),
        ];
    }

    public function storeQuickTask(Request $request)
    {
        $request->validate(['text' => 'required|string|max:255']);
        \App\Models\Task::create([
            'branch_id' => auth()->user()->branch_id ?? 1,
            'title' => $request->text,
            'status' => 'todo',
            'priority' => 'medium',
            'assigned_to' => auth()->id(),
            'assigned_by' => auth()->id(),
        ]);
        return back();
    }

    public function toggleQuickTask(\App\Models\Task $task)
    {
        if ($task->assigned_to !== auth()->id()) abort(403);
        $task->update(['status' => $task->status === 'completed' ? 'todo' : 'completed']);
        return back();
    }

    public function destroyQuickTask(\App\Models\Task $task)
    {
        if ($task->assigned_to !== auth()->id()) abort(403);
        $task->delete();
        return back();
    }
}
