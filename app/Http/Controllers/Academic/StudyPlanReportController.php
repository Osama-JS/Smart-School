<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudyPlan;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Spatie\LaravelPdf\Facades\Pdf;
use Illuminate\Support\Facades\DB;

class StudyPlanReportController extends Controller
{
    private function getFilterData(Request $request, $isPaginated = true)
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

        $targetMonths = [];
        $currentDate = clone $startDate;
        $currentDate->startOfMonth();
        $endMonthDate = clone $endDate;
        $endMonthDate->startOfMonth();

        while ($currentDate->lte($endMonthDate)) {
            $targetMonths[] = $currentDate->format('Y-m');
            $currentDate->addMonth();
        }
        $monthsCount = max(1, count($targetMonths));

        $studyPlansFilter = function($q) use ($targetMonths, $startDate, $endDate) {
            $q->where(function ($subQ) use ($targetMonths, $startDate, $endDate) {
                if (!empty($targetMonths)) {
                    $subQ->whereIn('study_plans.month', $targetMonths)
                         ->orWhere(function ($subQ2) use ($startDate, $endDate) {
                             $subQ2->whereNull('study_plans.month')->whereBetween('study_plans.created_at', [$startDate, $endDate]);
                         });
                } else {
                    $subQ->whereBetween('study_plans.created_at', [$startDate, $endDate]);
                }
            });
        };

        $targetPlansQuery = DB::table('master_timetable')
            ->join('divisions', 'master_timetable.division_id', '=', 'divisions.id')
            ->select('master_timetable.teacher_id', DB::raw('COUNT(DISTINCT CONCAT(master_timetable.subject_id, "-", divisions.grade_id)) * ' . $monthsCount . ' as expected_plans'))
            ->groupBy('master_timetable.teacher_id');

        $submittedPlansQuery = DB::table('study_plans')
            ->where($studyPlansFilter)
            ->select('study_plans.teacher_id', DB::raw('COUNT(DISTINCT CONCAT(study_plans.subject_id, "-", study_plans.grade_id, "-", COALESCE(study_plans.month, DATE_FORMAT(study_plans.created_at, "%Y-%m")))) as submitted_plans'))
            ->groupBy('study_plans.teacher_id');

        // Fetch teachers query
        $baseTeachersQuery = User::whereHas('role', function ($query) {
                $query->where('name', 'like', '%معلم%')
                      ->orWhere('name', 'Teacher')
                      ->orWhere('name', 'مشرف تربوي');
            })
            ->with(['employee.department']);

