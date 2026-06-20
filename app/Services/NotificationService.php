<?php

namespace App\Services;

use App\Models\Notification as AppNotification;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\SystemNotificationMail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * إرسال إشعار داخلي (يحفظ في قاعدة البيانات)
     */
    public function sendInternalNotification($userId, $title, $message, $type = 'general', $senderId = null)
    {
        return AppNotification::create([
            'user_id'   => $userId,
            'sender_id' => $senderId,
            'title'     => $title,
            'message'   => $message,
            'type'      => $type,
            'is_read'   => false,
        ]);
    }

    /**
     * إرسال إشعار عام (Broadcast)
     */
    public function sendBroadcastNotification($title, $message, $type = 'general', $senderId = null, $branchId = null, $targetType = 'all', $targetRole = null, $targetUsers = null)
    {
        return AppNotification::create([
            'user_id'      => null, // Null means broadcast
            'sender_id'    => $senderId,
            'branch_id'    => $branchId,
            'title'        => $title,
            'message'      => $message,
            'type'         => $type,
            'target_type'  => $targetType,
            'target_role'  => $targetRole,
            'target_users' => $targetUsers, // JSON array of user IDs if target_type == 'users'
            'is_read'      => false,
        ]);
    }

    /**
     * إرسال بريد إلكتروني
     */
    public function sendEmailNotification(User $user, $title, $message, $actionText = null, $actionUrl = null)
    {
        try {
            Mail::to($user->email)->send(new SystemNotificationMail($user, $title, $message, $actionText, $actionUrl));
            return true;
        } catch (\Exception $e) {
            Log::error('فشل إرسال البريد الإلكتروني: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * إرسال إشعار دفع عبر فايربيس (Firebase FCM)
     */
    public function sendFirebaseNotification(User $user, $title, $body, $data = [])
    {
        if (empty($user->fcm_token)) {
            return false;
        }

        try {
            // نستخدم Factory إذا كانت مكتبة kreait/laravel-firebase مثبتة
            if (class_exists('\Kreait\Firebase\Factory')) {
                $factory = (new \Kreait\Firebase\Factory)
                    ->withServiceAccount(base_path(env('FIREBASE_CREDENTIALS', 'storage/firebase-service-account.json')));
                
                $messaging = $factory->createMessaging();
                
                $message = \Kreait\Firebase\Messaging\CloudMessage::withTarget('token', $user->fcm_token)
                    ->withNotification(\Kreait\Firebase\Messaging\Notification::create($title, $body))
                    ->withData($data);
                
                $messaging->send($message);
                return true;
            } else {
                Log::warning('مكتبة فايربيس غير مثبتة. يرجى تثبيت kreait/laravel-firebase.');
                return false;
            }
        } catch (\Exception $e) {
            Log::error('فشل إرسال إشعار فايربيس: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * إرسال إشعار شامل (داخلي + فايربيس + إيميل اختياري)
     */
    public function sendComprehensiveNotification(User $user, $title, $message, $type = 'general', $sendEmail = false, $senderId = null)
    {
        // 1. داخلي
        $this->sendInternalNotification($user->id, $title, $message, $type, $senderId);

        // 2. فايربيس
        $this->sendFirebaseNotification($user, $title, $message, ['type' => $type]);

        // 3. إيميل (اختياري)
        if ($sendEmail && $user->email) {
            $this->sendEmailNotification($user, $title, $message);
        }
    }
}
