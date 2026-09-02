<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudyPlan;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Spatie\LaravelPdf\Facades\Pdf;

class StudyPlanReportController extends Controller
{
    private function getFilterData(Request $request)
    {
        $user = auth()->user();
        $branchId = $user ? $user->branch_id : null;

        $search = $request->input('search', '');
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');
        $employeeId = $request->input('employee_id');
        $statuses = $request->input('statuses');
        $violatorsOnly = filter_var($request->input('violators_only', false), FILTER_VALIDATE_BOOLEAN);

        if (is_string($statuses) && !empty($statuses)) {
            $statusesList = explode(',', $statuses);
        } else if (is_array($statuses)) {
            $statusesList = $statuses;
        } else {
            $statusesList = ['approved', 'pending', 'rejected', 'draft', 'missing'];
        }

        if ($startDateInput && $endDateInput) {
            $startDate = Carbon::parse($startDateInput)->startOfDay();
            $endDate = Carbon::parse($endDateInput)->endOfDay();
        } else {
            $startDate = now()->startOfMonth()->startOfDay();
            $endDate = now()->endOfMonth()->endOfDay();
        }

        // Fetch teachers query
        $teachersQuery = User::whereHas('role', function ($query) {
                $query->where('name', 'like', '%معلم%')
                      ->orWhere('name', 'Teacher')
                      ->orWhere('name', 'مشرف تربوي');
            })
            ->with(['employee.department']);

        if ($branchId) {
            $teachersQuery->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            });
        }
            
        if ($search) {
            $teachersQuery->where('name', 'like', '%' . $search . '%');
        }

        if ($employeeId) {
            $teachersQuery->where('id', $employeeId);
        }

        $teachers = $teachersQuery->get();
        $teacherIds = $teachers->pluck('id')->toArray();

        // Fetch all study plans for these teachers
        $studyPlans = StudyPlan::with(['subject', 'grade', 'teacher', 'template', 'comments'])
            ->whereIn('teacher_id', $teacherIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get()
            ->groupBy('teacher_id');

        $teachersData = [];
        $deptStatsMap = [];

        $totalPlansAll = 0;
        $approvedPlansAll = 0;
        $pendingPlansAll = 0;
        $rejectedPlansAll = 0;
        $draftPlansAll = 0;
        $missingPlansAll = 0;
        $violatorTeachersCount = 0;

        $statusLabels = [
            'approved' => 'معتمدة',
            'pending'  => 'قيد المراجعة',
            'rejected' => 'مرفوضة',
            'draft'    => 'مسودة',
            'missing'  => 'لم تُقدم'
        ];

        foreach ($teachers as $teacher) {
            $deptName = $teacher->employee && $teacher->employee->department 
                ? $teacher->employee->department->name 
                : 'القسم الأكاديمي';

            $teacherPlans = $studyPlans->get($teacher->id, collect());

            $approvedCount = $teacherPlans->where('status', 'approved')->count();
            $pendingCount = $teacherPlans->where('status', 'pending')->count();
            $rejectedCount = $teacherPlans->where('status', 'rejected')->count();
            $draftCount = $teacherPlans->where('status', 'draft')->count();
            
            // If a teacher has 0 plans submitted in this period, mark as missing
            $missingCount = $teacherPlans->count() === 0 ? 1 : 0;

            $records = [];
            foreach ($teacherPlans as $plan) {
                $statusCode = $plan->status ?: 'pending';
                if (!in_array($statusCode, $statusesList)) {
                    continue;
                }

                $records[] = [
                    'id' => $plan->id,
                    'title' => $plan->title ?: 'خطة دراسية',
                    'subject_name' => $plan->subject->name ?? 'مادة غير محددة',
                    'grade_name' => $plan->grade->name ?? 'صف غير محدد',
                    'month' => $plan->month ?: $plan->created_at->format('Y-m'),
                    'status_code' => $statusCode,
                    'status' => $statusLabels[$statusCode] ?? $statusCode,
                    'created_at' => $plan->created_at ? $plan->created_at->format('Y-m-d H:i') : '-',
                    'notes' => $plan->notes ?: '',
                    'admin_feedback' => $plan->admin_feedback ?: '',
                    'verification_url' => $plan->verification_url ?: '',
                ];
            }

            if ($teacherPlans->count() === 0 && in_array('missing', $statusesList)) {
                $records[] = [
                    'id' => 'missing_' . $teacher->id,
                    'title' => 'لم يقم برفع الخطة الدراسية',
                    'subject_name' => '-',
                    'grade_name' => '-',
                    'month' => $startDate->format('Y-m'),
                    'status_code' => 'missing',
                    'status' => 'لم تُقدم',
                    'created_at' => '-',
                    'notes' => 'تأخير في تسليم الخطة الدراسية المطلوبة للفترة',
                    'admin_feedback' => '',
                    'verification_url' => '',
                ];
            }

            if ($violatorsOnly && $rejectedCount == 0 && $missingCount == 0) {
                continue;
            }

            if ($rejectedCount > 0 || $missingCount > 0) {
                $violatorTeachersCount++;
            }

            $totalPlansAll += $teacherPlans->count();
            $approvedPlansAll += $approvedCount;
            $pendingPlansAll += $pendingCount;
            $rejectedPlansAll += $rejectedCount;
            $draftPlansAll += $draftCount;
            $missingPlansAll += $missingCount;

            // Department Stats Aggregation
            if (!isset($deptStatsMap[$deptName])) {
                $deptStatsMap[$deptName] = [
                    'name' => $deptName,
                    'approved' => 0,
                    'pending' => 0,
                    'rejected' => 0,
                    'missing' => 0,
                ];
            }
            $deptStatsMap[$deptName]['approved'] += $approvedCount;
            $deptStatsMap[$deptName]['pending'] += $pendingCount;
            $deptStatsMap[$deptName]['rejected'] += $rejectedCount;
            $deptStatsMap[$deptName]['missing'] += $missingCount;

            $teachersData[] = [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'employee_name' => $teacher->name,
                'department' => $deptName,
                'total_plans' => $teacherPlans->count(),
                'approved_plans' => $approvedCount,
                'pending_plans' => $pendingCount,
                'rejected_plans' => $rejectedCount,
                'draft_plans' => $draftCount,
                'missing' => $missingCount,
                'records' => $records,
            ];
        }

        $departmentChartData = array_values($deptStatsMap);

        $kpis = [
            'total_plans' => $totalPlansAll,
            'total_approved' => $approvedPlansAll,
            'total_pending' => $pendingPlansAll,
            'total_rejected' => $rejectedPlansAll,
            'total_draft' => $draftPlansAll,
            'total_missing' => $missingPlansAll,
            'unique_teachers' => $violatorTeachersCount,
            'approval_rate' => ($totalPlansAll + $missingPlansAll) > 0 ? round(($approvedPlansAll / ($totalPlansAll + $missingPlansAll)) * 100) : 100,
        ];

        $allTeachersList = User::whereHas('role', function ($query) {
                $query->where('name', 'like', '%معلم%')
                      ->orWhere('name', 'Teacher')
                      ->orWhere('name', 'مشرف تربوي');
            })
            ->when($branchId, fn($q) => $q->where(fn($sub) => $sub->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->select('id', 'name')
            ->get();

        return [
            'teachersData' => $teachersData,
            'kpis' => $kpis,
            'departmentChartData' => $departmentChartData,
            'allTeachersList' => $allTeachersList,
            'periodStart' => $startDate->format('Y-m-d'),
            'periodEnd' => $endDate->format('Y-m-d'),
        ];
    }

    public function report(Request $request)
    {
        $data = $this->getFilterData($request);

        return Inertia::render('HR/Reports/StudyPlans', [
            'teachers' => $data['teachersData'],
            'kpis' => $data['kpis'],
            'departmentChartData' => $data['departmentChartData'],
            'allTeachers' => $data['allTeachersList'],
            'periodStart' => $data['periodStart'],
            'periodEnd' => $data['periodEnd'],
            'filters' => [
                'search' => $request->input('search', ''),
                'start_date' => $request->input('start_date', $data['periodStart']),
                'end_date' => $request->input('end_date', $data['periodEnd']),
                'employee_id' => $request->input('employee_id', ''),
                'statuses' => $request->input('statuses', ''),
                'violators_only' => filter_var($request->input('violators_only', false), FILTER_VALIDATE_BOOLEAN),
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

        $pdf = Pdf::view('pdf.hr.study-plans', $data)
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
            ->download('study_plans_report.pdf');
    }
}
