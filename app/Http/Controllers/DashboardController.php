<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\User;
use App\Models\Subject;
use App\Models\Attendance;
use App\Models\ActivityLog;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $roleName = $user->role ? $user->role->name : null;
        $isSystemAdmin = $roleName === 'مدير النظام';
        $branchId = $isSystemAdmin ? null : $user->branch_id;

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

            return Inertia::render('SystemAdminDashboard', [
                'stats' => [
                    'branches' => number_format($totalBranches),
                    'active_branches' => number_format($activeBranches),
                    'users' => number_format($totalUsers),
                    'managers' => number_format($totalManagers),
                ],
                'recentActivities' => $recentActivities
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
            $totalDivisions = \App\Models\MasterTimetable::where('teacher_id', $user->id)->distinct('division_id')->count('division_id');
            $totalSubjects = \App\Models\MasterTimetable::where('teacher_id', $user->id)->distinct('subject_id')->count('subject_id');

            return Inertia::render('Dashboards/TeacherDashboard', [
                'todayTimetable' => $todayTimetable,
                'attendanceStatus' => $todayAttendance,
                'upcomingMeetings' => $upcomingMeetings,
                'stats' => [
                    'divisions' => $totalDivisions,
                    'subjects' => $totalSubjects,
                ]
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
                'weeklyData' => $weeklyData
            ]);
        }

        // --- Other Employees Dashboard ---
        
        $todayAttendance = Attendance::where('employee_id', optional($user->employee)->id)
            ->whereDate('date', Carbon::today())
            ->first();

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
            ->where('employee_id', optional($user->employee)->id)
            ->whereNull('signed_at')
            ->get();

        return Inertia::render('Dashboards/EmployeeDashboard', [
            'attendanceStatus' => $todayAttendance,
            'upcomingMeetings' => $upcomingMeetings,
            'pendingViolations' => $pendingViolations
        ]);
    }
}
