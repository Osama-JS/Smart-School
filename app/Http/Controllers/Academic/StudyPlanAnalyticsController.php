<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudyPlan;
use App\Models\User;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StudyPlanAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->branch_id ?? null;

        // Base Query for Study Plans
        $plansQuery = StudyPlan::query();
        if ($branchId) {
            $plansQuery->whereHas('teacher', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        // Overall Stats
        $totalPlans = (clone $plansQuery)->count();
        $approvedPlans = (clone $plansQuery)->where('status', 'approved')->count();
        $pendingPlans = (clone $plansQuery)->where('status', 'pending')->count();
        $rejectedPlans = (clone $plansQuery)->where('status', 'rejected')->count();
        $draftPlans = (clone $plansQuery)->where('status', 'draft')->count();

        // Approval Rate
        $approvalRate = $totalPlans > 0 ? round(($approvedPlans / $totalPlans) * 100) : 0;

        // Status Distribution for Donut Chart
        $statusDistribution = [
            ['name' => 'معتمدة', 'value' => $approvedPlans, 'color' => '#10b981'], // Emerald 500
            ['name' => 'قيد المراجعة', 'value' => $pendingPlans, 'color' => '#f59e0b'], // Amber 500
            ['name' => 'مرفوضة', 'value' => $rejectedPlans, 'color' => '#ef4444'], // Rose 500
            ['name' => 'مسودة', 'value' => $draftPlans, 'color' => '#64748b'], // Slate 500
        ];

        // Teacher Performance (Grouped by Teacher)
        $teacherIds = (clone $plansQuery)->distinct()->pluck('teacher_id')->toArray();
        
        $teachersQuery = User::where('role_id', function($q) {
            $q->select('id')->from('roles')->where('name', 'معلم')->limit(1);
        });

        if ($branchId) {
            $teachersQuery->where('branch_id', $branchId);
        }
        
        $allTeachers = $teachersQuery->get(['id', 'name']);

        $teacherPerformance = [];
        $alerts = [];

        foreach ($allTeachers as $teacher) {
            $teacherPlans = (clone $plansQuery)->where('teacher_id', $teacher->id)->get();
            $tTotal = $teacherPlans->count();
            $tApproved = $teacherPlans->where('status', 'approved')->count();
            $tRejected = $teacherPlans->where('status', 'rejected')->count();
            $tPending = $teacherPlans->where('status', 'pending')->count();

            $teacherPerformance[] = [
                'name' => $teacher->name,
                'total' => $tTotal,
                'approved' => $tApproved,
                'pending' => $tPending,
                'rejected' => $tRejected
            ];

            // Smart Alerts Logic
            if ($tTotal === 0) {
                $alerts[] = [
                    'id' => 'no_plans_' . $teacher->id,
                    'type' => 'danger',
                    'title' => 'لم يتم تسليم أي خطة',
                    'message' => "المعلم {$teacher->name} لم يقم بتسليم أي خطة دراسية حتى الآن."
                ];
            } elseif ($tRejected >= 3) {
                $alerts[] = [
                    'id' => 'high_rejects_' . $teacher->id,
                    'type' => 'warning',
                    'title' => 'كثرة الرفض',
                    'message' => "المعلم {$teacher->name} لديه {$tRejected} خطط مرفوضة، يرجى المتابعة معه."
                ];
            }
        }

        // Sort teacher performance by total plans descending
        usort($teacherPerformance, function($a, $b) {
            return $b['total'] <=> $a['total'];
        });

        // Take top 10 for bar chart to avoid clutter
        $teacherPerformance = array_slice($teacherPerformance, 0, 10);

        return Inertia::render('Academic/StudyPlans/Analytics', [
            'stats' => [
                'total' => $totalPlans,
                'approved' => $approvedPlans,
                'pending' => $pendingPlans,
                'rejected' => $rejectedPlans,
                'approvalRate' => $approvalRate
            ],
            'statusDistribution' => array_values(array_filter($statusDistribution, function($s) { return $s['value'] > 0; })),
            'teacherPerformance' => $teacherPerformance,
            'alerts' => $alerts
        ]);
    }
}
