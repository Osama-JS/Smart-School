<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Role;
use App\Services\NotificationService;

class NotificationSenderController extends Controller
{
    /**
     * عرض صفحة إرسال الإشعارات
     */
    public function create()
    {
        return Inertia::render('Admin/Notifications/Send');
    }

    /**
     * جلب المستخدمين التابعين للفرع (يتم تطبيق العزل التلقائي عبر Trait BelongsToBranch)
     */
    public function getUsers(Request $request)
    {
        $query = User::query()->where('is_active', true);
        
        // البحث بالاسم
        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // جلب المستخدمين مع أدوارهم لتسهيل التصفية في الواجهة
        $users = $query->with('role:id,name')->select('id', 'name', 'role_id')->limit(50)->get();

        return response()->json($users);
    }

    /**
     * جلب الإشعارات المُرسلة
     */
    public function logs(Request $request)
    {
        $baseQuery = \App\Models\Notification::where('sender_id', auth()->id());
        
        $stats = [
            'total' => (clone $baseQuery)->count(),
            'general' => (clone $baseQuery)->where('type', 'general')->count(),
            'important' => (clone $baseQuery)->where('type', 'important')->count(),
            'warning' => (clone $baseQuery)->where('type', 'warning')->count(),
        ];

        $query = clone $baseQuery;
        $query->with(['user:id,name', 'sender:id,name']);

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->has('search') && $request->search != '') {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('message', 'like', '%' . $request->search . '%')
                  ->orWhereHas('user', function($uq) use ($request) {
                      $uq->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->has('target_type') && $request->target_type !== 'all_types') {
            $query->where('target_type', $request->target_type);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(10);

        // نجلب أسماء المستخدمين إذا كان الهدف "users" لتسهيل عرضهم في الواجهة الأمامية
        $logs->getCollection()->transform(function ($log) {
            if ($log->target_type === 'users' && is_array($log->target_users)) {
                $users = \App\Models\User::whereIn('id', $log->target_users)->pluck('name')->toArray();
                $log->target_users_names = $users;
            }
            return $log;
        });

        return response()->json([
            'logs' => $logs,
            'stats' => $stats
        ]);
    }

    /**
     * إرسال الإشعار
     */
    public function store(Request $request, NotificationService $notificationService)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:general,important,warning',
            'target_type' => 'required|in:all,role,users',
            'target_users' => 'nullable|required_if:target_type,users|array',
            'target_role' => 'nullable|required_if:target_type,role|string',
            'channels' => 'required|array',
            'channels.in_app' => 'boolean',
            'channels.email' => 'boolean',
            'channels.firebase' => 'boolean',
        ]);

        $senderId = auth()->id();
        $branchId = auth()->user()->branch_id; // Get the admin's branch ID
        
        $usersQuery = User::query()->where('is_active', true);
        if ($request->target_type === 'users') {
            $usersQuery->whereIn('id', $request->target_users);
        } elseif ($request->target_type === 'role') {
            $usersQuery->whereHas('role', function($q) use ($request) {
                $q->where('name', $request->target_role);
            });
        }
        $targetUsersCount = $usersQuery->count();
        $sentCount = 0;

        // 1. إرسال الإشعار الداخلي كـ سجل واحد (Broadcast)
        if (!empty($request->channels['in_app'])) {
            $notificationService->sendBroadcastNotification(
                $request->title,
                $request->message,
                $request->type,
                $senderId,
                $branchId,
                $request->target_type,
                $request->target_role,
                $request->target_type === 'users' ? $request->target_users : null
            );
            $sentCount = $targetUsersCount; // Since broadcast hits all target users
        }

        // 2. إرسال فايربيس أو إيميل يتطلب حلقة تكرار لكل مستخدم
        if (!empty($request->channels['firebase']) || !empty($request->channels['email'])) {
            $users = $usersQuery->get();
            $sentFirebaseOrEmailCount = 0;

            foreach ($users as $user) {
                // إرسال فايربيس
                if (!empty($request->channels['firebase'])) {
                    $notificationService->sendFirebaseNotification($user, $request->title, $request->message, ['type' => $request->type]);
                }

                // إرسال إيميل
                if (!empty($request->channels['email']) && $user->email) {
                    $notificationService->sendEmailNotification($user, $request->title, $request->message);
                }
                $sentFirebaseOrEmailCount++;
            }
            // Use the max between broadcast count and firebase/email count to represent 'sent'
            $sentCount = max($sentCount, $sentFirebaseOrEmailCount);
        }

