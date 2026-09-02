<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeRequest;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AdministrativeRequestsReportController extends Controller
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
        $employeeIds = $employees->pluck('employee.id')->toArray();

        // Fetch Requests
        $requestsQuery = EmployeeRequest::whereIn('employee_id', $employeeIds)
            ->whereBetween('created_at', [$startDate, $endDate]);

        $allRequests = $requestsQuery->get()->groupBy('employee_id');

        $teachersData = [];
        $deptStatsMap = [];

        $totalRequestsAll = 0;

        foreach ($employees as $emp) {
            $deptName = $emp->employee && $emp->employee->department 
                ? $emp->employee->department->name 
                : 'غير محدد';

            $empId = $emp->employee ? $emp->employee->id : null;
            if (!$empId) continue;

            $empRequests = $allRequests->get($empId, collect());

            $totalCount = $empRequests->count();
            
            if ($totalCount === 0 && !$employeeId) {
                continue;
            }

            $records = [];
            
            foreach ($empRequests as $req) {
                $records[] = [
                    'id' => $req->id,
                    'created_at' => Carbon::parse($req->created_at)->format('Y-m-d'),
                    'type_name' => $req->type_label,
                    'status' => $req->status_label,
                    'details' => $req->employee_notes ?: 'لا توجد تفاصيل',
                ];
            }

            $totalRequestsAll += $totalCount;

            // Department Stats Aggregation
            if (!isset($deptStatsMap[$deptName])) {
                $deptStatsMap[$deptName] = [
                    'name' => $deptName,
                    'total_requests' => 0,
                ];
            }
            $deptStatsMap[$deptName]['total_requests'] += $totalCount;

            $teachersData[] = [
                'id' => $emp->id,
                'name' => $emp->name,
                'employee_name' => $emp->name,
                'department' => $deptName,
                'total_requests' => $totalCount,
                'records' => $records,
            ];
        }

        $departmentChartData = [];
        foreach ($deptStatsMap as $deptName => $data) {
            $departmentChartData[] = [
                'name' => $deptName,
                'total_requests' => $data['total_requests'],
            ];
        }

        $kpis = [
            'total_requests' => $totalRequestsAll,
            'unique_employees_with_requests' => count(array_filter($teachersData, fn($t) => $t['total_requests'] > 0)),
        ];

        // All employees for filter dropdown
        $allEmployeesList = User::whereHas('employee')
            ->when($branchId, fn($q) => $q->where(fn($sub) => $sub->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->select('id', 'name')
            ->get();

        $departments = Department::when($branchId, fn($q) => $q->where('branch_id', $branchId))->select('id', 'name')->get();

        return Inertia::render('HR/Reports/AdministrativeRequests', [
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
