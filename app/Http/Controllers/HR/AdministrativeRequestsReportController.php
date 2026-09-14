<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeRequest;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Spatie\LaravelPdf\Facades\Pdf;

class AdministrativeRequestsReportController extends Controller
{
    private function getFilterData(Request $request, $isPaginated = true)
    {
        $user = auth()->user();
        $branchId = $user ? $user->branch_id : null;

        $search = $request->input('search', '');
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');
        $employeeId = $request->input('employee_id');
        $departmentId = $request->input('department_id');
        $requestsOnly = filter_var($request->input('requests_only', true), FILTER_VALIDATE_BOOLEAN);

        if ($startDateInput && $endDateInput) {
            $startDate = Carbon::parse($startDateInput)->startOfDay();
            $endDate = Carbon::parse($endDateInput)->endOfDay();
        } else {
            $startDate = now()->startOfMonth()->startOfDay();
            $endDate = now()->endOfMonth()->endOfDay();
        }

        // Base Query for Employees
        $baseEmployeesQuery = User::whereHas('employee')
            ->with(['employee.department']);

        if ($branchId) {
            $baseEmployeesQuery->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            });
        }
            
        if ($search) {
            $baseEmployeesQuery->where('name', 'like', '%' . $search . '%');
        }

        if ($employeeId) {
            $baseEmployeesQuery->where('id', $employeeId);
        }

        if ($departmentId) {
            $baseEmployeesQuery->whereHas('employee', function($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        $employeesQuery = clone $baseEmployeesQuery;

        if ($requestsOnly) {
            $employeesQuery->whereHas('employee.requests', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            });
        }

        // --- 1. Global KPIs ---
        $baseEmployeeRecordIds = \App\Models\Employee::whereIn('user_id', $baseEmployeesQuery->pluck('users.id'))->pluck('id');

        $requestsStats = EmployeeRequest::whereIn('employee_id', $baseEmployeeRecordIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                COUNT(*) as total_requests,
                COUNT(DISTINCT employee_id) as unique_employees
            ')
            ->first();

        $kpis = [
            'total_requests' => (int) ($requestsStats->total_requests ?? 0),
            'unique_employees_with_requests' => (int) ($requestsStats->unique_employees ?? 0),
        ];

        // --- 2. Department Chart Data ---
        $deptStatsRaw = \Illuminate\Support\Facades\DB::table('employees')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->leftJoin('departments', 'employees.department_id', '=', 'departments.id')
            ->join('employee_requests', function($join) use ($startDate, $endDate) {
                $join->on('employees.id', '=', 'employee_requests.employee_id')
                     ->whereBetween('employee_requests.created_at', [$startDate, $endDate]);
            })
            ->whereIn('employees.id', $baseEmployeeRecordIds)
            ->select(
                \Illuminate\Support\Facades\DB::raw('COALESCE(departments.name, "غير محدد") as name'),
                \Illuminate\Support\Facades\DB::raw('COUNT(employee_requests.id) as total_requests')
            )
            ->groupBy(\Illuminate\Support\Facades\DB::raw('COALESCE(departments.name, "غير محدد")'))
            ->get();

        $departmentChartData = [];
        foreach ($deptStatsRaw as $stat) {
            $departmentChartData[] = [
                'name' => $stat->name,
                'total_requests' => (int) $stat->total_requests,
            ];
        }

        // --- 3. Pagination & Fetching Requests ---
        if ($isPaginated) {
            $employees = clone $employeesQuery;
            $employees = $employees->withCount(['employee' => function($q) {}]) // dummy just for avoiding orderby issues if any
                ->paginate(15)->withQueryString();
            
            $employeesList = $employees->items();
        } else {
            $employees = clone $employeesQuery;
            $employeesList = $employees->get();
        }

        $employeeIds = [];
        foreach ($employeesList as $user) {
            if ($user->employee) {
                $employeeIds[] = $user->employee->id;
            }
        }

        // Fetch Requests for paginated employees only
        $requestsQuery = EmployeeRequest::whereIn('employee_id', $employeeIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $allRequests = $requestsQuery->groupBy('employee_id');

        $teachersData = [];

        foreach ($employeesList as $emp) {
            $deptName = $emp->employee && $emp->employee->department 
                ? $emp->employee->department->name 
                : 'غير محدد';

            $empId = $emp->employee ? $emp->employee->id : null;
            if (!$empId) continue;

            $empRequests = $allRequests->get($empId, collect());
            $totalCount = $empRequests->count();
            
            if ($totalCount === 0 && $requestsOnly) {
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

            $teachersData[] = [
                'id' => $emp->id,
                'name' => $emp->name,
                'employee_name' => $emp->name,
                'department' => $deptName,
                'total_requests' => $totalCount,
                'records' => $records,
            ];
        }

        // Ensure sorting by total_requests descending for the paginated slice
        usort($teachersData, function($a, $b) {
            return $b['total_requests'] <=> $a['total_requests'];
        });

        $paginatedData = [];
        if ($isPaginated) {
            $paginatedData = $employees->toArray();
            $paginatedData['data'] = $teachersData;
        } else {
            $paginatedData = $teachersData;
        }

        // All employees for filter dropdown
        $allEmployeesList = User::whereHas('employee')
            ->when($branchId, fn($q) => $q->where(fn($sub) => $sub->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->select('id', 'name')
            ->get();

        $departments = Department::when($branchId, fn($q) => $q->where('branch_id', $branchId))->select('id', 'name')->get();

        return [
            'employeesData' => $paginatedData,
            'kpis' => $kpis,
            'departmentChartData' => $departmentChartData,
            'allEmployeesList' => $allEmployeesList,
            'departments' => $departments,
            'periodStart' => $startDate->format('Y-m-d'),
            'periodEnd' => $endDate->format('Y-m-d'),
        ];
    }

    public function report(Request $request)
    {
        $data = $this->getFilterData($request);

        return Inertia::render('HR/Reports/AdministrativeRequests', [
            'employeesData' => $data['employeesData'],
            'kpis' => $data['kpis'],
            'departmentChartData' => $data['departmentChartData'],
            'allEmployees' => $data['allEmployeesList'],
            'departments' => $data['departments'],
            'periodStart' => $data['periodStart'],
            'periodEnd' => $data['periodEnd'],
            'filters' => [
                'search' => $request->input('search', ''),
                'start_date' => $request->input('start_date', $data['periodStart']),
                'end_date' => $request->input('end_date', $data['periodEnd']),
                'employee_id' => $request->input('employee_id', ''),
                'department_id' => $request->input('department_id', ''),
                'requests_only' => filter_var($request->input('requests_only', true), FILTER_VALIDATE_BOOLEAN),
            ]
        ]);
    }

    public function downloadPdf(Request $request)
    {
        $data = $this->getFilterData($request, false);
        
        $printSettings = json_decode($request->input('printSettings', '{}'), true);
        $paperSize = $printSettings['paperSize'] ?? 'A4';
        $brandColor = $printSettings['brandColor'] ?? '#63a22f';
        $orientation = $printSettings['orientation'] ?? 'portrait';
        $marginSetting = $printSettings['margins'] ?? 'normal';
        
        $margins = match ($marginSetting) {
            'none' => [0, 0, 0, 0],
            '1cm' => [10, 10, 10, 10],
            '2cm' => [20, 20, 20, 20],
            default => [15, 15, 15, 15],
        };

        if ($orientation === 'landscape') {
            $paperSize = \Spatie\LaravelPdf\Enums\Format::tryFrom(strtolower($paperSize)) ?? \Spatie\LaravelPdf\Enums\Format::A4;
            $margins = [$margins[0], $margins[1], $margins[2], $margins[3]];
        }

        $data['printSettings'] = $printSettings;
        $data['brandColor'] = $brandColor;
        $data['watermark'] = $printSettings['watermark'] ?? 'none';
        $data['orientation'] = $orientation;

        $footerHtml = '
            <div style="width: 100%; padding: 0 40px 10px 40px; margin: 0; font-family: tahoma, arial, sans-serif; direction: rtl; box-sizing: border-box;">
                <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 9px; color: #64748b;">
                    <div style="width: 33%; text-align: right;">
                        <strong style="color: ' . $brandColor . ';">نظام الإدارة الذكية</strong> (Smart School)
                    </div>
                    <div style="width: 33%; text-align: center; color: #94a3b8;">
                        طُبع بتاريخ: ' . now()->format('Y-m-d H:i') . '
                    </div>
                    <div style="width: 33%; text-align: left;">
                        <span style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 12px; font-weight: bold; color: #475569; display: inline-block;">
                            صفحة <span class="pageNumber"></span> / <span class="totalPages"></span>
                        </span>
                    </div>
                </div>
            </div>
        ';

        $pdf = Pdf::view('pdf.hr.administrative-requests', $data)
            ->format($paperSize)
            ->margins($margins[0], $margins[1], $margins[2] + 12, $margins[3])
            ->footerHtml($footerHtml);

        if ($orientation === 'landscape') {
            $pdf->landscape();
        }

        return $pdf->withBrowsershot(function ($browsershot) {
                $browsershot->setChromePath('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
                           ->noSandbox()
                           ->showBackground()
                           ->waitUntilNetworkIdle()
                           ->delay(2000);
            })
            ->download('administrative_requests_report.pdf');
    }
}
