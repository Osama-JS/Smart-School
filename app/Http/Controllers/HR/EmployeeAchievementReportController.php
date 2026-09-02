<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeAchievement;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class EmployeeAchievementReportController extends Controller
{
    public function report(Request $request)
    {
        $user = auth()->user();
        $branchId = $user ? $user->branch_id : null;

        $search = $request->input('search', '');
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');
        $employeeId = $request->input('employee_id');
        $departmentId = $request->input('department_id');

        if ($startDateInput && $endDateInput) {
            $startDate = Carbon::parse($startDateInput)->startOfDay();
            $endDate = Carbon::parse($endDateInput)->endOfDay();
        } else {
            $startDate = now()->startOfMonth()->startOfDay();
            $endDate = now()->endOfMonth()->endOfDay();
        }

        // Base Query for Employees
        $employeesQuery = User::whereHas('employee')
            ->with(['employee.department']);

        if ($branchId) {
            $employeesQuery->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            });
        }
            
        if ($search) {
            $employeesQuery->where('name', 'like', '%' . $search . '%');
        }

        if ($employeeId) {
            $employeesQuery->where('id', $employeeId);
        }

        if ($departmentId) {
            $employeesQuery->whereHas('employee', function($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        $employees = $employeesQuery->get();
        $employeeIds = $employees->pluck('id')->toArray();

        // Fetch Achievements query
        $achievementsQuery = EmployeeAchievement::with(['achievementType'])
            ->whereIn('user_id', $employeeIds)
            ->whereBetween('achievement_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);

        $allAchievements = $achievementsQuery->get()->groupBy('user_id');

        $teachersData = [];
        $deptStatsMap = [];

        $totalAchievementsAll = 0;
        $totalPointsAll = 0;

        foreach ($employees as $emp) {
            $deptName = $emp->employee && $emp->employee->department 
                ? $emp->employee->department->name 
                : 'غير محدد';

            $empAchievements = $allAchievements->get($emp->id, collect());

            $totalCount = $empAchievements->count();
            
            if ($totalCount === 0 && !$employeeId) {
                continue;
            }

            $totalPoints = $empAchievements->sum('points');

            $records = [];
            foreach ($empAchievements as $achievement) {
                $records[] = [
                    'id' => $achievement->id,
                    'achievement_date' => is_string($achievement->achievement_date) ? $achievement->achievement_date : $achievement->achievement_date->format('Y-m-d'),
                    'type_name' => $achievement->achievementType ? $achievement->achievementType->name : 'إنجاز',
                    'points' => $achievement->points,
                    'details' => $achievement->details ?: '',
                ];
            }

            $totalAchievementsAll += $totalCount;
            $totalPointsAll += $totalPoints;

            // Department Stats Aggregation
            if (!isset($deptStatsMap[$deptName])) {
                $deptStatsMap[$deptName] = [
                    'name' => $deptName,
                    'total_achievements' => 0,
                    'total_points' => 0,
                ];
            }
            $deptStatsMap[$deptName]['total_achievements'] += $totalCount;
            $deptStatsMap[$deptName]['total_points'] += $totalPoints;

            $teachersData[] = [
                'id' => $emp->id,
                'name' => $emp->name,
                'employee_name' => $emp->name,
                'department' => $deptName,
                'total_achievements' => $totalCount,
                'total_points' => $totalPoints,
                'records' => $records,
            ];
        }

        $departmentChartData = [];
        foreach ($deptStatsMap as $deptName => $data) {
            $departmentChartData[] = [
                'name' => $deptName,
                'total_achievements' => $data['total_achievements'],
                'total_points' => $data['total_points'],
            ];
        }

        $kpis = [
            'total_achievements' => $totalAchievementsAll,
            'total_points' => $totalPointsAll,
            'unique_achievers' => count(array_filter($teachersData, fn($t) => $t['total_achievements'] > 0)),
        ];

        // All employees for filter dropdown
        $allEmployeesList = User::whereHas('employee')
            ->when($branchId, fn($q) => $q->where(fn($sub) => $sub->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->select('id', 'name')
            ->get();

        $departments = Department::when($branchId, fn($q) => $q->where('branch_id', $branchId))->select('id', 'name')->get();

        return Inertia::render('HR/Reports/EmployeeAchievements', [
            'employeesData' => $teachersData,
            'kpis' => $kpis,
            'departmentChartData' => $departmentChartData,
            'allEmployees' => $allEmployeesList,
            'departments' => $departments,
            'periodStart' => $startDate->format('Y-m-d'),
            'periodEnd' => $endDate->format('Y-m-d'),
            'filters' => [
                'search' => $search,
                'start_date' => $request->input('start_date', $startDate->format('Y-m-d')),
                'end_date' => $request->input('end_date', $endDate->format('Y-m-d')),
                'employee_id' => $employeeId ?: '',
                'department_id' => $departmentId ?: '',
            ]
        ]);
    }
}
