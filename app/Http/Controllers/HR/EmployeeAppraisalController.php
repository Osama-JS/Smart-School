<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\AppraisalCycle;
use App\Models\AppraisalTemplate;
use App\Models\Employee;
use App\Models\EmployeeAppraisal;
use App\Models\Attendance;
use App\Models\EmployeeViolation;
use App\Models\EmployeeAchievement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class EmployeeAppraisalController extends Controller
{
    public function dashboard()
    {
        // 1. Department Performance (Average Final Score by Department)
        $departmentPerformance = \DB::table('employee_appraisals')
            ->join('employees', 'employee_appraisals.employee_id', '=', 'employees.id')
            ->join('departments', 'employees.department_id', '=', 'departments.id')
            ->select('departments.name', \DB::raw('ROUND(AVG(employee_appraisals.final_score), 1) as avg_score'))
            ->whereNotNull('employee_appraisals.final_score')
            ->groupBy('departments.id', 'departments.name')
            ->get();

        // 2. Score Distribution
        $completedAppraisals = EmployeeAppraisal::whereNotNull('final_score')->get();
        $distribution = [
            'excellent' => $completedAppraisals->where('final_score', '>=', 90)->count(),
            'vgood' => $completedAppraisals->where('final_score', '>=', 80)->where('final_score', '<', 90)->count(),
            'good' => $completedAppraisals->where('final_score', '>=', 70)->where('final_score', '<', 80)->count(),
            'needs_improvement' => $completedAppraisals->where('final_score', '<', 70)->count(),
        ];

        // 3. Self vs Manager Score averages (from 1 to 5)
        $scoresData = \DB::table('employee_appraisal_scores')
            ->select(\DB::raw('ROUND(AVG(self_score), 2) as avg_self'), \DB::raw('ROUND(AVG(manager_score), 2) as avg_manager'))
            ->whereNotNull('self_score')
            ->whereNotNull('manager_score')
            ->first();

        // 4. Top 5 & Bottom 5 Employees
        $topEmployees = EmployeeAppraisal::with(['employee.user', 'employee.department'])
            ->whereNotNull('final_score')
            ->orderByDesc('final_score')
            ->limit(5)
            ->get();

        $bottomEmployees = EmployeeAppraisal::with(['employee.user', 'employee.department'])
            ->whereNotNull('final_score')
            ->orderBy('final_score')
            ->limit(5)
            ->get();

        return Inertia::render('HR/Appraisals/Dashboard', [
            'departmentPerformance' => $departmentPerformance,
            'distribution' => $distribution,
            'selfVsManager' => $scoresData,
            'topEmployees' => $topEmployees,
            'bottomEmployees' => $bottomEmployees
        ]);
    }

    // List appraisals for an employee (Self), Manager, or HR
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = EmployeeAppraisal::with(['employee', 'cycle', 'template']);
        
        $employee = $user->employee;
        if ($employee && !$user->hasPermission('عرض التقييمات الإدارية')) {
            // If the user doesn't have the global permission, they can only see their own or their team's appraisals.
            $query->where('employee_id', $employee->id)
                  ->orWhere('manager_id', $employee->id);
        }

        $appraisals = $query->latest()->get();
        
        return Inertia::render('HR/Appraisals/Index', [
            'appraisals' => $appraisals,
            'activeCycles' => AppraisalCycle::where('status', 'active')->get()
        ]);
    }

    // Initialize an appraisal for the current employee
    public function store(Request $request)
    {
        $request->validate([
            'cycle_id' => 'required|exists:appraisal_cycles,id'
        ]);

        $employee = Auth::user()->employee;
        if (!$employee) {
            return redirect()->back()->with('error', 'You are not linked to an employee profile.');
        }

        // Find applicable template
        $template = AppraisalTemplate::where('job_grade_id', $employee->job_grade_id)
            ->where('is_active', true)
            ->first();

        if (!$template) {
            return redirect()->back()->with('error', 'No active appraisal template found for your job grade.');
        }

        // Check if already exists
        $exists = EmployeeAppraisal::where('employee_id', $employee->id)
            ->where('cycle_id', $request->cycle_id)
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', 'You already have an appraisal for this cycle.');
        }

        $appraisal = EmployeeAppraisal::create([
            'employee_id' => $employee->id,
            'cycle_id' => $request->cycle_id,
            'template_id' => $template->id,
            'manager_id' => $employee->manager_id,
            'status' => 'pending_self'
        ]);

        // Init scores
        foreach ($template->kpis as $kpi) {
            $appraisal->scores()->create([
                'kpi_id' => $kpi->id,
            ]);
        }

        return redirect()->route('hr.appraisals.show', $appraisal->id)->with('success', 'Appraisal initialized.');
    }

    // Show Appraisal Form (Self or Manager view)
    public function show(EmployeeAppraisal $appraisal)
    {
        $appraisal->load(['employee.department', 'employee.jobGrade', 'cycle', 'template.kpis', 'scores.kpi', 'scores.goals']);

        // Fetch Integration Data
        $startDate = $appraisal->cycle->start_date;
        $endDate = $appraisal->cycle->end_date;

        $attendances = Attendance::where('employee_id', $appraisal->employee_id)
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $violations = EmployeeViolation::where('user_id', $appraisal->employee->user_id)
            ->whereBetween('violation_date', [$startDate, $endDate])
            ->with('violationType')
            ->get();

        $achievements = EmployeeAchievement::where('user_id', $appraisal->employee->user_id)
            ->whereBetween('achievement_date', [$startDate, $endDate])
            ->with('achievementType')
            ->get();

        // Calculate Trend Data
        $historicalAppraisals = EmployeeAppraisal::with('cycle')
            ->where('employee_id', $appraisal->employee_id)
            ->whereNotNull('final_score')
            ->orderBy('created_at', 'asc')
            ->get();

        $trendData = [];
        $previousScore = null;
        $smartAlert = null;

        $departmentId = $appraisal->employee->department_id;
        
        foreach ($historicalAppraisals as $hist) {
            // Get department average for this specific cycle
            $deptAvg = \DB::table('employee_appraisals')
                ->join('employees', 'employee_appraisals.employee_id', '=', 'employees.id')
                ->where('employees.department_id', $departmentId)
                ->where('employee_appraisals.cycle_id', $hist->cycle_id)
                ->whereNotNull('employee_appraisals.final_score')
                ->avg('employee_appraisals.final_score');

            $trendData[] = [
                'cycle' => $hist->cycle->title,
                'employee_score' => (float) $hist->final_score,
                'department_avg' => round((float) $deptAvg, 1)
            ];

            if ($previousScore !== null) {
                // If the score drops by 20% or more compared to previous
                $drop = $previousScore - $hist->final_score;
                if ($drop >= 20) {
                    $smartAlert = "انخفاض مفاجئ في أداء الموظف بنسبة " . round($drop, 1) . "% في دورة (" . $hist->cycle->title . ") مقارنة بالدورة السابقة.";
                } elseif ($drop < -20) {
                     // Optionally could alert for huge improvement
                } else {
                    // Reset alert if they recovered in the latest cycle
                    $smartAlert = null; 
                }
            }
            $previousScore = $hist->final_score;
        }

        return Inertia::render('HR/Appraisals/Show', [
            'appraisal' => $appraisal,
            'integrationData' => [
                'attendances' => $attendances,
                'violations' => $violations,
                'achievements' => $achievements,
            ],
            'trendData' => $trendData,
            'smartAlert' => $smartAlert
        ]);
    }

    // Submit Self Evaluation
    public function submitSelf(Request $request, EmployeeAppraisal $appraisal)
    {
        if ($appraisal->status !== 'pending_self') abort(403);

        $validated = $request->validate([
            'scores' => 'required|array',
            'scores.*.id' => 'required|exists:employee_appraisal_scores,id',
            'scores.*.self_score' => 'required|numeric|min:1|max:5',
            'self_comments' => 'nullable|string',
            'employee_signature' => 'nullable|string'
        ]);

        $totalScore = 0;
        $totalWeight = 0;

        foreach ($validated['scores'] as $scoreData) {
            $score = $appraisal->scores()->find($scoreData['id']);
            $score->update(['self_score' => $scoreData['self_score']]);
            
            $weight = $score->kpi->weight;
            $totalScore += ($scoreData['self_score'] * $weight);
            $totalWeight += $weight;
        }

        $selfFinalScore = $totalWeight > 0 ? ($totalScore / ($totalWeight * 5)) * 100 : 0; // Assuming 5 is max

        $appraisal->update([
            'status' => 'pending_manager',
            'self_comments' => $validated['self_comments'],
            'self_score' => $selfFinalScore,
            'employee_signature' => $validated['employee_signature'] ?? null
        ]);

        // Notify Manager
        $appraisal->load(['employee.user', 'manager.user']);
        if ($appraisal->manager && $appraisal->manager->user) {
            $notificationService = new \App\Services\NotificationService();
            $employeeName = $appraisal->employee->user->name ?? 'موظف';
            $notificationService->sendInternalNotification(
                $appraisal->manager->user->id,
                'تقييم بانتظار الاعتماد',
                "قام الموظف {$employeeName} بتقديم تقييمه الذاتي وهو بانتظار تقييمك.",
                'hr',
                \Illuminate\Support\Facades\Auth::id()
            );
        }

        return redirect()->route('hr.appraisals.index')->with('success', 'Self evaluation submitted.');
    }

    // Submit Manager Evaluation
    public function submitManager(Request $request, EmployeeAppraisal $appraisal)
    {
        if ($appraisal->status !== 'pending_manager') abort(403);

        $validated = $request->validate([
            'scores' => 'required|array',
            'scores.*.id' => 'required|exists:employee_appraisal_scores,id',
            'scores.*.manager_score' => 'required|numeric|min:1|max:5',
            'manager_comments' => 'nullable|string',
            'manager_signature' => 'nullable|string'
        ]);

        $totalScore = 0;
        $totalWeight = 0;

        foreach ($validated['scores'] as $scoreData) {
            $score = $appraisal->scores()->find($scoreData['id']);
            $score->update(['manager_score' => $scoreData['manager_score']]);
            
            $weight = $score->kpi->weight;
            $totalScore += ($scoreData['manager_score'] * $weight);
            $totalWeight += $weight;
        }

        $managerFinalScore = $totalWeight > 0 ? ($totalScore / ($totalWeight * 5)) * 100 : 0;

        $appraisal->update([
            'status' => 'pending_hr',
            'manager_comments' => $validated['manager_comments'],
            'manager_score' => $managerFinalScore,
            'final_score' => $managerFinalScore, // Manager's score acts as final score pending HR approval
            'manager_signature' => $validated['manager_signature'] ?? null
        ]);

        return redirect()->route('hr.appraisals.index')->with('success', 'Manager evaluation submitted.');
    }

    // HR Approval
    public function approveHr(Request $request, EmployeeAppraisal $appraisal)
    {
        if ($appraisal->status !== 'pending_hr') abort(403);

        $validated = $request->validate([
            'hr_comments' => 'nullable|string',
            'hr_signature' => 'nullable|string'
        ]);

        $appraisal->update([
            'status' => 'completed',
            'hr_comments' => $validated['hr_comments'],
            'hr_id' => Auth::id(),
            'hr_signature' => $validated['hr_signature'] ?? null
        ]);

        return redirect()->route('hr.appraisals.index')->with('success', 'Appraisal approved by HR.');
    }

    // SMART Goals Management
    public function storeGoal(Request $request, EmployeeAppraisal $appraisal, \App\Models\EmployeeAppraisalScore $score)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        $score->goals()->create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'progress' => 0,
            'status' => 'pending'
        ]);

        return back()->with('success', 'تم إضافة الهدف بنجاح.');
    }

    public function updateGoalProgress(Request $request, EmployeeAppraisal $appraisal, \App\Models\AppraisalGoal $goal)
    {
        $validated = $request->validate([
            'progress' => 'required|integer|min:0|max:100'
        ]);

        $status = 'in_progress';
        if ($validated['progress'] == 100) $status = 'completed';
        elseif ($validated['progress'] == 0) $status = 'pending';

        $goal->update([
            'progress' => $validated['progress'],
            'status' => $status
        ]);

        return back()->with('success', 'تم تحديث نسبة الإنجاز بنجاح.');
    }

    public function destroyGoal(EmployeeAppraisal $appraisal, \App\Models\AppraisalGoal $goal)
    {
        $goal->delete();
        return back()->with('success', 'تم حذف الهدف بنجاح.');
    }
}
