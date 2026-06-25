<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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

        return redirect()->route('admin.settings')->with('success', 'تم حفظ الإعدادات بنجاح');
    }
}
