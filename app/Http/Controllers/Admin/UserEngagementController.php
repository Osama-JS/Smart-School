<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use App\Models\UserLoginLog;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserEngagementController extends Controller
{
    public function index(Request $request)
    {
        $filter = (string) ($request->get('filter') ?: 'all'); // all, active_today, inactive_7d, ghosts, power_users
        $search = trim((string) $request->get('search', ''));
        $role = $request->get('role', '');
        $dateStart = (string) $request->get('date_start', '');
        $dateEnd = (string) $request->get('date_end', '');
        $sortField = (string) $request->get('sort', '');
        $sortDirection = (string) ($request->get('direction') ?: 'desc');

        $query = $this->buildFilteredQuery($filter, $search, $role, $dateStart, $dateEnd, $sortField, $sortDirection);
        $users = $query->paginate(20)->withQueryString();

        // Overall stats (automatically scoped to active branch via BelongsToBranch on User)
        $today = now()->toDateString();
        $sevenDaysAgo = now()->subDays(7);

        $totalUsers = User::count();
        $ghostsCount = User::whereNull('last_login_at')->count();
        $activeTodayCount = User::whereDate('last_login_at', $today)->count();
        $inactive7dCount = User::whereNotNull('last_login_at')->where('last_login_at', '<', $sevenDaysAgo)->count();
        $powerUsersCount = User::has('loginLogs', '>=', 20)->count();

        // Growth Indicator
        $activeYesterdayCount = User::whereDate('last_login_at', now()->subDay()->toDateString())->count();
        $growth = 0;
        if ($activeYesterdayCount > 0) {
            $growth = round((($activeTodayCount - $activeYesterdayCount) / $activeYesterdayCount) * 100, 1);
        } elseif ($activeTodayCount > 0) {
            $growth = 100;
        }

        // Trend Data (Last 7 days unique users, branch-isolated)
        $last7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $last7Days->push([
                'date'  => $date->format('Y-m-d'),
                'label' => $date->locale('ar')->translatedFormat('l'),
                'count' => 0,
            ]);
        }

        $branchId = $this->resolveBranchId();
        $trendRecords = UserLoginLog::where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->when($branchId, function (Builder $q) use ($branchId) {
                $q->whereHas('user', fn (Builder $uq) => $uq->where('branch_id', $branchId));
            })
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(DISTINCT user_id) as count'))
            ->groupBy('date')
            ->get();

        $trendData = $last7Days->map(function ($day) use ($trendRecords) {
            $record = $trendRecords->firstWhere('date', $day['date']);
            if ($record) {
                $day['count'] = (int) $record->count;
            }
            return $day;
        });

        // Role Distribution (Donut Chart)
        $roleDistribution = User::with('role')
            ->select('role_id', DB::raw('COUNT(*) as count'))
            ->groupBy('role_id')
            ->get()
            ->map(function ($item) {
                return [
                    'name'  => $item->role ? $item->role->name : 'غير محدد',
                    'value' => (int) $item->count,
                ];
            });

        $roles = Role::select('id', 'name')->orderBy('id')->get();

        return Inertia::render('Admin/Engagement/Index', [
            'users'          => $users,
            'filters'        => [
                'filter'     => $filter,
                'search'     => $search,
                'role'       => $role,
                'date_start' => $dateStart,
                'date_end'   => $dateEnd,
                'sort'       => $sortField,
                'direction'  => $sortDirection,
            ],
            'availableRoles' => $roles,
            'stats'          => [
                'total_users'      => $totalUsers,
                'ghosts'           => $ghostsCount,
                'active_today'     => $activeTodayCount,
                'inactive_7d'      => $inactive7dCount,
                'power_users'      => $powerUsersCount,
                'active_yesterday' => $activeYesterdayCount,
                'growth'           => $growth,
            ],
            'charts'         => [
                'trend' => $trendData,
                'roles' => $roleDistribution,
            ],
        ]);
    }

    public function export(Request $request)
    {
        $filter = (string) ($request->get('filter') ?: 'all');
        $search = trim((string) $request->get('search', ''));
        $role = $request->get('role', '');
        $dateStart = (string) $request->get('date_start', '');
        $dateEnd = (string) $request->get('date_end', '');
        $sortField = (string) $request->get('sort', '');
        $sortDirection = (string) ($request->get('direction') ?: 'desc');
        $idsParam = (string) $request->get('ids', '');

        $query = $this->buildFilteredQuery($filter, $search, $role, $dateStart, $dateEnd, $sortField, $sortDirection);

        if (!empty($idsParam)) {
            $ids = array_values(array_filter(array_map('intval', explode(',', (string) $idsParam))));
            if (!empty($ids)) {
                $query->whereIn('users.id', $ids);
            }
        }

        $users = $query->get();

        if ($request->get('format') === 'json') {
            $design = \App\Services\ReportDesignService::getDesignConfig($this->resolveBranchId());
            $filterLabels = [
                'all'          => 'جميع المستخدمين',
                'active_today' => 'النشطون اليوم',
                'inactive_7d'  => 'خاملون منذ +7 أيام',
                'ghosts'       => 'الأشباح (لم يدخلوا أبداً)',
                'power_users'  => 'الأكثر تفاعلاً',
            ];

            $rows = $users->map(function (User $u) {
                $isGhost = !$u->last_login_at;
                $isActiveToday = (int) $u->today_logins > 0;
                $isInactive7d = $u->last_login_at && Carbon::parse($u->last_login_at)->lt(now()->subDays(7));

                $statusKey = $isGhost
                    ? 'ghost'
                    : ($isActiveToday ? 'active_today' : ($isInactive7d ? 'inactive_7d' : 'previous'));

                $statusLabel = match ($statusKey) {
                    'ghost'        => 'شبح (لم يدخل أبداً)',
                    'active_today' => 'نشط اليوم',
                    'inactive_7d'  => 'خامل (+7 أيام)',
                    default        => 'نشط سابقاً',
                };

                return [
                    'id'            => $u->id,
                    'name'          => $u->name,
                    'username'      => $u->username ?? '',
                    'email'         => $u->email ?? '',
                    'phone'         => $u->phone ?? '',
                    'role_name'     => $u->role ? $u->role->name : 'غير محدد',
                    'today_logins'  => (int) $u->today_logins,
                    'total_logins'  => (int) $u->total_logins,
                    'status_key'    => $statusKey,
                    'status_label'  => $statusLabel,
                    'last_login_at' => $u->last_login_at ? Carbon::parse($u->last_login_at)->format('Y-m-d H:i') : 'لم يدخل أبداً',
                    'is_active'     => $u->is_active !== false ? 'مفعّل' : 'معطّل',
                ];
            })->values();

            return response()->json([
                'rows' => $rows,
                'meta' => [
                    'school_name'  => $design['school_name'] ?? 'مدارس القيم الأهلية',
                    'branch_name'  => $design['branch_name'] ?? '',
                    'filter_label' => $filterLabels[$filter] ?? 'جميع المستخدمين',
                    'exported_at'  => now()->format('Y-m-d H:i'),
                ],
            ]);
        }

        $csvFileName = 'engagement_report_' . now()->format('Ymd_His') . '.csv';
        $headers = [
            'Content-type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename={$csvFileName}",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($users) {
            $file = fopen('php://output', 'w');
            fputs($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, ['المستخدم', 'اسم المستخدم', 'البريد الإلكتروني', 'رقم الجوال', 'الدور', 'مرات الدخول اليوم', 'إجمالي الدخول', 'آخر ظهور']);

            foreach ($users as $user) {
                fputcsv($file, [
                    $user->name,
                    $user->username ?? '',
                    $user->email ?? '',
                    $user->phone ?? '',
                    $user->role ? $user->role->name : 'غير محدد',
                    $user->today_logins,
                    $user->total_logins,
                    $user->last_login_at ? Carbon::parse($user->last_login_at)->format('Y-m-d H:i') : 'لم يدخل أبداً',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function nudge(User $user, NotificationService $notificationService)
    {
        $this->authorizeUserBranch($user);

        $title = 'تسجيل الدخول للنظام';
        $message = "مرحباً {$user->name}، نلاحظ غيابك عن منصة المدرسة الذكية. نرجو منك تسجيل الدخول لمتابعة آخر التحديثات والمهام الخاصة بك.";
        $senderId = auth()->id() ?? null;

        $notificationService->sendComprehensiveNotification($user, $title, $message, 'general', true, $senderId);
        Log::info("Comprehensive Nudge sent to user: {$user->name} ({$user->email}) via Internal, FCM, and Email.");

        return back()->with('success', 'تم إرسال التنبيه للمستخدم عبر لوحة التحكم وتطبيق الجوال بنجاح');
    }

    public function bulkNudge(Request $request, NotificationService $notificationService)
    {
        $validated = $request->validate([
            'user_ids'   => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
            'title'      => 'nullable|string|max:120',
            'message'    => 'nullable|string|max:1000',
        ]);

        $branchId = $this->resolveBranchId();
        $targets = User::whereIn('id', $validated['user_ids'])
            ->when($branchId, fn (Builder $q) => $q->where('branch_id', $branchId))
            ->get();

        if ($targets->isEmpty()) {
            return back()->with('error', 'لم يتم العثور على مستخدمين صالحين ضمن فرعك.');
        }

        $title = trim((string) ($validated['title'] ?? '')) ?: 'تذكير بتسجيل الدخول للنظام';
        $customMessage = trim((string) ($validated['message'] ?? ''));
        $senderId = auth()->id() ?? null;
        $sentCount = 0;

        foreach ($targets as $target) {
            $body = $customMessage !== ''
                ? str_replace('{name}', $target->name, $customMessage)
                : "مرحباً {$target->name}، نرجو منك تسجيل الدخول إلى منصة المدرسة الذكية لمتابعة آخر التحديثات والمهام الخاصة بك.";

            $notificationService->sendComprehensiveNotification($target, $title, $body, 'general', true, $senderId);
            $sentCount++;
        }

        return back()->with('success', "تم إرسال التنبيه الجماعي إلى {$sentCount} مستخدم بنجاح عبر النظام والتطبيق.");
    }

    public function show(User $user)
    {
        $this->authorizeUserBranch($user);
        $user->load('role');

        $activities = ActivityLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($activity) {
                return [
                    'id'               => $activity->id,
                    'action'           => $activity->action,
                    'table_name'       => $activity->table_name,
                    'created_at'       => $activity->created_at,
                    'created_at_human' => $activity->created_at->diffForHumans(),
                ];
            });

        $loginLogs = UserLoginLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($log) {
                return [
                    'id'               => $log->id,
                    'ip_address'       => $log->ip_address,
                    'device_type'      => $log->device_type,
                    'os_name'          => $log->os_name,
                    'created_at_human' => Carbon::parse($log->created_at)->diffForHumans(),
                ];
            });

        $recentLogins = UserLoginLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $totalSessionMinutes = 0;
        $sessionCount = 0;

        foreach ($recentLogins as $login) {
            $loginDate = Carbon::parse($login->created_at)->toDateString();
            $lastActivityThatDay = ActivityLog::where('user_id', $user->id)
                ->whereDate('created_at', $loginDate)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($lastActivityThatDay && $lastActivityThatDay->created_at > $login->created_at) {
                $diffInMinutes = Carbon::parse($login->created_at)->diffInMinutes($lastActivityThatDay->created_at);
                if ($diffInMinutes > 480) {
                    $diffInMinutes = 480;
                }
                $totalSessionMinutes += $diffInMinutes;
            } else {
                $totalSessionMinutes += 2;
            }
            $sessionCount++;
        }

        $avgSessionMinutes = $sessionCount > 0 ? round($totalSessionMinutes / $sessionCount) : 0;

        return response()->json([
            'user'                => $user,
            'activities'          => $activities,
            'devices'             => $loginLogs,
            'avg_session_minutes' => $avgSessionMinutes,
        ]);
    }

    private function buildFilteredQuery(
        string $filter,
        string $search,
        string|int|null $role,
        ?string $dateStart,
        ?string $dateEnd,
        ?string $sortField,
        ?string $sortDirection
    ): Builder {
        $query = User::with('role')
            ->select(
                'users.id',
                'users.branch_id',
                'users.name',
                'users.username',
                'users.email',
                'users.phone',
                'users.is_active',
                'users.last_login_at',
                'users.created_at',
                'users.role_id'
            )
            ->withCount([
                'loginLogs as total_logins',
                'loginLogs as today_logins' => function ($q) {
                    $q->whereDate('created_at', now()->toDateString());
                },
            ]);

        if ($filter === 'active_today') {
            $query->whereDate('last_login_at', now()->toDateString());
        } elseif ($filter === 'inactive_7d') {
            $query->whereNotNull('last_login_at')->where('last_login_at', '<', now()->subDays(7));
        } elseif ($filter === 'ghosts') {
            $query->whereNull('last_login_at');
        } elseif ($filter === 'power_users') {
            $query->has('loginLogs', '>=', 20);
        }

        if ($search !== '') {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($role) {
            $query->where('role_id', $role);
        }

        if ($dateStart && $dateEnd) {
            $query->whereBetween('last_login_at', [$dateStart . ' 00:00:00', $dateEnd . ' 23:59:59']);
        }

        $allowedSorts = ['name', 'last_login_at', 'total_logins', 'today_logins'];
        if ($sortField && in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            if ($filter === 'ghosts') {
                $query->orderBy('created_at', 'desc');
            } elseif ($filter === 'power_users') {
                $query->orderBy('total_logins', 'desc');
            } else {
                $query->orderBy('last_login_at', 'desc');
            }
        }

        return $query;
    }

    private function resolveBranchId(): ?int
    {
        $user = auth()->user();
        if (!$user) {
            return null;
        }

        if ($user->role?->name === 'مدير النظام') {
            return (request()->hasSession() && session()->has('active_branch_id'))
                ? (int) session('active_branch_id')
                : null;
        }

        return $user->branch_id ? (int) $user->branch_id : null;
    }

    private function authorizeUserBranch(User $target): void
    {
        $branchId = $this->resolveBranchId();
        if ($branchId && $target->branch_id && (int) $target->branch_id !== $branchId) {
            abort(403, 'غير مصرح لك بعرض أو مخاطبة مستخدم خارج فرعك.');
        }
    }
}
