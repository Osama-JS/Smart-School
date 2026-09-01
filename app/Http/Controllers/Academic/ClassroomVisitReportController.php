<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\ClassroomVisit;
use App\Models\User;
use App\Models\Grade;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ClassroomVisitReportController extends Controller
{
    public function report(Request $request)
    {
        $user = auth()->user();
        $branchId = $user ? $user->branch_id : null;

        $search = $request->input('search', '');
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');
        $employeeId = $request->input('employee_id');
        $supervisorId = $request->input('supervisor_id');
        $violatorsOnly = filter_var($request->input('violators_only', false), FILTER_VALIDATE_BOOLEAN);

        if ($startDateInput && $endDateInput) {
            $startDate = Carbon::parse($startDateInput)->startOfDay();
            $endDate = Carbon::parse($endDateInput)->endOfDay();
        } else {
            $startDate = now()->startOfMonth()->startOfDay();
            $endDate = now()->endOfMonth()->endOfDay();
        }

        // Base Query for Teachers
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

        // Fetch Classroom Visits query
        $visitsQuery = ClassroomVisit::with(['teacher', 'supervisor', 'grade', 'division'])
            ->whereIn('teacher_id', $teacherIds)
            ->whereBetween('visit_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);

        if ($supervisorId) {
            $visitsQuery->where('supervisor_id', $supervisorId);
        }

        $allVisits = $visitsQuery->get()->groupBy('teacher_id');

        $teachersData = [];
        $deptStatsMap = [];

        $totalVisitsAll = 0;
        $approvedVisitsAll = 0;
        $pendingVisitsAll = 0;
        $totalScoresSum = 0;
        $scoredVisitsCount = 0;
        $lowScoreTeachersCount = 0;

        foreach ($teachers as $teacher) {
            $deptName = $teacher->employee && $teacher->employee->department 
                ? $teacher->employee->department->name 
                : 'القسم الأكاديمي';

            $teacherVisits = $allVisits->get($teacher->id, collect());

            $totalCount = $teacherVisits->count();
            $approvedCount = $teacherVisits->where('is_approved', true)->count();
            $pendingCount = $teacherVisits->where('is_approved', false)->count();

            $teacherScoresSum = $teacherVisits->whereNotNull('score')->sum('score');
            $teacherScoreCount = $teacherVisits->whereNotNull('score')->count();
            $teacherAvgScore = $teacherScoreCount > 0 ? round($teacherScoresSum / $teacherScoreCount) : 0;

            $records = [];
            foreach ($teacherVisits as $visit) {
                if ($visit->score !== null) {
                    $totalScoresSum += $visit->score;
                    $scoredVisitsCount++;
                }

                $records[] = [
                    'id' => $visit->id,
                    'visit_date' => is_string($visit->visit_date) ? $visit->visit_date : $visit->visit_date->format('Y-m-d'),
                    'visit_type' => $visit->visit_type ?: 'زيارة صفية',
                    'supervisor_name' => $visit->supervisor ? $visit->supervisor->name : 'مشرف أخصائي',
                    'grade_name' => $visit->grade ? $visit->grade->name : '',
                    'division_name' => $visit->division ? $visit->division->name : '',
                    'score' => $visit->score !== null ? $visit->score : 0,
                    'is_approved' => (bool)$visit->is_approved,
                    'status' => $visit->is_approved ? 'معتمدة' : 'قيد الاعتماد',
                    'discussed_points' => $visit->discussed_points ?: '',
                    'notes' => $visit->notes ?: '',
                ];
            }

            if ($violatorsOnly && ($totalCount > 0 && $teacherAvgScore >= 75)) {
                continue;
            }

            if ($totalCount === 0 || $teacherAvgScore < 75) {
                $lowScoreTeachersCount++;
            }

            $totalVisitsAll += $totalCount;
            $approvedVisitsAll += $approvedCount;
            $pendingVisitsAll += $pendingCount;

            // Department Stats Aggregation
            if (!isset($deptStatsMap[$deptName])) {
                $deptStatsMap[$deptName] = [
                    'name' => $deptName,
                    'approved' => 0,
                    'pending' => 0,
                    'total' => 0,
                    'score_sum' => 0,
                    'score_count' => 0,
                ];
            }
            $deptStatsMap[$deptName]['approved'] += $approvedCount;
            $deptStatsMap[$deptName]['pending'] += $pendingCount;
            $deptStatsMap[$deptName]['total'] += $totalCount;
            $deptStatsMap[$deptName]['score_sum'] += $teacherScoresSum;
            $deptStatsMap[$deptName]['score_count'] += $teacherScoreCount;

            $teachersData[] = [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'employee_name' => $teacher->name,
                'department' => $deptName,
                'total_visits' => $totalCount,
                'approved_visits' => $approvedCount,
                'pending_visits' => $pendingCount,
                'avg_score' => $teacherAvgScore,
                'records' => $records,
            ];
        }

        $departmentChartData = [];
        foreach ($deptStatsMap as $deptName => $data) {
            $avg = $data['score_count'] > 0 ? round($data['score_sum'] / $data['score_count']) : 0;
            $departmentChartData[] = [
                'name' => $deptName,
                'approved' => $data['approved'],
                'pending' => $data['pending'],
                'avg_score' => $avg,
            ];
        }

        $kpis = [
            'total_visits' => $totalVisitsAll,
            'approved_visits' => $approvedVisitsAll,
            'pending_visits' => $pendingVisitsAll,
            'average_score' => $scoredVisitsCount > 0 ? round($totalScoresSum / $scoredVisitsCount) : 0,
            'unique_teachers' => count($teachersData),
            'low_performance_teachers' => $lowScoreTeachersCount,
        ];

        // All teachers and supervisors for filter dropdowns
        $allTeachersList = User::whereHas('role', function ($query) {
                $query->where('name', 'like', '%معلم%')
                      ->orWhere('name', 'Teacher')
                      ->orWhere('name', 'مشرف تربوي');
            })
            ->when($branchId, fn($q) => $q->where(fn($sub) => $sub->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->select('id', 'name')
            ->get();

        $allSupervisorsList = User::whereHas('role', function ($query) {
                $query->where('name', 'not like', '%طالب%')
                      ->where('name', 'not like', '%ولي أمر%');
            })
            ->when($branchId, fn($q) => $q->where(fn($sub) => $sub->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->select('id', 'name')
            ->get();

        return Inertia::render('HR/Reports/ClassroomVisits', [
            'teachers' => $teachersData,
            'kpis' => $kpis,
            'departmentChartData' => $departmentChartData,
            'allTeachers' => $allTeachersList,
            'allSupervisors' => $allSupervisorsList,
            'periodStart' => $startDate->format('Y-m-d'),
            'periodEnd' => $endDate->format('Y-m-d'),
            'filters' => [
                'search' => $search,
                'start_date' => $request->input('start_date', $startDate->format('Y-m-d')),
                'end_date' => $request->input('end_date', $endDate->format('Y-m-d')),
                'employee_id' => $employeeId ?: '',
                'supervisor_id' => $supervisorId ?: '',
                'violators_only' => $violatorsOnly,
            ]
        ]);
    }
}
