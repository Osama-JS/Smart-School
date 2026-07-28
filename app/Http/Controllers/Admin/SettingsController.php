<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use App\Models\Setting;

class SettingsController extends Controller
{
    /**
     * عرض صفحة الإعدادات العامة
     */
    public function index()
    {
        $settings = [
            'school_name'        => Setting::get('school_name', config('app.name', 'مدارس القيم')),
            'academic_year'      => Setting::get('academic_year', '2025/2026'),
            'timezone'           => Setting::get('timezone', config('app.timezone', 'Asia/Riyadh')),
            'locale'             => Setting::get('locale', 'ar'),
            'allow_self_reg'     => Setting::get('allow_self_reg', false),
            'session_timeout'    => Setting::get('session_timeout', 120),
            'max_login_attempts' => Setting::get('max_login_attempts', 5),
            'logo'               => Setting::get('logo', null),
            'maintenance_mode'   => filter_var(Setting::get('maintenance_mode', false), FILTER_VALIDATE_BOOLEAN),

            // Mail (SMTP) Settings
            'mail_host'          => Setting::get('mail_host', config('mail.mailers.smtp.host')),
            'mail_port'          => Setting::get('mail_port', config('mail.mailers.smtp.port')),
            'mail_username'      => Setting::get('mail_username', config('mail.mailers.smtp.username')),
            'mail_password'      => Setting::get('mail_password', config('mail.mailers.smtp.password')),
            'mail_encryption'    => Setting::get('mail_encryption', config('mail.mailers.smtp.encryption')),
            'mail_from_address'  => Setting::get('mail_from_address', config('mail.from.address')),

            // SMS Settings
            'sms_gateway_url'    => Setting::get('sms_gateway_url', ''),
            'sms_api_key'        => Setting::get('sms_api_key', ''),
            'sms_sender_id'      => Setting::get('sms_sender_id', ''),

            // Local Server Sync Settings
            'local_server_url'           => Setting::get('local_server_url', ''),
            'local_server_api_key'       => Setting::get('local_server_api_key', ''),
            'local_server_sync_enabled'  => filter_var(Setting::get('local_server_sync_enabled', false), FILTER_VALIDATE_BOOLEAN),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    /**
     * حفظ الإعدادات
     */
    public function update(Request $request)
    {
        $request->validate([
            'school_name'        => 'required|string|max:255',
            'academic_year'      => 'required|string|max:20',
            'session_timeout'    => 'required|integer|min:10|max:1440',
            'max_login_attempts' => 'required|integer|min:3|max:20',
            'logo'               => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'maintenance_mode'   => 'nullable|boolean',

            'mail_host'          => 'nullable|string|max:255',
            'mail_port'          => 'nullable|string|max:255',
            'mail_username'      => 'nullable|string|max:255',
            'mail_password'      => 'nullable|string|max:255',
            'mail_encryption'    => 'nullable|string|max:255',
            'mail_from_address'  => 'nullable|string|email|max:255',

            'sms_gateway_url'    => 'nullable|string|url|max:255',
            'sms_api_key'        => 'nullable|string|max:255',
            'sms_sender_id'      => 'nullable|string|max:255',

            'local_server_url'           => 'nullable|string|url|max:255',
            'local_server_api_key'       => 'nullable|string|max:255',
            'local_server_sync_enabled'  => 'nullable|boolean',
        ]);

        if ($request->hasFile('logo')) {
            $logoFile = $request->file('logo');
            // Check if directory exists
            if (!file_exists(public_path('images'))) {
                mkdir(public_path('images'), 0755, true);
            }
            $logoFile->move(public_path('images'), 'logo.png');
            Setting::set('logo', 'images/logo.png', 'string');
        }

        Setting::set('school_name', $request->school_name, 'string');
        Setting::set('academic_year', $request->academic_year, 'string');
        Setting::set('session_timeout', $request->session_timeout, 'integer');
        Setting::set('max_login_attempts', $request->max_login_attempts, 'integer');
        Setting::set('maintenance_mode', $request->boolean('maintenance_mode') ? '1' : '0', 'boolean');

        $integrationFields = [
            'mail_host', 'mail_port', 'mail_username', 'mail_password', 'mail_encryption', 'mail_from_address',
            'sms_gateway_url', 'sms_api_key', 'sms_sender_id',
            'local_server_url', 'local_server_api_key'
        ];

        Setting::set('local_server_sync_enabled', $request->boolean('local_server_sync_enabled') ? '1' : '0', 'boolean');

        foreach ($integrationFields as $field) {
            if ($request->has($field)) {
                Setting::set($field, $request->input($field), 'string');
            }
        }

        return redirect()->route('admin.settings')->with('success', 'تم حفظ الإعدادات بنجاح');
    }

    /**
     * فحص الاتصال بالخادم المحلي
     */
    public function testLocalServerConnection(Request $request)
    {
        $request->validate([
            'url' => 'required|url',
            'api_key' => 'nullable|string',
        ]);

        $url = rtrim($request->url, '/');

        try {
            // We set a short timeout of 5 seconds for the test
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $request->api_key,
                'Accept' => 'application/json',
            ])->timeout(5)->get($url);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم الاتصال بالخادم بنجاح.'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'فشل الاتصال: ' . $response->status() . ' ' . $response->reason()
            ], 400);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر الاتصال بالخادم (Timeout/Unreachable).'
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ غير متوقع: ' . $e->getMessage()
            ], 500);
        }
    }
}