        if ($branchId) {
            $baseTeachersQuery->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            });
        }
            
        if ($search) {
            $baseTeachersQuery->where('name', 'like', '%' . $search . '%');
        }

        if ($employeeId) {
            $baseTeachersQuery->where('id', $employeeId);
        }

        $teachersQuery = clone $baseTeachersQuery;

        if ($violatorsOnly) {
            $teachersQuery->where(function($q) use ($targetPlansQuery, $submittedPlansQuery, $studyPlansFilter) {
                // Teachers with rejected plans
                $q->whereIn('users.id', function($sub) use ($studyPlansFilter) {
                    $sub->select('teacher_id')
                        ->from('study_plans')
                        ->where($studyPlansFilter)
                        ->where('status', 'rejected');
                })
                // Teachers with missing plans
                ->orWhereIn('users.id', function($sub) use ($targetPlansQuery, $submittedPlansQuery) {
                    $sub->select('users.id')
                        ->from('users')
                        ->leftJoinSub($targetPlansQuery, 'targets', 'users.id', '=', 'targets.teacher_id')
                        ->leftJoinSub($submittedPlansQuery, 'submitted', 'users.id', '=', 'submitted.teacher_id')
                        ->whereRaw('CAST(COALESCE(targets.expected_plans, 0) AS SIGNED) > CAST(COALESCE(submitted.submitted_plans, 0) AS SIGNED)');
                });
            });
        }

        // --- 1. Global KPIs (Aggregate Queries on Base Query) ---
        $baseTeacherIds = $baseTeachersQuery->pluck('users.id');

        $plansStats = StudyPlan::whereIn('teacher_id', $baseTeacherIds)
            ->where($studyPlansFilter)
            ->selectRaw('
                COUNT(*) as total_plans,
                SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved_plans,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_plans,
                SUM(CASE WHEN status = "rejected" THEN 1 ELSE 0 END) as rejected_plans,
                SUM(CASE WHEN status = "draft" THEN 1 ELSE 0 END) as draft_plans
            ')
            ->first();

        $totalPlansAll = (int) ($plansStats->total_plans ?? 0);
        $approvedPlansAll = (int) ($plansStats->approved_plans ?? 0);
        $pendingPlansAll = (int) ($plansStats->pending_plans ?? 0);
        $rejectedPlansAll = (int) ($plansStats->rejected_plans ?? 0);
        $draftPlansAll = (int) ($plansStats->draft_plans ?? 0);

        // calc missing for KPI
        $teacherMissingPlansRaw = DB::table('users')
            ->whereIn('users.id', $baseTeacherIds)
            ->leftJoinSub($targetPlansQuery, 'targets', 'users.id', '=', 'targets.teacher_id')
            ->leftJoinSub($submittedPlansQuery, 'submitted', 'users.id', '=', 'submitted.teacher_id')
            ->select('users.id', DB::raw('GREATEST(0, CAST(COALESCE(targets.expected_plans, 0) AS SIGNED) - CAST(COALESCE(submitted.submitted_plans, 0) AS SIGNED)) as missing_count'))
            ->get();
            
        $missingPlansAll = (int) $teacherMissingPlansRaw->sum('missing_count');
        $violatorsWithMissingCount = $teacherMissingPlansRaw->filter(fn($t) => $t->missing_count > 0)->pluck('id');
        
        $teachersWithRejectedPlansIds = StudyPlan::whereIn('teacher_id', $baseTeacherIds)
            ->where($studyPlansFilter)
            ->where('status', 'rejected')
            ->distinct('teacher_id')
            ->pluck('teacher_id');
            
        $violatorTeachersCount = $violatorsWithMissingCount->merge($teachersWithRejectedPlansIds)->unique()->count();

        // --- 2. Department Chart Data (Aggregate Queries) ---
        $deptStatsRaw = DB::table('users')
            ->leftJoin('employees', 'users.id', '=', 'employees.user_id')
            ->leftJoin('departments', 'employees.department_id', '=', 'departments.id')
            ->leftJoin('study_plans', function($join) use ($studyPlansFilter) {
                $join->on('users.id', '=', 'study_plans.teacher_id');
                // Apply the study plans filter properly within the join
                $join->where($studyPlansFilter);
            })
            ->whereIn('users.id', $baseTeacherIds)
            ->select(
                DB::raw('COALESCE(departments.name, "القسم الأكاديمي") as name'),
                DB::raw('COUNT(study_plans.id) as total'),
                DB::raw('SUM(CASE WHEN study_plans.status = "approved" THEN 1 ELSE 0 END) as approved'),
                DB::raw('SUM(CASE WHEN study_plans.status = "pending" THEN 1 ELSE 0 END) as pending'),
                DB::raw('SUM(CASE WHEN study_plans.status = "rejected" THEN 1 ELSE 0 END) as rejected')
            )
            ->groupBy(DB::raw('COALESCE(departments.name, "القسم الأكاديمي")'))
            ->get();

        $deptMissingRaw = DB::table('users')
            ->leftJoin('employees', 'users.id', '=', 'employees.user_id')
            ->leftJoin('departments', 'employees.department_id', '=', 'departments.id')
            ->whereIn('users.id', $baseTeacherIds)
            ->leftJoinSub($targetPlansQuery, 'targets', 'users.id', '=', 'targets.teacher_id')
            ->leftJoinSub($submittedPlansQuery, 'submitted', 'users.id', '=', 'submitted.teacher_id')
            ->select(
                DB::raw('COALESCE(departments.name, "القسم الأكاديمي") as name'),
                DB::raw('SUM(GREATEST(0, CAST(COALESCE(targets.expected_plans, 0) AS SIGNED) - CAST(COALESCE(submitted.submitted_plans, 0) AS SIGNED))) as missing')
            )
            ->groupBy(DB::raw('COALESCE(departments.name, "القسم الأكاديمي")'))
            ->get()->keyBy('name');

        $departmentChartData = [];
        foreach ($deptStatsRaw as $stat) {
            $departmentChartData[] = [
                'name' => $stat->name,
                'approved' => (int) $stat->approved,
                'pending' => (int) $stat->pending,
                'rejected' => (int) $stat->rejected,
                'missing' => (int) ($deptMissingRaw->get($stat->name)?->missing ?? 0),
            ];
        }

        // --- 3. Pagination & Study Plans Fetching ---
        if ($isPaginated) {
            $teachers = $teachersQuery->paginate(15)->withQueryString();
        } else {
            $teachers = clone $teachersQuery;
            $teachers = $teachers->get();
        }

        $teacherIds = $teachers->pluck('id')->toArray();

        // Fetch study plans for ONLY these paginated teachers
        $studyPlans = StudyPlan::with(['subject', 'grade', 'teacher', 'template', 'comments'])
            ->whereIn('teacher_id', $teacherIds)
            ->where($studyPlansFilter)
            ->get()
            ->groupBy('teacher_id');

        $paginatedTeacherTargets = DB::table('master_timetable')
            ->join('divisions', 'master_timetable.division_id', '=', 'divisions.id')
            ->whereIn('master_timetable.teacher_id', $teacherIds)
            ->select('master_timetable.teacher_id', DB::raw('COUNT(DISTINCT CONCAT(master_timetable.subject_id, "-", divisions.grade_id)) * ' . $monthsCount . ' as expected_plans'))
            ->groupBy('master_timetable.teacher_id')
            ->get()->keyBy('teacher_id');

        $paginatedTeacherSubmitted = DB::table('study_plans')
            ->whereIn('study_plans.teacher_id', $teacherIds)
            ->where($studyPlansFilter)
            ->select('study_plans.teacher_id', DB::raw('COUNT(DISTINCT CONCAT(study_plans.subject_id, "-", study_plans.grade_id, "-", COALESCE(study_plans.month, DATE_FORMAT(study_plans.created_at, "%Y-%m")))) as submitted_plans'))
            ->groupBy('study_plans.teacher_id')
            ->get()->keyBy('teacher_id');

        $teachersData = [];

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
            
            $expected = $paginatedTeacherTargets->get($teacher->id)?->expected_plans ?? 0;
            $submitted = $paginatedTeacherSubmitted->get($teacher->id)?->submitted_plans ?? 0;
            $missingCount = (int) max(0, $expected - $submitted);

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

            if ($missingCount > 0 && in_array('missing', $statusesList)) {
                $records[] = [
                    'id' => 'missing_' . $teacher->id,
                    'title' => 'متأخر عن تسليم ' . $missingCount . ' خطة دراسية',
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

        if ($isPaginated) {
            $resultTeachersData = $teachers->toArray();
            $resultTeachersData['data'] = $teachersData;
        } else {
            $resultTeachersData = $teachersData;
        }

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
            'teachersData' => $resultTeachersData,
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
