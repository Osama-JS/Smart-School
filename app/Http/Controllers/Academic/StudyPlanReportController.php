<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudyPlan;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class StudyPlanReportController extends Controller
{
    public function report(Request $request)
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

        return Inertia::render('HR/Reports/StudyPlans', [
            'teachers' => $teachersData,
            'kpis' => $kpis,
            'departmentChartData' => $departmentChartData,
            'allTeachers' => $allTeachersList,
            'periodStart' => $startDate->format('Y-m-d'),
            'periodEnd' => $endDate->format('Y-m-d'),
            'filters' => [
                'search' => $search,
                'start_date' => $request->input('start_date', $startDate->format('Y-m-d')),
                'end_date' => $request->input('end_date', $endDate->format('Y-m-d')),
                'employee_id' => $employeeId ?: '',
                'statuses' => $statuses ?: '',
                'violators_only' => $violatorsOnly,
            ]
        ]);
    }
}
