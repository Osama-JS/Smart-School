<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use App\Models\UserNotificationRead;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * بناء الاستعلام الأساسي لجلب إشعارات المستخدم (الشخصية + العامة)
     */
    private function buildNotificationQuery()
    {
        $user = auth()->user();
        $userId = $user->id;
        $branchId = $user->branch_id;
        $roleName = $user->role->name ?? '';

        return Notification::with([
            'sender:id,name',
            'reads' => function($q) use ($userId) {
                $q->where('user_id', $userId);
            }
        ])->where(function($q) use ($userId, $branchId, $roleName) {
            // الإشعارات الشخصية
            $q->where('user_id', $userId)
            // الإشعارات العامة للفرع
            ->orWhere(function($sub) use ($userId, $branchId, $roleName) {
                $sub->whereNull('user_id')
                    ->where('branch_id', $branchId)
                    ->where(function($typeQ) use ($userId, $roleName) {
                        $typeQ->where('target_type', 'all')
                              ->orWhere(function($rQ) use ($roleName) {
                                  $rQ->where('target_type', 'role')->where('target_role', $roleName);
                              })
                              ->orWhere(function($uQ) use ($userId) {
                                  // لأن JSON يخزن الأرقام كأرقام أو نصوص، نتحقق من الـ JSON
                                  $uQ->where('target_type', 'users')->whereJsonContains('target_users', (string)$userId)
                                     ->orWhereJsonContains('target_users', $userId);
                              });
                    });
            });
        });
    }

    /**
     * فلتر غير المقروءة
     */
    private function applyUnreadFilter($query)
    {
        $userId = auth()->id();
        $query->where(function($q) use ($userId) {
            // إما شخصي ولم يقرأ (متوافق مع القديم) أو لم يسجل في جدول القراءات
            $q->where(function($qPersonal) use ($userId) {
                $qPersonal->where('user_id', $userId)->where('is_read', false)
                          ->whereDoesntHave('reads', function($r) use ($userId) { $r->where('user_id', $userId); });
            })
            // أو عام ولم يسجل في جدول القراءات
            ->orWhere(function($qBroadcast) use ($userId) {
                $qBroadcast->whereNull('user_id')
                           ->whereDoesntHave('reads', function($r) use ($userId) { $r->where('user_id', $userId); });
            });
        });
    }

    /**
     * فلتر المقروءة
     */
    private function applyReadFilter($query)
    {
        $userId = auth()->id();
        $query->where(function($q) use ($userId) {
            $q->where(function($qPersonal) use ($userId) {
                $qPersonal->where('user_id', $userId)
                          ->where(function($sub) use ($userId) {
                              $sub->where('is_read', true)
                                  ->orWhereHas('reads', function($r) use ($userId) { $r->where('user_id', $userId); });
                          });
            })
            ->orWhere(function($qBroadcast) use ($userId) {
                $qBroadcast->whereNull('user_id')
                           ->whereHas('reads', function($r) use ($userId) { $r->where('user_id', $userId); });
            });
        });
    }

    /**
     * جلب إشعارات المستخدم الحالي للقائمة المنسدلة
     */
    public function index(Request $request)
    {
        $query = $this->buildNotificationQuery();
        
        $notifications = (clone $query)->orderBy('created_at', 'desc')->limit(20)->get();
        
        // حساب غير المقروءة
        $unreadQuery = clone $query;
        $this->applyUnreadFilter($unreadQuery);
        $unreadCount = $unreadQuery->count();

        // إضافة حقل is_read بشكل برمجي للعرض
        $userId = auth()->id();
        $notifications->each(function($notification) use ($userId) {
            $notification->is_read = $notification->isReadBy(auth()->user());
        });

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * عرض صفحة إشعاراتي كاملة
     */
    public function myNotifications(Request $request)
    {
        $query = $this->buildNotificationQuery();

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'unread') {
                $this->applyUnreadFilter($query);
            } else {
                $this->applyReadFilter($query);
            }
        }

        $notifications = clone $query;
        $notifications = $notifications->orderBy('created_at', 'desc')->paginate(15)->withQueryString();
        
        // Set is_read flag for Vue/React
        $userId = auth()->id();
        $notifications->getCollection()->transform(function ($notification) use ($userId) {
            $notification->is_read = $notification->isReadBy(auth()->user());
            return $notification;
        });

        // احصائيات
        $baseStatsQuery = $this->buildNotificationQuery();
        
        $unreadStatsQuery = clone $baseStatsQuery;
        $this->applyUnreadFilter($unreadStatsQuery);

        $importantStatsQuery = clone $baseStatsQuery;
        $importantStatsQuery->whereIn('type', ['important', 'warning']);

        $stats = [
            'total' => $baseStatsQuery->count(),
            'unread' => $unreadStatsQuery->count(),
            'important' => $importantStatsQuery->count(),
        ];

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $notifications,
                'stats' => $stats,
            ]);
        }

        return \Inertia\Inertia::render('User/Notifications/Index', [
            'notifications' => $notifications,
            'stats' => $stats,
            'filters' => $request->only(['type', 'status'])
        ]);
    }

    /**
     * تحديث حالة إشعار معين إلى "مقروء"
     */
    public function markAsRead($id)
    {
        $notification = $this->buildNotificationQuery()->findOrFail($id);
        
        // تحديث القديم إن كان شخصي
        if ($notification->user_id === auth()->id()) {
            $notification->update(['is_read' => true]);
        }

        // إضافة سجل في جدول القراءات
        UserNotificationRead::firstOrCreate([
            'user_id' => auth()->id(),
            'notification_id' => $notification->id
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * تحديث جميع الإشعارات إلى "مقروءة"
     */
    public function markAllAsRead()
    {
        $userId = auth()->id();
        
        // جلب جميع الإشعارات غير المقروءة للمستخدم
        $query = $this->buildNotificationQuery();
        $this->applyUnreadFilter($query);
        
        $unreadNotifications = $query->get();

        foreach ($unreadNotifications as $notification) {
            if ($notification->user_id === $userId) {
                $notification->update(['is_read' => true]);
            }
            UserNotificationRead::firstOrCreate([
                'user_id' => $userId,
                'notification_id' => $notification->id
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function saveFcmToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = auth()->user();
        $user->fcm_token = $request->token;
        $user->fcm_token_updated_at = now();
        $user->save();

        return response()->json(['success' => true]);
    }
}
