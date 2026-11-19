<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\AppraisalCycle;
use App\Models\AppraisalTemplate;
use App\Models\Employee;
use App\Models\EmployeeAppraisal;
use App\Models\EmployeeAppraisalEvaluator;
use App\Models\Attendance;
use App\Models\EmployeeViolation;
use App\Models\EmployeeAchievement;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Spatie\LaravelPdf\Facades\Pdf;

class EmployeeAppraisalController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = Auth::user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $branchId = $user->branch_id ?? session('branch_id');

        $cycleId = $request->cycle_id;
        $departmentId = $request->department_id;
        $employeeId = $request->employee_id;
        $dateFrom = $request->date_from;
        $dateTo = $request->date_to;

        $cacheKey = "appraisal_dashboard_v2_branch_{$branchId}_cycle_{$cycleId}_dept_{$departmentId}_emp_{$employeeId}_from_{$dateFrom}_to_{$dateTo}";

        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 60, function () use ($isSystemAdmin, $branchId, $cycleId, $departmentId, $employeeId, $dateFrom, $dateTo) {
            $baseQuery = function($query) use ($isSystemAdmin, $branchId, $cycleId, $departmentId, $employeeId, $dateFrom, $dateTo) {
                $query->join('employees as emp_filter', 'employee_appraisals.employee_id', '=', 'emp_filter.id')
                      ->join('users as usr_filter', 'emp_filter.user_id', '=', 'usr_filter.id');

                if (!$isSystemAdmin && $branchId) {
                    $query->where('usr_filter.branch_id', $branchId);
                }
                
                if ($cycleId) {
                    $query->where('employee_appraisals.cycle_id', $cycleId);
                }
                
                if ($departmentId) {
                    $query->where('emp_filter.department_id', $departmentId);
                }
                
                if ($employeeId) {
                    $query->where('employee_appraisals.employee_id', $employeeId);
                }
                
                if ($dateFrom) {
                    $query->whereDate('employee_appraisals.created_at', '>=', $dateFrom);
                }
                
                if ($dateTo) {
                    $query->whereDate('employee_appraisals.created_at', '<=', $dateTo);
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
            if ($cycleId) {
                $deptQuery->where('employee_appraisals.cycle_id', $cycleId);
            }
            if ($departmentId) {
                $deptQuery->where('employees.department_id', $departmentId);
            }
            if ($employeeId) {
                $deptQuery->where('employee_appraisals.employee_id', $employeeId);
            }
            if ($dateFrom) {
                $deptQuery->whereDate('employee_appraisals.created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $deptQuery->whereDate('employee_appraisals.created_at', '<=', $dateTo);
            }
            $departmentPerformance = $deptQuery->get();

            // 2. Score Distribution
            $completedAppraisalsQuery = EmployeeAppraisal::whereNotNull('final_score');
            if (!$isSystemAdmin && $branchId) {
                $completedAppraisalsQuery->whereHas('employee.user', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }
            if ($cycleId) {
                $completedAppraisalsQuery->where('cycle_id', $cycleId);
            }
            if ($departmentId) {
                $completedAppraisalsQuery->whereHas('employee', function($q) use ($departmentId) {
                    $q->where('department_id', $departmentId);
                });
            }
            if ($employeeId) {
                $completedAppraisalsQuery->where('employee_id', $employeeId);
            }
            if ($dateFrom) {
                $completedAppraisalsQuery->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $completedAppraisalsQuery->whereDate('created_at', '<=', $dateTo);
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
            if ($cycleId) {
                $topQuery->where('cycle_id', $cycleId);
                $bottomQuery->where('cycle_id', $cycleId);
            }
            if ($departmentId) {
                $deptFilter = function($q) use ($departmentId) { $q->whereHas('employee', function($sq) use ($departmentId) { $sq->where('department_id', $departmentId); }); };
                $deptFilter($topQuery);
                $deptFilter($bottomQuery);
            }
            if ($employeeId) {
                $topQuery->where('employee_id', $employeeId);
                $bottomQuery->where('employee_id', $employeeId);
            }
            if ($dateFrom) {
                $topQuery->whereDate('created_at', '>=', $dateFrom);
                $bottomQuery->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $topQuery->whereDate('created_at', '<=', $dateTo);
                $bottomQuery->whereDate('created_at', '<=', $dateTo);
            }

            // 5. Final Recommendations Breakdown (Normalized across EN keys & AR labels)
            $recommendationsBreakdown = [
                'promotion' => 0,
                'reward' => 0,
                'training' => 0,
                'contract_renewal' => 0,
                'pip' => 0,
                'warning' => 0,
            ];
            $recQuery = \DB::table('employee_appraisals')
                ->whereNotNull('employee_appraisals.final_recommendation')
                ->where('employee_appraisals.final_recommendation', '!=', '');
            $baseQuery($recQuery);
            foreach ($recQuery->pluck('employee_appraisals.final_recommendation') as $recValue) {
                $norm = EmployeeAppraisal::normalizeRecommendation($recValue);
                if ($norm && array_key_exists($norm, $recommendationsBreakdown)) {
                    $recommendationsBreakdown[$norm]++;
                }
            }

            // 6. Performance by KPI Category (ONLY_FULL_GROUP_BY safe)
            $categoryRawQuery = \DB::table('employee_appraisal_scores')
                ->join('employee_appraisals', 'employee_appraisal_scores.appraisal_id', '=', 'employee_appraisals.id')
                ->join('appraisal_kpis', 'employee_appraisal_scores.kpi_id', '=', 'appraisal_kpis.id')
                ->select(
                    'appraisal_kpis.category',
                    \DB::raw('SUM(employee_appraisal_scores.manager_score) as sum_manager'),
                    \DB::raw('COUNT(employee_appraisal_scores.manager_score) as cnt_manager'),
                    \DB::raw('SUM(employee_appraisal_scores.self_score) as sum_self'),
                    \DB::raw('COUNT(employee_appraisal_scores.self_score) as cnt_self')
                )
                ->whereNotNull('employee_appraisal_scores.manager_score')
                ->groupBy('appraisal_kpis.category');
            $baseQuery($categoryRawQuery);

            $categoryBuckets = [];
            foreach ($categoryRawQuery->get() as $row) {
                $catName = trim((string) ($row->category ?? '')) !== '' ? trim((string) $row->category) : 'الأداء الوظيفي';
                if (!isset($categoryBuckets[$catName])) {
                    $categoryBuckets[$catName] = ['sum_mgr' => 0.0, 'cnt_mgr' => 0, 'sum_self' => 0.0, 'cnt_self' => 0];
                }
                $categoryBuckets[$catName]['sum_mgr'] += (float) $row->sum_manager;
                $categoryBuckets[$catName]['cnt_mgr'] += (int) $row->cnt_manager;
                $categoryBuckets[$catName]['sum_self'] += (float) $row->sum_self;
                $categoryBuckets[$catName]['cnt_self'] += (int) $row->cnt_self;
            }

            $categoryPerformance = collect($categoryBuckets)
                ->map(function ($b, $catName) {
                    $avg5 = $b['cnt_mgr'] > 0 ? round($b['sum_mgr'] / $b['cnt_mgr'], 2) : 0;
                    $avgPct = round(($avg5 / 5) * 100, 1);
                    $avgSelf5 = $b['cnt_self'] > 0 ? round($b['sum_self'] / $b['cnt_self'], 2) : null;

                    return [
                        'category' => $catName,
                        'avg_score_5' => $avg5,
                        'avg_score_pct' => $avgPct,
                        'avg_self_5' => $avgSelf5,
                        'scores_count' => $b['cnt_mgr'],
                    ];
                })
                ->sortByDesc('avg_score_pct')
                ->values();

            // 7. Multi-Evaluator Committee Completion Stats
            $evalStatsQuery = \DB::table('employee_appraisal_evaluators')
                ->join('employee_appraisals', 'employee_appraisal_evaluators.appraisal_id', '=', 'employee_appraisals.id');
            $baseQuery($evalStatsQuery);
            $evalTotals = $evalStatsQuery->select(
                \DB::raw('COUNT(*) as total_assignments'),
                \DB::raw("SUM(CASE WHEN employee_appraisal_evaluators.status = 'submitted' THEN 1 ELSE 0 END) as submitted_assignments"),
                \DB::raw("SUM(CASE WHEN employee_appraisal_evaluators.status = 'pending' THEN 1 ELSE 0 END) as pending_assignments")
            )->first();

            $multiEvalQuery = \DB::table('employee_appraisal_evaluators')
                ->join('employee_appraisals', 'employee_appraisal_evaluators.appraisal_id', '=', 'employee_appraisals.id');
            $baseQuery($multiEvalQuery);
            $multiEvalCount = $multiEvalQuery
                ->select('employee_appraisals.id')
                ->groupBy('employee_appraisals.id')
                ->havingRaw('COUNT(employee_appraisal_evaluators.id) > 1')
                ->get()
                ->count();

            $totalAssignments = (int) ($evalTotals->total_assignments ?? 0);
            $submittedAssignments = (int) ($evalTotals->submitted_assignments ?? 0);
            $pendingAssignments = (int) ($evalTotals->pending_assignments ?? 0);

            $committeeStats = [
                'total_assignments' => $totalAssignments,
                'submitted_assignments' => $submittedAssignments,
                'pending_assignments' => $pendingAssignments,
                'completion_rate' => $totalAssignments > 0 ? round(($submittedAssignments / $totalAssignments) * 100, 1) : 0,
                'multi_evaluator_appraisals' => $multiEvalCount,
            ];

            return [
                'departmentPerformance' => $departmentPerformance,
                'distribution' => $distribution,
                'selfVsManager' => $scoresData,
                'topEmployees' => $topQuery->get(),
                'bottomEmployees' => $bottomQuery->get(),
                'recommendationsBreakdown' => $recommendationsBreakdown,
                'categoryPerformance' => $categoryPerformance,
                'committeeStats' => $committeeStats,
            ];
        });
        
        // Load filter lookups
        $data['cycles'] = AppraisalCycle::orderBy('start_date', 'desc')->get(['id', 'title', 'start_date', 'end_date']);
        $data['departments'] = \App\Models\Department::all(['id', 'name']);
        
        // Fetch employees
        $employeesQuery = Employee::with('user:id,name');
        if (!$isSystemAdmin && $branchId) {
            $employeesQuery->whereHas('user', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $data['employees'] = $employeesQuery->get()->map(function($emp) {
            return [
                'id' => $emp->id,
                'name' => $emp->user ? $emp->user->name : 'غير معروف'
            ];
        });
        
        $data['filters'] = $request->only(['cycle_id', 'department_id', 'employee_id', 'date_from', 'date_to']);

        return Inertia::render('HR/Appraisals/Dashboard', $data);
    }

    private function getFilterData(Request $request, $paginate = true)
    {
        $user = Auth::user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $branchId = $user->branch_id ?? session('branch_id');

        if (!$user->hasPermission('عرض التقييمات الإدارية')) {
            abort(403, 'ليس لديك صلاحية الوصول لكشف التقييمات.');
        }

        $query = EmployeeAppraisal::with([
                'employee.user',
                'employee.department',
                'cycle',
                'manager.user',
                'template',
                'evaluators.user:id,name',
            ])
            ->whereNotNull('final_score'); // Only show completed appraisals in the report

        if (!$isSystemAdmin && $branchId) {
            $query->whereHas('employee.user', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        // Filters using the new Scope
        $query->applyFilters($request);

        // Optimized Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee.user', function($q) use ($search) {
                if (is_numeric($search)) {
                    // id_number is numeric, left-anchored allows index usage
                    $q->where('id_number', 'like', "{$search}%");
                } else {
                    $q->where('name', 'like', "%{$search}%");
                }
            });
        }

        if ($paginate) {
            $appraisals = $query->latest()->paginate(15)->withQueryString();
        } else {
            // Memory Exhaustion Protection: Cap at 500 when exporting without filters
            $appraisals = $query->latest()->limit(500)->get();
        }

        // Load filter lookups
        $cycles = AppraisalCycle::orderBy('start_date', 'desc')->get(['id', 'title']);
        $departments = \App\Models\Department::all(['id', 'name']);
        
        $employeesQuery = Employee::with('user:id,name');
        if (!$isSystemAdmin && $branchId) {
            $employeesQuery->whereHas('user', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $employees = $employeesQuery->get()->map(function($emp) {
            return [
                'id' => $emp->id,
                'name' => $emp->user ? $emp->user->name : 'غير معروف'
            ];
        });

        return [
            'appraisals' => $appraisals,
            'cycles' => $cycles,
            'departments' => $departments,
            'employees' => $employees,
            'filters' => $request->all()
        ];
    }

    // Report Sheet for Employee Appraisals
    public function report(Request $request)
    {
        $data = $this->getFilterData($request, true);

        return Inertia::render('HR/Appraisals/Report', $data);
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

        $footerHtml = $this->buildPdfFooterHtml($brandColor);

        $pdf = Pdf::view('pdf.hr.employee-appraisals', $data)
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
            ->download('employee_appraisals_report.pdf');
    }

    /**
     * Download single employee's complete appraisal PDF sheet (committee, criteria, IDP, signatures).
     */
    public function downloadSinglePdf(EmployeeAppraisal $appraisal)
    {
        $appraisal->ensureDefaultManagerEvaluator();
        $appraisal->load([
            'employee.user',
            'employee.department',
            'employee.jobGrade',
            'manager.user',
            'hr',
            'cycle',
            'template.kpis',
            'scores.kpi',
            'scores.goals',
            'scores.evaluatorScores.evaluator.user:id,name',
            'evaluators.user:id,name',
        ]);

        $access = $this->resolveAccess($appraisal);
        if (!$access['is_employee'] && !$access['is_manager'] && !$access['is_evaluator'] && !$access['has_view']) {
            abort(403, 'غير مصرح لك بتحميل استمارة هذا التقييم.');
        }

        if (!$access['is_employee'] && !$access['is_manager'] && !$access['is_evaluator'] && !$access['is_system_admin'] && $access['branch_id']) {
            if ($appraisal->employee?->user?->branch_id !== $access['branch_id']) {
                abort(403, 'غير مصرح لك بتحميل تقييم خارج فرعك.');
            }
        }

        $brandColor = '#1e293b';
        $integrationData = $appraisal->buildPerformanceSnapshot();
        $footerHtml = $this->buildPdfFooterHtml($brandColor);

        return Pdf::view('pdf.hr.employee-appraisal-single', [
                'appraisal' => $appraisal,
                'integrationData' => $integrationData,
                'brandColor' => $brandColor,
            ])
            ->format('A4')
            ->margins(12, 12, 22, 12)
            ->footerHtml($footerHtml)
            ->withBrowsershot(function ($browsershot) {
                $browsershot->setChromePath('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
                           ->noSandbox()
                           ->showBackground()
                           ->waitUntilNetworkIdle()
                           ->delay(1500);
            })
            ->download("employee_appraisal_{$appraisal->id}.pdf");
    }

    private function buildPdfFooterHtml(string $brandColor): string
    {
        return '
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
    }

    // List appraisals for an employee (Self), Manager, or HR
    public function index(Request $request)
    {
        $user = Auth::user();
        $isSystemAdmin = $user->role && $user->role->name === 'مدير النظام';
        $branchId = $user->branch_id ?? session('branch_id');
        
        $query = EmployeeAppraisal::with(['employee.user', 'cycle', 'template', 'evaluators']);

        $employee = $user->employee;
        if (!$user->hasPermission('عرض التقييمات الإدارية')) {
            $query->where(function ($q) use ($employee, $user) {
                if ($employee) {
                    $q->where('employee_id', $employee->id)
                      ->orWhere('manager_id', $employee->id);
                }
                $q->orWhereHas('evaluators', fn ($eq) => $eq->where('evaluator_user_id', $user->id));
            });
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

        $appraisal->assignInitialEvaluators();

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

            $appraisal->assignInitialEvaluators();

            $generatedCount++;
        }

        return redirect()->back()->with('success', "تم توليد {$generatedCount} تقييم بنجاح، وتم تخطي {$skippedCount} (موجودة مسبقاً أو بدون قالب).");
    }

    // Show Appraisal Form (Self or Manager view)
    public function show(EmployeeAppraisal $appraisal)
    {
        $appraisal->ensureDefaultManagerEvaluator();
        $appraisal->load([
            'employee.user',
            'employee.department',
            'employee.jobGrade',
            'manager.user',
            'hr',
            'cycle',
            'template.kpis',
            'scores.kpi',
            'scores.goals',
            'scores.evaluatorScores.evaluator.user:id,name',
            'evaluators.user:id,name',
        ]);

        $access = $this->resolveAccess($appraisal);
        if (!$access['is_employee'] && !$access['is_manager'] && !$access['is_evaluator'] && !$access['has_view']) {
            abort(403, 'غير مصرح لك بعرض هذا التقييم.');
        }

        if (!$access['is_employee'] && !$access['is_manager'] && !$access['is_evaluator'] && !$access['is_system_admin'] && $access['branch_id']) {
            if ($appraisal->employee?->user?->branch_id !== $access['branch_id']) {
                abort(403, 'غير مصرح لك بعرض تقييم خارج فرعك.');
            }
        }

        $targetBranchId = $appraisal->employee?->user?->branch_id ?? $access['branch_id'];
        $availableEvaluators = User::with('role:id,name')
            ->whereHas('role', fn ($q) => $q->whereNotIn('name', ['طالب', 'ولي أمر']))
            ->when($targetBranchId, fn ($q) => $q->where('branch_id', $targetBranchId))
            ->when($appraisal->employee?->user_id, fn ($q, $uid) => $q->where('id', '!=', $uid))
            ->orderBy('name')
            ->get(['id', 'name', 'role_id'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'role_name' => $u->role?->name ?? '',
            ])
            ->values();

        // Fetch Integrated 360 Performance Snapshot
        $integrationData = $appraisal->buildPerformanceSnapshot();

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
            $deptAvg = $deptAvgsRaw[$hist->cycle_id] ?? 0;

            $trendData[] = [
                'cycle' => $hist->cycle->title,
                'employee_score' => (float) $hist->final_score,
                'department_avg' => round((float) $deptAvg, 1)
            ];

            if ($previousScore !== null) {
                $drop = $previousScore - $hist->final_score;
                if ($drop >= 20) {
                    $smartAlert = "انخفاض مفاجئ في أداء الموظف بنسبة " . round($drop, 1) . "% في دورة (" . $hist->cycle->title . ") مقارنة بالدورة السابقة.";
                } elseif ($drop >= -20) {
                    $smartAlert = null;
                }
            }
            $previousScore = $hist->final_score;
        }

        return Inertia::render('HR/Appraisals/Show', [
            'appraisal' => $appraisal,
            'integrationData' => $integrationData,
            'trendData' => $trendData,
            'smartAlert' => $smartAlert,
            'availableEvaluators' => $availableEvaluators,
            'currentEvaluator' => $access['evaluator_record'],
        ]);
    }

    // Submit Self Evaluation
    public function submitSelf(Request $request, EmployeeAppraisal $appraisal)
    {
        if ($appraisal->status !== 'pending_self') abort(403, 'التقييم ليس في مرحلة التقييم الذاتي.');

        $access = $this->resolveAccess($appraisal);
        if (!$access['is_employee']) {
            abort(403, 'غير مصرح لك بتقديم التقييم الذاتي نيابة عن موظف آخر.');
        }

        $validated = $request->validate([
            'scores' => 'required|array',
            'scores.*.id' => 'required|exists:employee_appraisal_scores,id',
            'scores.*.self_score' => 'required|numeric|min:1|max:5',
            'scores.*.self_note' => 'nullable|string|max:1000',
            'self_comments' => 'nullable|string',
            'employee_signature' => 'nullable|string'
        ]);

        $totalScore = 0;
        $totalWeight = 0;

        foreach ($validated['scores'] as $scoreData) {
            $score = $appraisal->scores()->find($scoreData['id']);
            if ($score && $score->kpi) {
                $score->update([
                    'self_score' => $scoreData['self_score'],
                    'self_note' => $scoreData['self_note'] ?? null,
                ]);

                $weight = $score->kpi->weight;
                $totalScore += ($scoreData['self_score'] * $weight);
                $totalWeight += $weight;
            }
        }

        $selfFinalScore = $totalWeight > 0 ? ($totalScore / ($totalWeight * 5)) * 100 : 0;

        $appraisal->update([
            'status' => 'pending_manager',
            'self_comments' => $validated['self_comments'] ?? null,
            'self_score' => $selfFinalScore,
            'employee_signature' => $validated['employee_signature'] ?: $appraisal->employee_signature,
            'return_reason' => null,
            'returned_at' => null,
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
                Auth::id()
            );
        }

        return redirect()->route('hr.appraisals.index')->with('success', 'تم تقديم التقييم الذاتي بنجاح.');
    }

    // Add Participant Evaluator
    public function addEvaluator(Request $request, EmployeeAppraisal $appraisal)
    {
        if ($appraisal->status === 'completed') {
            return back()->with('error', 'لا يمكن تعديل لجنة التقييم بعد الاعتماد النهائي.');
        }

        $access = $this->resolveAccess($appraisal);
        if (!$access['is_manager'] && !$access['has_manage']) {
            abort(403, 'غير مصرح لك بإضافة مقيّمين لهذا التقييم.');
        }

        $validated = $request->validate([
            'evaluator_user_id' => 'required|exists:users,id',
            'role_type' => 'required|in:manager,supervisor,hr,committee',
            'weight' => 'required|integer|min:1|max:100',
        ], [
            'evaluator_user_id.required' => 'يرجى اختيار الشخص المقيّم.',
            'role_type.required' => 'يرجى تحديد صفة المقيّم.',
            'weight.required' => 'يرجى تحديد وزن المقيّم.',
        ]);

        if ((int) $validated['evaluator_user_id'] === (int) $appraisal->employee?->user_id) {
            return back()->with('error', 'لا يمكن إضافة الموظف المقيَّم نفسه كعضو في لجنة التقييم.');
        }

        $existing = $appraisal->evaluators()->where('evaluator_user_id', $validated['evaluator_user_id'])->first();
        if ($existing) {
            $existing->update([
                'role_type' => $validated['role_type'],
                'weight' => $validated['weight'],
            ]);
            $appraisal->recalculateScoresFromEvaluators();
            return back()->with('success', 'تم تحديث بيانات المقيّم المشارك بنجاح.');
        }

        $appraisal->evaluators()->create([
            'evaluator_user_id' => $validated['evaluator_user_id'],
            'role_type' => $validated['role_type'],
            'weight' => $validated['weight'],
            'status' => 'pending',
        ]);

        if ($appraisal->status === 'pending_hr') {
            $appraisal->update(['status' => 'pending_manager']);
        }

        $appraisal->load(['employee.user', 'cycle']);
        $notificationService = new \App\Services\NotificationService();
        $notificationService->sendInternalNotification(
            (int) $validated['evaluator_user_id'],
            'تكليف بتقييم موظف',
            "تم إضافتك كمقيّم مشارك لتقييم أداء ({$appraisal->employee?->user?->name}) في دورة ({$appraisal->cycle?->title}).",
            'hr',
            Auth::id()
        );

        return back()->with('success', 'تم إضافة المقيّم المشارك إلى لجنة التقييم بنجاح.');
    }

    // Remove Participant Evaluator
    public function removeEvaluator(EmployeeAppraisal $appraisal, EmployeeAppraisalEvaluator $evaluator)
    {
        if ($appraisal->status === 'completed') {
            return back()->with('error', 'لا يمكن حذف مقيّم بعد الاعتماد النهائي.');
        }

        $access = $this->resolveAccess($appraisal);
        if (!$access['is_manager'] && !$access['has_manage']) {
            abort(403, 'غير مصرح لك بحذف مقيّم من هذا التقييم.');
        }

        if ($evaluator->appraisal_id !== $appraisal->id) {
            abort(403, 'المقيّم لا يتبع هذا التقييم.');
        }

        $evaluator->delete();
        $appraisal->recalculateScoresFromEvaluators();

        if (
            $appraisal->status === 'pending_manager'
            && $appraisal->evaluators()->where('status', 'submitted')->exists()
            && !$appraisal->evaluators()->where('status', 'pending')->exists()
        ) {
            $appraisal->update(['status' => 'pending_hr']);
        }

        return back()->with('success', 'تم إزالة المقيّم وإعادة احتساب الدرجات بنجاح.');
    }

    // Submit Manager / Evaluator Assessment
    public function submitManager(Request $request, EmployeeAppraisal $appraisal)
    {
        if ($appraisal->status !== 'pending_manager') abort(403, 'التقييم ليس في مرحلة تقييم المدير / اللجنة.');

        $access = $this->resolveAccess($appraisal);
        if (!$access['is_manager'] && !$access['is_evaluator'] && !$access['has_manage']) {
            abort(403, 'غير مصرح لك بتقييم هذا الموظف.');
        }

        $validated = $request->validate([
            'scores' => 'required|array',
            'scores.*.id' => 'required|exists:employee_appraisal_scores,id',
            'scores.*.manager_score' => 'nullable|numeric|min:1|max:5',
            'scores.*.manager_note' => 'nullable|string|max:1000',
            'manager_comments' => 'nullable|string',
            'manager_signature' => 'nullable|string',
            'strengths' => 'nullable|string|max:2000',
            'improvement_areas' => 'nullable|string|max:2000',
            'recommended_training' => 'nullable|string|max:2000',
            'final_recommendation' => 'nullable|string|max:100',
            'force_advance_to_hr' => 'nullable|boolean',
        ]);

        $actingRole = $access['evaluator_record']?->role_type ?? ($access['is_manager'] ? 'manager' : 'hr');
        $scoreMap = collect($validated['scores'])->keyBy('id');
        $appraisal->load('scores.kpi');

        foreach ($appraisal->scores as $scoreItem) {
            if ($scoreItem->kpi && $scoreItem->kpi->allowsRole($actingRole)) {
                $input = $scoreMap->get($scoreItem->id);
                if (!$input || empty($input['manager_score'])) {
                    return back()->withErrors(['scores' => 'يرجى اختيار الدرجة (من 1 إلى 5) لجميع المعايير المخصصة لك قبل الإرسال.']);
                }
            }
        }

        $canForceAdvance = ($access['is_manager'] || $access['has_manage']) && (bool) ($validated['force_advance_to_hr'] ?? false);

        $result = $appraisal->submitEvaluatorAssessment(
            Auth::user(),
            $validated['scores'],
            $validated['manager_comments'] ?? null,
            $validated['manager_signature'] ?? null,
            [
                'strengths' => $validated['strengths'] ?? null,
                'improvement_areas' => $validated['improvement_areas'] ?? null,
                'recommended_training' => $validated['recommended_training'] ?? null,
                'final_recommendation' => $validated['final_recommendation'] ?? null,
            ],
            $canForceAdvance,
            $actingRole
        );

        if ($result['all_submitted']) {
            $appraisal->load('employee.user');
            if ($appraisal->employee && $appraisal->employee->user) {
                $notificationService = new \App\Services\NotificationService();
                $notificationService->sendInternalNotification(
                    $appraisal->employee->user->id,
                    'اكتمال تقييم المدير واللجنة',
                    "تم استكمال تقييم أدائك، وهو الآن بانتظار الاعتماد النهائي من الموارد البشرية.",
                    'hr',
                    Auth::id()
                );
            }

            return redirect()->route('hr.appraisals.index')->with('success', 'تم اعتماد التقييم بنجاح وتحويله إلى الموارد البشرية.');
        }

        return redirect()->route('hr.appraisals.show', $appraisal->id)->with(
            'success',
            "تم حفظ تقييمك بنجاح. بانتظار استكمال ({$result['pending_count']}) مقيّم مشارك آخر."
        );
    }

    // HR Approval
    public function approveHr(Request $request, EmployeeAppraisal $appraisal)
    {
        if ($appraisal->status !== 'pending_hr') abort(403, 'التقييم ليس في مرحلة اعتماد الموارد البشرية.');

        $access = $this->resolveAccess($appraisal);
        if (!$access['has_manage']) {
            abort(403, 'غير مصرح لك بالاعتماد النهائي للتقييم.');
        }

        $validated = $request->validate([
            'hr_comments' => 'nullable|string',
            'hr_signature' => 'nullable|string',
            'strengths' => 'nullable|string|max:2000',
            'improvement_areas' => 'nullable|string|max:2000',
            'recommended_training' => 'nullable|string|max:2000',
            'final_recommendation' => 'nullable|string|max:100',
        ]);

        $appraisal->update([
            'status' => 'completed',
            'hr_comments' => $validated['hr_comments'] ?? null,
            'hr_id' => Auth::id(),
            'hr_signature' => $validated['hr_signature'] ?: $appraisal->hr_signature,
            'strengths' => $validated['strengths'] ?? $appraisal->strengths,
            'improvement_areas' => $validated['improvement_areas'] ?? $appraisal->improvement_areas,
            'recommended_training' => $validated['recommended_training'] ?? $appraisal->recommended_training,
            'final_recommendation' => $validated['final_recommendation'] ?? $appraisal->final_recommendation,
            'return_reason' => null,
            'returned_at' => null,
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

    // Return Appraisal for Revision
    public function returnAppraisal(Request $request, EmployeeAppraisal $appraisal)
    {
        $validated = $request->validate([
            'return_reason' => 'required|string|max:1000',
        ], [
            'return_reason.required' => 'يرجى كتابة سبب إرجاع التقييم للمراجعة.',
        ]);

        $appraisal->load(['cycle', 'employee.user', 'manager.user']);
        $access = $this->resolveAccess($appraisal);
        $notificationService = new \App\Services\NotificationService();

        if ($appraisal->status === 'pending_manager') {
            if (!$access['is_manager'] && !$access['has_manage']) {
                abort(403, 'غير مصرح لك بإرجاع هذا التقييم.');
            }
            if (!$appraisal->cycle?->requires_self_appraisal) {
                return back()->with('error', 'لا يمكن إرجاع التقييم لأن هذه الدورة لا تحتوي على مرحلة تقييم ذاتي.');
            }

            $appraisal->update([
                'status' => 'pending_self',
                'return_reason' => $validated['return_reason'],
                'returned_at' => now(),
            ]);

            if ($appraisal->employee?->user) {
                $notificationService->sendInternalNotification(
                    $appraisal->employee->user->id,
                    'تم إرجاع تقييمك الذاتي للمراجعة',
                    "أرجع مديرك تقييمك الذاتي في دورة ({$appraisal->cycle->title}) للمراجعة: {$validated['return_reason']}",
                    'hr',
                    Auth::id()
                );
            }

            return redirect()->route('hr.appraisals.index')->with('success', 'تم إرجاع التقييم إلى الموظف للمراجعة.');
        }

        if ($appraisal->status === 'pending_hr') {
            if (!$access['has_manage']) {
                abort(403, 'غير مصرح لك بإرجاع التقييم للمدير.');
            }

            $appraisal->update([
                'status' => 'pending_manager',
                'return_reason' => $validated['return_reason'],
                'returned_at' => now(),
            ]);

            $appraisal->evaluators()->update(['status' => 'pending']);

            $notifiedIds = [];
            foreach ($appraisal->evaluators as $evalItem) {
                if ($evalItem->evaluator_user_id && !in_array($evalItem->evaluator_user_id, $notifiedIds, true)) {
                    $notifiedIds[] = $evalItem->evaluator_user_id;
                    $notificationService->sendInternalNotification(
                        $evalItem->evaluator_user_id,
                        'تم إرجاع تقييم موظف للمراجعة',
                        "أرجعت الموارد البشرية تقييم الموظف ({$appraisal->employee?->user?->name}) للمراجعة: {$validated['return_reason']}",
                        'hr',
                        Auth::id()
                    );
                }
            }

            if ($appraisal->manager?->user && !in_array($appraisal->manager->user->id, $notifiedIds, true)) {
                $notificationService->sendInternalNotification(
                    $appraisal->manager->user->id,
                    'تم إرجاع تقييم موظف للمراجعة',
                    "أرجعت الموارد البشرية تقييم الموظف ({$appraisal->employee?->user?->name}) للمراجعة: {$validated['return_reason']}",
                    'hr',
                    Auth::id()
                );
            }

            return redirect()->route('hr.appraisals.index')->with('success', 'تم إرجاع التقييم إلى لجنة التقييم والمدير المباشر للمراجعة.');
        }

        abort(403, 'لا يمكن إرجاع التقييم في هذه المرحلة.');
    }

    // SMART Goals Management
    public function storeGoal(Request $request, EmployeeAppraisal $appraisal, \App\Models\EmployeeAppraisalScore $score)
    {
        $this->authorizeGoalManagement($appraisal);
        if ($score->appraisal_id !== $appraisal->id) {
            abort(403, 'المعيار لا يتبع هذا التقييم.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        $score->goals()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'progress' => 0,
            'status' => 'pending'
        ]);

        return back()->with('success', 'تم إضافة الهدف بنجاح.');
    }

    public function updateGoalProgress(Request $request, EmployeeAppraisal $appraisal, \App\Models\AppraisalGoal $goal)
    {
        $this->authorizeGoalManagement($appraisal);
        $goal->loadMissing('score');
        if (!$goal->score || $goal->score->appraisal_id !== $appraisal->id) {
            abort(403, 'الهدف لا يتبع هذا التقييم.');
        }

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
        $this->authorizeGoalManagement($appraisal);
        $goal->loadMissing('score');
        if (!$goal->score || $goal->score->appraisal_id !== $appraisal->id) {
            abort(403, 'الهدف لا يتبع هذا التقييم.');
        }

        $goal->delete();
        return back()->with('success', 'تم حذف الهدف بنجاح.');
    }

    private function resolveAccess(EmployeeAppraisal $appraisal): array
    {
        $user = Auth::user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $isBranchManager = $user && $user->role && in_array($user->role->name, ['مدير الفرع', 'مدير فرع']);
        $hasManage = $user && ($user->hasPermission('إدارة التقييمات الإدارية') || $isSystemAdmin || $isBranchManager);
        $hasView = $user && ($user->hasPermission('عرض التقييمات الإدارية') || $hasManage);
        $employee = $user?->employee;
        $evaluatorRecord = $user
            ? $appraisal->evaluators()->where('evaluator_user_id', $user->id)->first()
            : null;

        return [
            'user' => $user,
            'branch_id' => $user?->branch_id ?? session('branch_id'),
            'is_system_admin' => $isSystemAdmin,
            'has_manage' => $hasManage,
            'has_view' => $hasView,
            'is_employee' => $employee && $appraisal->employee_id === $employee->id,
            'is_manager' => $employee && $appraisal->manager_id === $employee->id,
            'is_evaluator' => $evaluatorRecord !== null,
            'evaluator_record' => $evaluatorRecord,
        ];
    }

    private function authorizeGoalManagement(EmployeeAppraisal $appraisal): void
    {
        if (in_array($appraisal->status, ['completed', 'pending_hr'])) {
            abort(403, 'لا يمكن تعديل الأهداف في هذه المرحلة.');
        }

        $access = $this->resolveAccess($appraisal);
        if (!$access['is_employee'] && !$access['is_manager'] && !$access['is_evaluator'] && !$access['has_manage']) {
            abort(403, 'غير مصرح لك بإدارة أهداف هذا التقييم.');
        }
    }
}
