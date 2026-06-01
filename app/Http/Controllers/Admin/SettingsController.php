<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * عرض صفحة الإعدادات العامة
     */
    public function index()
    {
        $settings = [
            'school_name'     => config('app.name', 'مدارس القيم'),
            'academic_year'   => '2025/2026',
            'timezone'        => config('app.timezone', 'Asia/Riyadh'),
            'locale'          => 'ar',
            'allow_self_reg'  => false,
            'session_timeout' => 120,
            'max_login_attempts' => 5,
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
        ]);

        // في نظام حقيقي يُحفظ في جدول settings أو ملف .env
        return redirect()->route('admin.settings')->with('success', 'تم حفظ الإعدادات بنجاح');
    }
}
