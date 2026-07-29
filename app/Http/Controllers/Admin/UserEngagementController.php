<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserLoginLog;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;

class UserEngagementController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->get('filter', 'all'); // all, active_today, ghosts
        $search = $request->get('search', '');
        $role = $request->get('role', '');
        $dateStart = $request->get('date_start', '');
        $dateEnd = $request->get('date_end', '');
        $sortField = $request->get('sort', '');
        $sortDirection = $request->get('direction', 'desc');
        
        // Base query
        $query = User::with('role')
            ->select('users.id', 'users.name', 'users.email', 'users.last_login_at', 'users.created_at', 'users.role_id')
            ->withCount([
                'loginLogs as total_logins',
                'loginLogs as today_logins' => function ($query) {
                    $query->whereDate('created_at', now()->toDateString());
                }
            ]);

        // Apply filters
        if ($filter === 'active_today') {
            $query->whereDate('last_login_at', now()->toDateString());
        } elseif ($filter === 'ghosts') {
            $query->whereNull('last_login_at');
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        if ($role) {
            $query->where('role_id', $role);
        }
        
        if ($dateStart && $dateEnd) {
            $query->whereBetween('last_login_at', [$dateStart . ' 00:00:00', $dateEnd . ' 23:59:59']);
        }

        // Apply sorting
        $allowedSorts = ['name', 'last_login_at', 'total_logins', 'today_logins'];
        if ($sortField && in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            if ($filter === 'ghosts') {
                $query->orderBy('created_at', 'desc');
            } else {
                $query->orderBy('last_login_at', 'desc');
            }
        }

        $users = $query->paginate(20)->withQueryString();

        // Get overall stats
        $totalUsers = User::count();
        $ghostsCount = User::whereNull('last_login_at')->count();
        $activeTodayCount = User::whereDate('last_login_at', now()->toDateString())->count();
        
        // --- NEW ANALYTICS DATA ---
        
        // 1. Growth Indicator
        $activeYesterdayCount = User::whereDate('last_login_at', now()->subDay()->toDateString())->count();
        $growth = 0;
        if ($activeYesterdayCount > 0) {
            $growth = round((($activeTodayCount - $activeYesterdayCount) / $activeYesterdayCount) * 100, 1);
        } elseif ($activeTodayCount > 0) {
            $growth = 100; // From 0 to something is a 100% growth essentially
        }

        // 2. Trend Data (Last 7 days unique users)
        $last7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $last7Days->push([
                'date' => $date->format('Y-m-d'),
                'label' => $date->locale('ar')->translatedFormat('l'), // e.g., الأحد
                'count' => 0
            ]);
        }
        
        $trendRecords = UserLoginLog::where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(DISTINCT user_id) as count'))
            ->groupBy('date')
            ->get();
            
        $trendData = $last7Days->map(function ($day) use ($trendRecords) {
            $record = $trendRecords->firstWhere('date', $day['date']);
            if ($record) {
                $day['count'] = $record->count;
            }
            return $day;
        });

        // 3. Role Distribution (Donut Chart)
        $roleDistribution = User::with('role')
            ->select('role_id', DB::raw('COUNT(*) as count'))
            ->groupBy('role_id')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->role ? $item->role->name : 'غير محدد',
                    'value' => $item->count
                ];
            });

        $roles = Role::select('id', 'name')->get();

        return Inertia::render('Admin/Engagement/Index', [
            'users' => $users,
            'filters' => [
                'filter' => $filter,
                'search' => $search,
                'role' => $role,
                'date_start' => $dateStart,
                'date_end' => $dateEnd,
                'sort' => $sortField,
                'direction' => $sortDirection,
            ],
            'availableRoles' => $roles,
            'stats' => [
                'total_users' => $totalUsers,
                'ghosts' => $ghostsCount,
                'active_today' => $activeTodayCount,
                'active_yesterday' => $activeYesterdayCount,
                'growth' => $growth,
            ],
            'charts' => [
                'trend' => $trendData,
                'roles' => $roleDistribution,
            ]
        ]);
    }

    public function export(Request $request)
    {
        $filter = $request->get('filter', 'all');
        $search = $request->get('search', '');
        $role = $request->get('role', '');
        $dateStart = $request->get('date_start', '');
        $dateEnd = $request->get('date_end', '');
        $sortField = $request->get('sort', '');
        $sortDirection = $request->get('direction', 'desc');
        
        $query = User::with('role')
            ->select('users.id', 'users.name', 'users.email', 'users.last_login_at', 'users.created_at', 'users.role_id')
            ->withCount([
                'loginLogs as total_logins',
                'loginLogs as today_logins' => function ($query) {
                    $query->whereDate('created_at', now()->toDateString());
                }
            ]);

        if ($filter === 'active_today') {
            $query->whereDate('last_login_at', now()->toDateString());
        } elseif ($filter === 'ghosts') {
            $query->whereNull('last_login_at');
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        if ($role) {
            $query->where('role_id', $role);
        }
        
        if ($dateStart && $dateEnd) {
            $query->whereBetween('last_login_at', [$dateStart . ' 00:00:00', $dateEnd . ' 23:59:59']);
        }

        $allowedSorts = ['name', 'last_login_at', 'total_logins', 'today_logins'];
        if ($sortField && in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            if ($filter === 'ghosts') {
                $query->orderBy('created_at', 'desc');
            } else {
                $query->orderBy('last_login_at', 'desc');
            }
        }

        $users = $query->get();

        $csvFileName = 'engagement_report_' . now()->format('Ymd_His') . '.csv';
        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($users) {
            $file = fopen('php://output', 'w');
            fputs($file, $bom =(chr(0xEF) . chr(0xBB) . chr(0xBF))); // Add BOM for Excel UTF-8 support
            fputcsv($file, ['المستخدم', 'البريد الإلكتروني', 'الدور', 'مرات الدخول اليوم', 'إجمالي الدخول', 'آخر ظهور']);

            foreach ($users as $user) {
                fputcsv($file, [
                    $user->name,
                    $user->email,
                    $user->role ? $user->role->name : 'غير محدد',
                    $user->today_logins,
                    $user->total_logins,
                    $user->last_login_at ? \Carbon\Carbon::parse($user->last_login_at)->format('Y-m-d H:i') : 'لم يدخل أبداً'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function nudge(User $user, NotificationService $notificationService)
    {
        $title = "تسجيل الدخول للنظام";
        $message = "مرحباً {$user->name}، نلاحظ غيابك عن منصة المدرسة الذكية. نرجو منك تسجيل الدخول لمتابعة آخر التحديثات والمهام الخاصة بك.";
        $senderId = auth()->id() ?? null;

        // إرسال الإشعار للنظام الداخلي، وتطبيق الجوال عبر فايربيس، والبريد الإلكتروني
        $notificationService->sendComprehensiveNotification($user, $title, $message, 'general', true, $senderId);
        
        \Log::info("Comprehensive Nudge sent to user: {$user->name} ({$user->email}) via Internal, FCM, and Email.");
        
        return back()->with('success', 'تم إرسال التنبيه للمستخدم عبر لوحة التحكم وتطبيق الجوال بنجاح');
    }

    public function show(User $user)
    {
        $user->load('role');

        $activities = \App\Models\ActivityLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()->map(function($activity) {
                return [
                    'id' => $activity->id,
                    'action' => $activity->action,
                    'table_name' => $activity->table_name,
                    'created_at' => $activity->created_at,
                    'created_at_human' => $activity->created_at->diffForHumans()
                ];
            });

        $loginLogs = \App\Models\UserLoginLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()->map(function($log) {
                return [
                    'id' => $log->id,
                    'ip_address' => $log->ip_address,
                    'device_type' => $log->device_type,
                    'os_name' => $log->os_name,
                    'created_at_human' => \Carbon\Carbon::parse($log->created_at)->diffForHumans()
                ];
            });

        $recentLogins = \App\Models\UserLoginLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $totalSessionMinutes = 0;
        $sessionCount = 0;

        foreach ($recentLogins as $login) {
            $loginDate = \Carbon\Carbon::parse($login->created_at)->toDateString();
            $lastActivityThatDay = \App\Models\ActivityLog::where('user_id', $user->id)
                ->whereDate('created_at', $loginDate)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($lastActivityThatDay && $lastActivityThatDay->created_at > $login->created_at) {
                $diffInMinutes = \Carbon\Carbon::parse($login->created_at)->diffInMinutes($lastActivityThatDay->created_at);
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
            'user' => $user,
            'activities' => $activities,
            'devices' => $loginLogs,
            'avg_session_minutes' => $avgSessionMinutes
        ]);
    }
}
