<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeViolation;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class EmployeeViolationReportController extends Controller
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
            // Default to current academic year or last 6 months. Let's use current month to be consistent with others
            $startDate = now()->startOfMonth()->startOfDay();
            $endDate = now()->endOfMonth()->endOfDay();
        }

        // Base Query for Employees (All users who are employees)
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

        // Fetch Violations query
        $violationsQuery = EmployeeViolation::with(['violationType'])
            ->whereIn('user_id', $employeeIds)
            ->whereBetween('violation_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);

        $allViolations = $violationsQuery->get()->groupBy('user_id');

        $teachersData = [];
        $deptStatsMap = [];

        $totalViolationsAll = 0;
        $totalRepeatedAll = 0;
        $totalPendingAll = 0;
        $totalActionTakenAll = 0;

        foreach ($employees as $emp) {
            $deptName = $emp->employee && $emp->employee->department 
                ? $emp->employee->department->name 
                : 'غير محدد';

            $empViolations = $allViolations->get($emp->id, collect());

            $totalCount = $empViolations->count();
            if ($totalCount === 0 && ($search || $employeeId || $departmentId)) {
                // if we are searching, we might want to see them even with 0, but usually reports only show ones with records if not searching explicitly for them.
                // Actually, let's keep them if they match filters, to show they have 0 violations.
                // Wait, if no filters, it might be too many. Let's only include if they have violations OR if explicitly searched.
            }
            
            // To keep it clean, let's only include employees with violations, unless a specific employee is searched
            if ($totalCount === 0 && !$employeeId) {
                continue;
            }

            $pendingCount = $empViolations->where('status', 'pending')->count();
            $actionTakenCount = $empViolations->where('status', '!=', 'pending')->count();
            $repeatedCount = $empViolations->filter(function($v) { return (int)$v->repetition_level > 1; })->count();

            $records = [];
            foreach ($empViolations as $violation) {
                $records[] = [
                    'id' => $violation->id,
                    'violation_date' => is_string($violation->violation_date) ? $violation->violation_date : $violation->violation_date->format('Y-m-d'),
                    'type_name' => $violation->violationType ? $violation->violationType->name : 'مخالفة',
                    'repetition_level' => $violation->repetition_level,
                    'details' => $violation->details ?: '',
                    'action_taken' => $violation->action_taken ?: '',
                    'status' => $violation->status == 'pending' ? 'قيد الإجراء' : 'تم اتخاذ إجراء',
                ];
            }

            $totalViolationsAll += $totalCount;
            $totalPendingAll += $pendingCount;
            $totalActionTakenAll += $actionTakenCount;
            $totalRepeatedAll += $repeatedCount;

            // Department Stats Aggregation
            if (!isset($deptStatsMap[$deptName])) {
                $deptStatsMap[$deptName] = [
                    'name' => $deptName,
                    'total' => 0,
                    'pending' => 0,
                    'action_taken' => 0,
                ];
            }
            $deptStatsMap[$deptName]['total'] += $totalCount;
            $deptStatsMap[$deptName]['pending'] += $pendingCount;
            $deptStatsMap[$deptName]['action_taken'] += $actionTakenCount;

            $teachersData[] = [
                'id' => $emp->id,
                'name' => $emp->name,
                'employee_name' => $emp->name,
                'department' => $deptName,
                'total_violations' => $totalCount,
                'pending_violations' => $pendingCount,
                'action_taken' => $actionTakenCount,
                'records' => $records,
            ];
        }

        $departmentChartData = [];
        foreach ($deptStatsMap as $deptName => $data) {
            $departmentChartData[] = [
                'name' => $deptName,
                'total' => $data['total'],
                'pending' => $data['pending'],
                'action_taken' => $data['action_taken'],
            ];
        }

        $kpis = [
            'total_violations' => $totalViolationsAll,
            'pending_violations' => $totalPendingAll,
            'action_taken' => $totalActionTakenAll,
            'repeated_violations' => $totalRepeatedAll,
            'unique_violators' => count(array_filter($teachersData, fn($t) => $t['total_violations'] > 0)),
        ];

        // All employees for filter dropdown
        $allEmployeesList = User::whereHas('employee')
            ->when($branchId, fn($q) => $q->where(fn($sub) => $sub->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->select('id', 'name')
            ->get();

        $departments = Department::when($branchId, fn($q) => $q->where('branch_id', $branchId))->select('id', 'name')->get();

        return Inertia::render('HR/Reports/EmployeeViolations', [
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
