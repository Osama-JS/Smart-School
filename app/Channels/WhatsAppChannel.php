<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppChannel
{
    /**
     * Send the given notification.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, Notification $notification)
    {
        // Check if the notification has a toWhatsApp method
        if (! method_exists($notification, 'toWhatsApp')) {
            return;
        }

        // Get the phone number from the notifiable model
        if (! $to = $notifiable->routeNotificationFor('WhatsApp')) {
            return;
        }

        $message = $notification->toWhatsApp($notifiable);
        
        $instanceId = config('services.ultramsg.instance_id');
        $token = config('services.ultramsg.token');

        if (!$instanceId || !$token) {
            Log::warning('WhatsApp notifications skipped: UltraMsg configuration is missing.');
            return;
        }

        $apiUrl = "https://api.ultramsg.com/{$instanceId}/messages/chat";
        
        try {
            $response = Http::post($apiUrl, [
                'token' => $token,
                'to' => $to,
                'body' => $message,
            ]);

            if (!$response->successful()) {
                Log::error("Failed to send WhatsApp message to {$to}: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("WhatsApp Notification Error: " . $e->getMessage());
        }
    }
}
