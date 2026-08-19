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
            ->take(3)
            ->get()
            ->map(function($news) {
                return [
                    'id' => $news->id,
                    'title' => $news->title,
                    'category' => $news->category,
                    'image_url' => $news->image_url,
                    'published_at' => $news->published_at->diffForHumans(),
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

        if ($isSystemAdmin) {
            $totalBranches = \App\Models\Branch::count();
            $activeBranches = \App\Models\Branch::where('is_active', true)->count();
            $totalUsers = User::count();
            
            $roleBranchManager = \App\Models\Role::where('name', 'مدير الفرع')->first();
            $totalManagers = $roleBranchManager ? User::where('role_id', $roleBranchManager->id)->count() : 0;
            
            $recentActivities = ActivityLog::with('user')->latest()->take(8)->get()->map(function($log) {
                return [
                    'text' => $log->action . ' بواسطة ' . ($log->user ? $log->user->name : 'نظام'),
                    'time' => $log->created_at->diffForHumans(),
                    'type' => 'info'
                ];
            });

            $serverMetrics = $serverMonitor->getMetrics();

            return Inertia::render('SystemAdminDashboard', [
                'stats' => [
                    'branches' => number_format($totalBranches),
                    'active_branches' => number_format($activeBranches),
                    'users' => number_format($totalUsers),
                    'managers' => number_format($totalManagers),
                ],
                'recentActivities' => $recentActivities,
                'serverMetrics' => $serverMetrics
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

            return Inertia::render('Dashboards/TeacherDashboard', [
                'todayTimetable' => $todayTimetable,
                'attendanceStatus' => $todayAttendance,
                'upcomingMeetings' => $upcomingMeetings,
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
        if ($roleName === 'مدير الفرع') {
            $studentsQuery = User::whereHas('role', function($q) { $q->where('name', 'طالب'); });
            if ($branchId) $studentsQuery->where('branch_id', $branchId);
            $totalStudents = $studentsQuery->count();

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

            $activitiesQuery = ActivityLog::with('user')->latest()->take(5);
            if ($branchId) $activitiesQuery->where('branch_id', $branchId);
            $recentActivities = $activitiesQuery->get()->map(function($log) {
                return [
                    'text' => $log->action . ' بواسطة ' . ($log->user ? $log->user->name : 'نظام'),
                    'time' => $log->created_at->diffForHumans(),
                    'type' => 'info'
                ];
            });

            $weeklyData = [];
            $days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            for ($i = 4; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $dayName = $days[$date->dayOfWeek];
                $dayAttendanceQuery = Attendance::whereDate('date', $date);
                if ($branchId) $dayAttendanceQuery->where('branch_id', $branchId);
                
                $total = (clone $dayAttendanceQuery)->count();
                $present = (clone $dayAttendanceQuery)->whereIn('status', ['present', 'late'])->count();
                $absent = (clone $dayAttendanceQuery)->whereIn('status', ['absent', 'excused'])->count();
                $percentage = $total > 0 ? round(($present / $total) * 100, 1) : 0;
                
                $weeklyData[] = [
                    'day' => $dayName,
                    'percentage' => $percentage,
                    'present' => $present,
                    'absent' => $absent,
                    'x' => 50 + ((4 - $i) * 100),
                    'y' => 180 - ($percentage * 0.8)
                ];
            }

            return Inertia::render('Dashboards/BranchManagerDashboard', [
                'stats' => [
                    'students' => number_format($totalStudents),
                    'teachers' => number_format($totalTeachers),
                    'subjects' => number_format($totalSubjects),
                    'attendance_percentage' => $attendancePercentage . '%',
                    'present_today' => number_format($presentToday),
                    'absent_today' => number_format($absentToday)
                ],
                'recentActivities' => $recentActivities,
                'weeklyData' => array_reverse($weeklyData),
                'quickTasks' => $quickTasks,
                'latestNews' => $latestNews
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
            
            $strengths = [];
            foreach($scoresList as $score) {
                if ($score->kpi) {
                    $strengths[] = $score->kpi->name;
                }
            }
            $improvements = array_reverse($strengths);
            
            $recentAppraisal = [
                'final_score' => $latestAppraisal->final_score ?? 0,
                'cycle_name' => $latestAppraisal->cycle ? $latestAppraisal->cycle->name : 'التقييم الأخير',
                'strengths' => array_slice($strengths, 0, 2),
                'improvements' => array_slice($improvements, 0, 2),
                'comments' => $latestAppraisal->manager_comments ?? 'لا توجد ملاحظات مسجلة.',
            ];
        }

        // 2. Daily Timeline (Real Data)
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
            
        // We'll also fetch Tasks that have a due date of today to show on timeline
        // Note: The tasks table might only have 'created_at', but if it has 'due_date' we could use it. 
        // For safety, we'll just show today's meetings as the primary timeline events.
        $todayTimeline = collect($todaysMeetings)
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

        // --- Student Dashboard ---
        if ($roleName === 'طالب') {
            return redirect()->route('student.dashboard');
        }

        // --- Parent Dashboard ---
        if ($roleName === 'ولي أمر') {
            return redirect()->route('parent.dashboard');
        }

        return Inertia::render('Dashboards/EmployeeDashboard', [
            'attendanceStatus' => $todayAttendance,
            'upcomingMeetings' => $upcomingMeetings,
            'pendingViolations' => $pendingViolations,
            'leaderboard' => $leaderboard,
            'quickTasks' => $quickTasks,
            'latestNews' => $latestNews,
            'performanceMetrics' => $performanceMetrics,
            'todayTimeline' => $todayTimeline,
            'recentAppraisal' => $recentAppraisal,
        ]);
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
