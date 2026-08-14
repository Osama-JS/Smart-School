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
        $user = Auth::user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $branchId = $user->branch_id ?? session('branch_id');

        $cacheKey = "appraisal_dashboard_branch_{$branchId}";

        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($isSystemAdmin, $branchId) {
            $baseQuery = function($query) use ($isSystemAdmin, $branchId) {
                if (!$isSystemAdmin && $branchId) {
                    $query->join('employees as emp_filter', 'employee_appraisals.employee_id', '=', 'emp_filter.id')
                          ->join('users as usr_filter', 'emp_filter.user_id', '=', 'usr_filter.id')
                          ->where('usr_filter.branch_id', $branchId);
                }
            };

            // 1. Department Performance (Average Final Score by Department)
            $deptQuery = \DB::table('employee_appraisals')
                ->join('employees', 'employee_appraisals.employee_id', '=', 'employees.id')
                ->join('departments', 'employees.department_id', '=', 'departments.id')
                ->select('departments.name', \DB::raw('ROUND(AVG(employee_appraisals.final_score), 1) as avg_score'))
                ->whereNotNull('employee_appraisals.final_score')
                ->groupBy('departments.id', 'departments.name');
                
            if (!$isSystemAdmin && $branchId) {
                $deptQuery->join('users', 'employees.user_id', '=', 'users.id')
                          ->where('users.branch_id', $branchId);
            }
            $departmentPerformance = $deptQuery->get();

            // 2. Score Distribution
            $completedAppraisalsQuery = EmployeeAppraisal::whereNotNull('final_score');
            if (!$isSystemAdmin && $branchId) {
                $completedAppraisalsQuery->whereHas('employee.user', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }
            $completedAppraisals = $completedAppraisalsQuery->get();
            
            $distribution = [
                'excellent' => $completedAppraisals->where('final_score', '>=', 90)->count(),
                'vgood' => $completedAppraisals->where('final_score', '>=', 80)->where('final_score', '<', 90)->count(),
                'good' => $completedAppraisals->where('final_score', '>=', 70)->where('final_score', '<', 80)->count(),
                'needs_improvement' => $completedAppraisals->where('final_score', '<', 70)->count(),
            ];

            // 3. Self vs Manager Score averages (from 1 to 5)
            $scoresQuery = \DB::table('employee_appraisal_scores')
                ->join('employee_appraisals', 'employee_appraisal_scores.appraisal_id', '=', 'employee_appraisals.id')
                ->select(\DB::raw('ROUND(AVG(employee_appraisal_scores.self_score), 2) as avg_self'), \DB::raw('ROUND(AVG(employee_appraisal_scores.manager_score), 2) as avg_manager'))
                ->whereNotNull('employee_appraisal_scores.self_score')
                ->whereNotNull('employee_appraisal_scores.manager_score');
                
            $baseQuery($scoresQuery);
            $scoresData = $scoresQuery->first();

            // 4. Top 5 & Bottom 5 Employees
            $topQuery = EmployeeAppraisal::with(['employee.user', 'employee.department'])->whereNotNull('final_score')->orderByDesc('final_score')->limit(5);
            $bottomQuery = EmployeeAppraisal::with(['employee.user', 'employee.department'])->whereNotNull('final_score')->orderBy('final_score')->limit(5);

            if (!$isSystemAdmin && $branchId) {
                $branchFilter = function($q) use ($branchId) { $q->whereHas('employee.user', function($sq) use ($branchId) { $sq->where('branch_id', $branchId); }); };
                $branchFilter($topQuery);
                $branchFilter($bottomQuery);
            }

            return [
                'departmentPerformance' => $departmentPerformance,
                'distribution' => $distribution,
                'selfVsManager' => $scoresData,
                'topEmployees' => $topQuery->get(),
                'bottomEmployees' => $bottomQuery->get()
            ];
        });

        return Inertia::render('HR/Appraisals/Dashboard', $data);
    }

    // List appraisals for an employee (Self), Manager, or HR
    public function index(Request $request)
    {
        $user = Auth::user();
        $isSystemAdmin = $user->role && $user->role->name === 'مدير النظام';
        $branchId = $user->branch_id ?? session('branch_id');
        
        $query = EmployeeAppraisal::with(['employee.user', 'cycle', 'template']);
        
        $employee = $user->employee;
        if (!$user->hasPermission('عرض التقييمات الإدارية')) {
            if ($employee) {
                // If the user doesn't have the global permission, they can only see their own or their team's appraisals.
                $query->where(function($q) use ($employee) {
                    $q->where('employee_id', $employee->id)
                      ->orWhere('manager_id', $employee->id);
                });
            } else {
                // Not an employee and no global permission? See nothing.
                $query->where('id', '<', 0);
            }
        } elseif (!$isSystemAdmin && $branchId) {
            // User has permission, but is not System Admin. Filter by their branch.
            $query->whereHas('employee.user', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
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
            return redirect()->back()->with('error', 'حسابك غير مرتبط بملف موظف.');
        }

        // Find applicable template
        $template = null;
        if ($employee->job_grade_id) {
            $template = AppraisalTemplate::where('job_grade_id', $employee->job_grade_id)
                ->where('is_active', true)
                ->first();
        }

        // Fallback to generic template
        if (!$template) {
            $template = AppraisalTemplate::whereNull('job_grade_id')
                ->where('is_active', true)
                ->first();
        }

        if (!$template) {
            return redirect()->back()->with('error', 'لا يوجد قالب تقييم مفعل مخصص لدرجتك الوظيفية أو قالب عام.');
        }

        // Check if already exists
        $exists = EmployeeAppraisal::where('employee_id', $employee->id)
            ->where('cycle_id', $request->cycle_id)
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', 'يوجد لديك تقييم بالفعل لهذه الدورة.');
        }

        $cycle = AppraisalCycle::findOrFail($request->cycle_id);

        $appraisal = EmployeeAppraisal::create([
            'employee_id' => $employee->id,
            'cycle_id' => $request->cycle_id,
            'template_id' => $template->id,
            'manager_id' => $employee->manager_id,
            'status' => $cycle->requires_self_appraisal ? 'pending_self' : 'pending_manager'
        ]);

        // Init scores
        foreach ($template->kpis as $kpi) {
            $appraisal->scores()->create([
                'kpi_id' => $kpi->id,
            ]);
        }

        return redirect()->route('hr.appraisals.show', $appraisal->id)->with('success', 'تم بدء التقييم بنجاح.');
    }

    public function generate(Request $request)
    {
        $request->validate([
            'cycle_id' => 'required|exists:appraisal_cycles,id'
        ]);

        $cycleId = $request->cycle_id;
        $user = Auth::user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $branchId = $user->branch_id ?? session('branch_id');

        $employeesQuery = Employee::with('user');
        
        if (!$isSystemAdmin && $branchId) {
            $employeesQuery->whereHas('user', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        
        $employees = $employeesQuery->get();
        
        $templates = AppraisalTemplate::with('kpis')->where('is_active', true)->get();
        $genericTemplate = $templates->whereNull('job_grade_id')->first();

        $generatedCount = 0;
        $skippedCount = 0;

        $existingEmployeeIds = EmployeeAppraisal::where('cycle_id', $cycleId)
            ->whereIn('employee_id', $employees->pluck('id'))
            ->pluck('employee_id')
            ->toArray();

        foreach ($employees as $employee) {
            if (in_array($employee->id, $existingEmployeeIds)) {
                $skippedCount++;
                continue;
            }

            $template = null;
            if ($employee->job_grade_id) {
                $template = $templates->where('job_grade_id', $employee->job_grade_id)->first();
            }
            if (!$template) {
                $template = $genericTemplate;
            }

            if (!$template) {
                $skippedCount++;
                continue;
            }

            $cycle = AppraisalCycle::findOrFail($cycleId);

            $appraisal = EmployeeAppraisal::create([
                'employee_id' => $employee->id,
                'cycle_id' => $cycleId,
                'template_id' => $template->id,
                'manager_id' => $employee->manager_id,
                'status' => $cycle->requires_self_appraisal ? 'pending_self' : 'pending_manager'
            ]);

            foreach ($template->kpis as $kpi) {
                $appraisal->scores()->create([
                    'kpi_id' => $kpi->id,
                ]);
            }
            
            $generatedCount++;
        }

        return redirect()->back()->with('success', "تم توليد {$generatedCount} تقييم بنجاح، وتم تخطي {$skippedCount} (موجودة مسبقاً أو بدون قالب).");
    }

    // Show Appraisal Form (Self or Manager view)
    public function show(EmployeeAppraisal $appraisal)
    {
        $appraisal->load(['employee.user', 'employee.department', 'employee.jobGrade', 'manager.user', 'cycle', 'template.kpis', 'scores.kpi', 'scores.goals']);

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
        $cycleIds = $historicalAppraisals->pluck('cycle_id')->unique()->toArray();

        $deptAvgsRaw = \DB::table('employee_appraisals')
            ->join('employees', 'employee_appraisals.employee_id', '=', 'employees.id')
            ->select('employee_appraisals.cycle_id', \DB::raw('AVG(employee_appraisals.final_score) as avg_score'))
            ->where('employees.department_id', $departmentId)
            ->whereIn('employee_appraisals.cycle_id', $cycleIds)
            ->whereNotNull('employee_appraisals.final_score')
            ->groupBy('employee_appraisals.cycle_id')
            ->pluck('avg_score', 'cycle_id')
            ->toArray();
        
        foreach ($historicalAppraisals as $hist) {
            // Get department average for this specific cycle from pre-fetched array
            $deptAvg = $deptAvgsRaw[$hist->cycle_id] ?? 0;

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
            if ($score && $score->kpi) {
                $score->update(['self_score' => $scoreData['self_score']]);
                
                $weight = $score->kpi->weight;
                $totalScore += ($scoreData['self_score'] * $weight);
                $totalWeight += $weight;
            }
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

        return redirect()->route('hr.appraisals.index')->with('success', 'تم تقديم التقييم الذاتي بنجاح.');
    }

    // Submit Manager Evaluation
    public function submitManager(Request $request, EmployeeAppraisal $appraisal)
    {
        if ($appraisal->status !== 'pending_manager') abort(403, 'التقييم ليس في مرحلة اعتماد المدير.');

        $user = Auth::user();
        $isSystemAdmin = $user->role && $user->role->name === 'مدير النظام';
        $employee = $user->employee;

        if (!$isSystemAdmin && !$user->hasPermission('إدارة التقييمات الإدارية')) {
            if (!$employee || $appraisal->manager_id !== $employee->id) {
                abort(403, 'غير مصرح لك باعتماد هذا التقييم كمدير.');
            }
        }


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
            if ($score && $score->kpi) {
                $score->update(['manager_score' => $scoreData['manager_score']]);
                
                $weight = $score->kpi->weight;
                $totalScore += ($scoreData['manager_score'] * $weight);
                $totalWeight += $weight;
            }
        }

        $managerFinalScore = $totalWeight > 0 ? ($totalScore / ($totalWeight * 5)) * 100 : 0;

        $appraisal->update([
            'status' => 'pending_hr',
            'manager_comments' => $validated['manager_comments'],
            'manager_score' => $managerFinalScore,
            'final_score' => $managerFinalScore, // Manager's score acts as final score pending HR approval
            'manager_signature' => $validated['manager_signature'] ?? null
        ]);

        $appraisal->load('employee.user');
        if ($appraisal->employee && $appraisal->employee->user) {
            $notificationService = new \App\Services\NotificationService();
            $notificationService->sendInternalNotification(
                $appraisal->employee->user->id,
                'تم تقييمك من المدير المباشر',
                "قام مديرك المباشر بتقييم أدائك، وهو الآن بانتظار الاعتماد النهائي من الموارد البشرية.",
                'hr',
                Auth::id()
            );
        }

        return redirect()->route('hr.appraisals.index')->with('success', 'تم اعتماد تقييم المدير بنجاح.');
    }

    // HR Approval
    public function approveHr(Request $request, EmployeeAppraisal $appraisal)
    {
        if ($appraisal->status !== 'pending_hr') abort(403, 'التقييم ليس في مرحلة اعتماد الموارد البشرية.');

        $user = Auth::user();
        $isSystemAdmin = $user->role && $user->role->name === 'مدير النظام';

        if (!$isSystemAdmin && !$user->hasPermission('إدارة التقييمات الإدارية')) {
            abort(403, 'غير مصرح لك بالاعتماد النهائي للتقييم.');
        }


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

        $appraisal->load('employee.user');
        if ($appraisal->employee && $appraisal->employee->user) {
            $notificationService = new \App\Services\NotificationService();
            $notificationService->sendInternalNotification(
                $appraisal->employee->user->id,
                'الاعتماد النهائي للتقييم',
                "تم الاعتماد النهائي لتقييم الأداء الخاص بك. يمكنك الآن الدخول للاطلاع على نتيجتك النهائية.",
                'hr',
                Auth::id()
            );
        }

        return redirect()->route('hr.appraisals.index')->with('success', 'تم الاعتماد النهائي للتقييم بنجاح.');
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