        return redirect()->back()->with('success', "تم إرسال الإشعار بنجاح للمجموعة المستهدفة ($sentCount مستخدم).");
    }

    /**
     * شاشة السجل الشامل (Global Monitor)
     */
    public function globalMonitor(Request $request)
    {
        $branchId = auth()->user()->branch_id;

        $baseQuery = \App\Models\Notification::where(function($q) use ($branchId) {
            $q->where('branch_id', $branchId)
              ->orWhereHas('user', function($uq) use ($branchId) {
                  $uq->where('branch_id', $branchId);
              })
              ->orWhereHas('sender', function($sq) use ($branchId) {
                  $sq->where('branch_id', $branchId);
              });
        });

        // 1. حساب الإحصائيات
        $thirtyDaysAgo = now()->subDays(29)->startOfDay();
        
        $chartQuery = clone $baseQuery;
        $aggregated = $chartQuery->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw('DATE(created_at) as date,
                         SUM(CASE WHEN sender_id IS NULL THEN 1 ELSE 0 END) as automated,
                         SUM(CASE WHEN sender_id IS NOT NULL THEN 1 ELSE 0 END) as manual')
            ->groupBy('date')
            ->get();

        $chartData = [];
        for ($i = 29; $i >= 0; $i--) {
            $dateObj = now()->subDays($i);
            $dateStr = $dateObj->format('Y-m-d');
            $record = $aggregated->firstWhere('date', $dateStr);
            $chartData[] = [
                'date' => $dateObj->format('d M'),
                'آلية' => $record ? (int)$record->automated : 0,
                'يدوية' => $record ? (int)$record->manual : 0,
            ];
        }

        // حساب خريطة التفاعل الحرارية (Heatmap)
        $recentReads = \App\Models\UserNotificationRead::whereHas('notification', function($q) use ($branchId) {
            $q->where('branch_id', $branchId)
              ->orWhereHas('user', function($uq) use ($branchId) { $uq->where('branch_id', $branchId); })
              ->orWhereHas('sender', function($sq) use ($branchId) { $sq->where('branch_id', $branchId); });
        })
        ->where('read_at', '>=', $thirtyDaysAgo)
        ->whereNotNull('read_at')
        ->pluck('read_at');

        $hourlyStats = array_fill(0, 24, 0);
        foreach ($recentReads as $readAt) {
            if ($readAt) {
                $hour = \Carbon\Carbon::parse($readAt)->hour;
                $hourlyStats[$hour]++;
            }
        }

        $heatmapData = [];
        $maxReads = max(1, max($hourlyStats)); // avoid division by zero
        $bestHour = 0;
        $highestCount = 0;

        foreach ($hourlyStats as $hour => $count) {
            if ($count > $highestCount) {
                $highestCount = $count;
                $bestHour = $hour;
            }
            $heatmapData[] = [
                'hour' => $hour,
                'label' => sprintf('%02d:00', $hour),
                'reads' => $count,
                'intensity' => round(($count / $maxReads) * 100) // Percentage for color intensity
            ];
        }

        $stats = [
            'total' => (clone $baseQuery)->count(),
            'automated' => (clone $baseQuery)->whereNull('sender_id')->count(),
            'manual' => (clone $baseQuery)->whereNotNull('sender_id')->count(),
            'important_or_warning' => (clone $baseQuery)->whereIn('type', ['important', 'warning'])->count(),
            'chart_data' => $chartData,
            'heatmap_data' => $heatmapData,
            'best_hour' => $bestHour,
        ];

        // 2. الفلترة
        $query = clone $baseQuery;
        
        $filterType = $request->get('type', 'all');
        if ($filterType !== 'all') {
            $query->where('type', $filterType);
        }

        $filterSource = $request->get('source', 'all');
        if ($filterSource === 'system') {
            $query->whereNull('sender_id');
        } elseif ($filterSource === 'user') {
            $query->whereNotNull('sender_id');
        }

        $search = $request->get('search', '');
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        // فلترة نوع المرسل
        $senderRole = $request->get('sender_role', 'all');
        if ($senderRole !== 'all') {
            $query->whereHas('sender.role', function($q) use ($senderRole) {
                $q->where('name', $senderRole);
            });
        }

        // فلترة اسم المستلم
        $receiverName = $request->get('receiver_name', '');
        if ($receiverName) {
            $userIds = \App\Models\User::where('name', 'like', "%{$receiverName}%")->pluck('id')->toArray();
            
            $query->where(function($q) use ($userIds) {
                if (!empty($userIds)) {
                    // موجه لشخص واحد بالاسم
                    $q->whereIn('user_id', $userIds);
                    // موجه لمجموعة أشخاص محددين بالاسم
                    $q->orWhere(function($subQ) use ($userIds) {
                        $subQ->where('target_type', 'users');
                        foreach ($userIds as $id) {
                            $subQ->orWhereJsonContains('target_users', (string)$id)
                                 ->orWhereJsonContains('target_users', (int)$id);
                        }
                    });
                } else {
                    // لم يتم العثور على أي مستخدم بهذا الاسم، لذلك لا ترجع أي نتيجة
                    $q->where('id', '<', 0);
                }
            });
        }

        // فلترة النطاق الزمني
        $dateRange = $request->get('date_range', 'all');
        if ($dateRange === 'today') {
            $query->whereDate('created_at', now()->toDateString());
        } elseif ($dateRange === 'this_week') {
            $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
        } elseif ($dateRange === 'this_month') {
            $query->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year);
        } elseif ($dateRange === 'custom') {
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');
            if ($dateFrom && $dateTo) {
                $query->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59']);
            }
        }

        // فلترة التفاعل (Engagement)
        $engagement = $request->get('engagement', 'all');
        if (in_array($engagement, ['unread', 'low', 'full'])) {
            $allNotifs = (clone $query)->withCount('reads')->get();
            $matchingIds = [];
            foreach ($allNotifs as $n) {
                $targets = $this->calculateTotalTargets($n);
                $rate = $targets > 0 ? ($n->reads_count / $targets) * 100 : 0;
                
                if ($engagement === 'unread' && $n->reads_count == 0) {
                    $matchingIds[] = $n->id;
                } elseif ($engagement === 'low' && $rate > 0 && $rate < 50) {
                    $matchingIds[] = $n->id;
                } elseif ($engagement === 'full' && $rate == 100 && $targets > 0) {
                    $matchingIds[] = $n->id;
                }
            }
            $query->whereIn('id', $matchingIds);
        }

        $query->with(['sender:id,name', 'user:id,name'])
              ->withCount('reads'); // يجلب عدد القراءات في حقل reads_count

        $notifications = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        // تحويل المصفوفة للأشخاص المستهدفين إن وُجدت
        $notifications->getCollection()->transform(function ($notif) {
            if ($notif->target_type === 'users' && is_array($notif->target_users)) {
                $notif->target_users_names = User::whereIn('id', $notif->target_users)->pluck('name')->toArray();
            }
            return $notif;
        });

        return Inertia::render('Admin/Notifications/GlobalMonitor', [
            'notifications' => $notifications,
            'stats' => $stats,
            'roles' => \App\Models\Role::select('id', 'name')->get(),
            'filters' => [
                'type' => $filterType,
                'source' => $filterSource,
                'search' => $search,
                'date_range' => $dateRange,
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
                'engagement' => $engagement,
                'sender_role' => $senderRole,
                'receiver_name' => $receiverName,
            ]
        ]);
    }

    /**
     * حساب عدد المستهدفين الكلي لإشعار معين
     */
    private function calculateTotalTargets($notification)
    {
        $branchId = $notification->branch_id ?? auth()->user()->branch_id;
        
        if ($notification->user_id) {
            return 1;
        } elseif ($notification->target_type === 'users' && is_array($notification->target_users)) {
            return count($notification->target_users);
        } elseif ($notification->target_type === 'role') {
            return User::whereHas('role', function($q) use ($notification) {
                $q->where('name', $notification->target_role);
            })->where('branch_id', $branchId)->count();
        } elseif ($notification->target_type === 'all') {
            return User::where('branch_id', $branchId)->where('is_active', true)->count();
        }
        
        return 0;
    }

    /**
     * جلب تفاصيل قراءات إشعار معين
     */
    public function readDetails(\App\Models\Notification $notification)
    {
        $branchId = $notification->branch_id ?? auth()->user()->branch_id;
        
        // 1. تحديد الجمهور المستهدف
        $targetUsers = collect();
        if ($notification->user_id) {
            $targetUsers = User::where('id', $notification->user_id)->get();
        } elseif ($notification->target_type === 'users' && is_array($notification->target_users)) {
            $targetUsers = User::whereIn('id', $notification->target_users)->get();
        } elseif ($notification->target_type === 'role') {
            $targetUsers = User::whereHas('role', function($q) use ($notification) {
                $q->where('name', $notification->target_role);
            })->where('branch_id', $branchId)->get();
        } elseif ($notification->target_type === 'all') {
            $targetUsers = User::where('branch_id', $branchId)->where('is_active', true)->get();
        }

        // 2. جلب القراءات
        $reads = \App\Models\UserNotificationRead::where('notification_id', $notification->id)
            ->with('user:id,name')
            ->get()
            ->keyBy('user_id');

        $readList = [];
        $unreadList = [];

        foreach ($targetUsers as $user) {
            if ($reads->has($user->id)) {
                $readRecord = $reads->get($user->id);
                $readAt = $readRecord->read_at ?? $readRecord->created_at;
                $readList[] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'read_at' => $readAt->format('Y-m-d H:i:s')
                ];
            } else {
                $unreadList[] = [
                    'id' => $user->id,
                    'name' => $user->name,
                ];
            }
        }

        return response()->json([
            'read_users' => $readList,
            'unread_users' => $unreadList,
            'total_target' => $targetUsers->count(),
            'read_count' => count($readList),
        ]);
    }

    /**
     * إعادة الإرسال لمن لم يقرأ
     */
    public function resendToUnread(\App\Models\Notification $notification, \App\Services\NotificationService $notificationService)
    {
        $branchId = $notification->branch_id ?? auth()->user()->branch_id;
        
        // 1. تحديد الجمهور المستهدف
        $targetUsers = collect();
        if ($notification->user_id) {
            $targetUsers = User::where('id', $notification->user_id)->get();
        } elseif ($notification->target_type === 'users' && is_array($notification->target_users)) {
            $targetUsers = User::whereIn('id', $notification->target_users)->get();
        } elseif ($notification->target_type === 'role') {
            $targetUsers = User::whereHas('role', function($q) use ($notification) {
                $q->where('name', $notification->target_role);
            })->where('branch_id', $branchId)->get();
        } elseif ($notification->target_type === 'all') {
            $targetUsers = User::where('branch_id', $branchId)->where('is_active', true)->get();
        }

        // 2. جلب القراءات
        $reads = \App\Models\UserNotificationRead::where('notification_id', $notification->id)
            ->pluck('user_id')
            ->toArray();

        $unreadIds = [];
        foreach ($targetUsers as $user) {
            if (!in_array($user->id, $reads)) {
                $unreadIds[] = $user->id;
            }
        }

        if (empty($unreadIds)) {
            return response()->json(['success' => false, 'message' => 'جميع المستخدمين المستهدفين قرؤوا الإشعار مسبقاً.']);
        }

        // 3. إنشاء إشعار جديد
        $newTitle = '[تذكير] ' . $notification->title;
        $notificationService->sendBroadcastNotification(
            $newTitle,
            $notification->message,
            $notification->type,
            auth()->id(),
            $branchId,
            'users', // target type is users
            null,
            $unreadIds
        );

        return response()->json([
            'success' => true, 
            'message' => 'تم إرسال التذكير بنجاح.',
            'count' => count($unreadIds)
        ]);
    }

    /**
     * بحث عن مستخدمين (لاستخدامها في الفلاتر المنسدلة الذكية)
     */
    public function searchUsers(Request $request)
    {
        $query = $request->get('q', '');
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $users = User::where('name', 'like', "%{$query}%")
            ->select('id', 'name')
            ->limit(20)
            ->get()
            ->map(function($user) {
                return [
                    'value' => $user->name, // نستخدم الاسم كقيمة لأن الفلتر يبحث بالاسم
                    'label' => $user->name,
                ];
            });

        return response()->json($users);
    }
}
