<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;
use App\Models\UserLoginLog;

class LogSuccessfulLogin
{
    /**
     * Create the event listener.
     */
    public function __construct(public Request $request)
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        $user = $event->user;
        
        $userAgent = $this->request->userAgent() ?? '';
        $deviceType = 'desktop';
        $osName = 'other';
        
        // Device Type
        if (preg_match('/(Mobile|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile)/i', $userAgent)) {
            $deviceType = 'mobile';
        }
        
        // OS Name
        if (preg_match('/iPhone|iPad|iPod|Mac OS X/i', $userAgent)) {
            $osName = preg_match('/iPhone|iPad|iPod/i', $userAgent) ? 'ios' : 'mac';
        } elseif (preg_match('/Android/i', $userAgent)) {
            $osName = 'android';
        } elseif (preg_match('/Windows/i', $userAgent)) {
            $osName = 'windows';
        } elseif (preg_match('/Linux/i', $userAgent)) {
            $osName = 'linux';
        }

        // Log the login
        UserLoginLog::create([
            'user_id' => $user->id,
            'ip_address' => $this->request->ip(),
            'device_type' => $deviceType,
            'os_name' => $osName,
            'created_at' => now(),
        ]);

        // Update last login at
        $user->last_login_at = now();
        $user->save();
    }
}
