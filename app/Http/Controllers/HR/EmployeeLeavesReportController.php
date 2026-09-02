<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Spatie\LaravelPdf\Facades\Pdf;

class EmployeeLeavesReportController extends Controller
{
    private function getFilterData(Request $request)
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

        // Fetch Leaves query. Leave belongs to Employee, not User.
        // Wait, Leave model has employee_id.
        $leavesQuery = Leave::with(['leaveType'])
            ->whereIn('employee_id', $employeeIds)
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                  ->orWhereBetween('end_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
            });

        $allLeaves = $leavesQuery->get()->groupBy('employee_id');

        $teachersData = [];
        $deptStatsMap = [];

        $totalLeavesAll = 0;
        $totalLeaveDaysAll = 0;

        foreach ($employees as $emp) {
            $deptName = $emp->employee && $emp->employee->department 
                ? $emp->employee->department->name 
                : 'غير محدد';

            $empId = $emp->employee ? $emp->employee->id : null;
            if (!$empId) continue;

            $empLeaves = $allLeaves->get($empId, collect());

            $totalCount = $empLeaves->count();
            
            if ($totalCount === 0 && !$employeeId) {
                continue;
            }

            $totalLeaveDays = 0;
            $records = [];
            
            foreach ($empLeaves as $leave) {
                $start = Carbon::parse($leave->start_date);
                $end = Carbon::parse($leave->end_date);
                $days = $start->diffInDays($end) + 1;
                $totalLeaveDays += $days;

                $records[] = [
                    'id' => $leave->id,
                    'start_date' => $start->format('Y-m-d'),
                    'end_date' => $end->format('Y-m-d'),
                    'days' => $days,
                    'type_name' => $leave->leaveType ? $leave->leaveType->name : 'إجازة',
                    'status' => $leave->status,
                    'reason' => $leave->reason ?: '',
                ];
            }

            $totalLeavesAll += $totalCount;
            $totalLeaveDaysAll += $totalLeaveDays;

            // Department Stats Aggregation
            if (!isset($deptStatsMap[$deptName])) {
                $deptStatsMap[$deptName] = [
                    'name' => $deptName,
                    'total_leaves' => 0,
                    'total_leave_days' => 0,
                ];
            }
            $deptStatsMap[$deptName]['total_leaves'] += $totalCount;
            $deptStatsMap[$deptName]['total_leave_days'] += $totalLeaveDays;

            $teachersData[] = [
                'id' => $emp->id,
                'name' => $emp->name,
                'employee_name' => $emp->name,
                'department' => $deptName,
                'total_leaves' => $totalCount,
                'total_leave_days' => $totalLeaveDays,
                'records' => $records,
            ];
        }

        $departmentChartData = [];
        foreach ($deptStatsMap as $deptName => $data) {
            $departmentChartData[] = [
                'name' => $deptName,
                'total_leaves' => $data['total_leaves'],
                'total_leave_days' => $data['total_leave_days'],
            ];
        }

        $kpis = [
            'total_leaves' => $totalLeavesAll,
            'total_leave_days' => $totalLeaveDaysAll,
            'unique_employees_on_leave' => count(array_filter($teachersData, fn($t) => $t['total_leaves'] > 0)),
        ];

        // All employees for filter dropdown
        $allEmployeesList = User::whereHas('employee')
            ->when($branchId, fn($q) => $q->where(fn($sub) => $sub->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->select('id', 'name')
            ->get();

        $departments = Department::when($branchId, fn($q) => $q->where('branch_id', $branchId))->select('id', 'name')->get();

        return [
            'employeesData' => $teachersData,
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

        return Inertia::render('HR/Reports/EmployeeLeaves', [
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
            ]
        ]);
    }

    public function downloadPdf(Request $request)
    {
        $data = $this->getFilterData($request);
        
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

        $pdf = Pdf::view('pdf.hr.employee-leaves', $data)
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
            ->download('employee_leaves_report.pdf');
    }
}
