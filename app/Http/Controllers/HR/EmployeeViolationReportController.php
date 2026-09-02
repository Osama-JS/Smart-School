<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeViolation;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Spatie\LaravelPdf\Facades\Pdf;

class EmployeeViolationReportController extends Controller
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

        return Inertia::render('HR/Reports/EmployeeViolations', [
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

        $pdf = Pdf::view('pdf.hr.employee-violations', $data)
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
            ->download('employee_violations_report.pdf');
    }
}
