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
}
