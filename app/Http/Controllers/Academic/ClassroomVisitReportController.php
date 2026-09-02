<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\ClassroomVisit;
use App\Models\User;
use App\Models\Grade;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Spatie\LaravelPdf\Facades\Pdf;

class ClassroomVisitReportController extends Controller
{
    private function getFilterData(Request $request)
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

        return [
            'teachersData' => $teachersData,
            'kpis' => $kpis,
            'departmentChartData' => $departmentChartData,
            'allTeachersList' => $allTeachersList,
            'allSupervisorsList' => $allSupervisorsList,
            'periodStart' => $startDate->format('Y-m-d'),
            'periodEnd' => $endDate->format('Y-m-d'),
        ];
    }

    public function report(Request $request)
    {
        $data = $this->getFilterData($request);

        return Inertia::render('HR/Reports/ClassroomVisits', [
            'teachers' => $data['teachersData'],
            'kpis' => $data['kpis'],
            'departmentChartData' => $data['departmentChartData'],
            'allTeachers' => $data['allTeachersList'],
            'allSupervisors' => $data['allSupervisorsList'],
            'periodStart' => $data['periodStart'],
            'periodEnd' => $data['periodEnd'],
            'filters' => [
                'search' => $request->input('search', ''),
                'start_date' => $request->input('start_date', $data['periodStart']),
                'end_date' => $request->input('end_date', $data['periodEnd']),
                'employee_id' => $request->input('employee_id', ''),
                'supervisor_id' => $request->input('supervisor_id', ''),
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

        $pdf = Pdf::view('pdf.hr.classroom-visits', $data)
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
            ->download('classroom_visits_report.pdf');
    }
}
