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
     * إرسال إشعار دفع عبر فايربيس (Firebase Cloud Messaging HTTP v1 API)
     */
    public function sendFirebaseNotification(User $user, $title, $body, $data = [])
    {
        if (empty($user->fcm_token)) {
            return false;
        }

        try {
            // التحقق من وجود ملف حساب الخدمة Service Account JSON
            $credentialsPath = $this->getFirebaseCredentialsPath();
            if (!$credentialsPath || !file_exists($credentialsPath)) {
                Log::warning('ملف إعدادات فايربيس (Service Account JSON) غير موجود في المسارات المحددة.');
                return false;
            }

            $serviceAccount = json_decode(file_get_contents($credentialsPath), true);
            if (!$serviceAccount || empty($serviceAccount['project_id']) || empty($serviceAccount['private_key'])) {
                Log::error('ملف إعدادات فايربيس غير صالح أو تنقصه المفاتيح الأساسية.');
                return false;
            }

            // توليد Google OAuth2 Access Token
            $accessToken = $this->getGoogleAccessToken($serviceAccount);
            if (!$accessToken) {
                Log::error('فشل في توليد Google Access Token لفايربيس.');
                return false;
            }

            $projectId = $serviceAccount['project_id'];
            $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            // تجهيز حمولة الرسالة
            $message = [
                'token' => (string)$user->fcm_token,
                'notification' => [
                    'title' => (string)$title,
                    'body'  => (string)$body,
                ],
                'android' => [
                    'priority' => 'HIGH',
                    'notification' => [
                        'channel_id' => 'high_importance_channel',
                        'sound' => 'default',
                        'default_vibrate_timings' => true,
                        'default_sound' => true,
                    ],
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'sound' => 'default',
                            'badge' => 1,
                            'content-available' => 1,
                        ],
                    ],
                ],
            ];

            if (!empty($data) && is_array($data)) {
                $stringData = [];
                foreach ($data as $k => $v) {
                    $stringData[(string)$k] = is_array($v) ? json_encode($v) : (string)$v;
                }
                if (!empty($stringData)) {
                    $message['data'] = $stringData;
                }
            }

            $payload = ['message' => $message];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json; UTF-8',
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                Log::info("تم إرسال إشعار FCM بنجاح للمستخدم: {$user->name} ({$user->id})");
                return true;
            } else {
                Log::error("فشل إرسال إشعار FCM (كود: {$httpCode}): " . $response);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('خطأ أثناء إرسال إشعار فايربيس: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * البحث عن مسار ملف Service Account الخاص بـ Firebase
     */
    private function getFirebaseCredentialsPath()
    {
        $possiblePaths = [
            base_path(env('FIREBASE_CREDENTIALS', 'storage/firebase-service-account.json')),
            storage_path('firebase-service-account.json'),
            storage_path('app/firebase/service_account.json'),
            storage_path('app/firebase/serviceAccountKey.json'),
            base_path('firebase-service-account.json'),
        ];

        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * توليد Access Token لـ Google API عبر Service Account JWT
     */
    private function getGoogleAccessToken(array $serviceAccount)
    {
        $cacheKey = 'fcm_google_access_token_' . md5($serviceAccount['client_email']);
        $cachedToken = cache($cacheKey);
        if ($cachedToken) {
            return $cachedToken;
        }

        $now = time();
        $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $claimSet = base64_encode(json_encode([
            'iss'   => $serviceAccount['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'exp'   => $now + 3600,
            'iat'   => $now,
        ]));

        $rawHeaderAndPayload = $header . '.' . $claimSet;
        $privateKey = openssl_pkey_get_private($serviceAccount['private_key']);
        if (!$privateKey) {
            return null;
        }

        $signature = '';
        openssl_sign($rawHeaderAndPayload, $signature, $privateKey, 'SHA256');
        $jwt = $rawHeaderAndPayload . '.' . base64_encode($signature);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $result = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($result, true);
        if (!empty($data['access_token'])) {
            cache([$cacheKey => $data['access_token']], now()->addMinutes(50));
            return $data['access_token'];
        }

        return null;
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

    /**
     * إرسال رسالة واتساب (محاكاة)
     */
    public function sendWhatsappNotification(User $user, $message)
    {
        // Check if the user has a phone number
        $phone = $user->phone ?? 'بدون رقم';
        
        // Here you would integrate with a real WhatsApp API (like Twilio, Infobip, Unifonic, etc.)
        // Example: WhatsAppApi::send($phone, $message);
        
        // For now, we simulate the sending by logging it
        Log::info("====================================");
        Log::info("[WHATSAPP MESSAGE SIMULATION]");
        Log::info("To: " . $user->name . " (" . $phone . ")");
        Log::info("Message: " . $message);
        Log::info("Status: Simulated sending successfully.");
        Log::info("====================================");

        return true;
    }
}
