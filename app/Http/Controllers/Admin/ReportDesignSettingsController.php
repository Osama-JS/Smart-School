<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;
use App\Services\ReportDesignService;
use Illuminate\Support\Facades\Storage;

class ReportDesignSettingsController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware(function ($request, $next) {
                // Restricted to School Admin, Branch Manager, or General Director
                $user = auth()->user();
                if (!$user || !in_array($user->role?->name, ['مدير الفرع', 'المدير العام', 'مدير النظام'])) {
                    abort(403, 'غير مصرح بالوصول إلى إعدادات وتصميم تقارير المنظومة.');
                }
                return $next($request);
            }),
        ];
    }

    /**
     * Display Report Design Settings Page
     */
    public function index()
    {
        $config = ReportDesignService::getDesignConfig();

        return Inertia::render('Admin/Reports/DesignSettings', [
            'design' => $config,
        ]);
    }

    /**
     * Save Report Design Settings
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            // Header
            'republic'           => 'required|string|max:255',
            'ministry'           => 'required|string|max:255',
            'school_name'        => 'required|string|max:255',
            'branch_name'        => 'nullable|string|max:255',
            'department_name'    => 'required|string|max:255',
            'default_brand_color'=> 'required|string|max:20',
            'show_header'        => 'nullable|boolean',
            'show_qr_code'       => 'nullable|boolean',
            'show_barcode'       => 'nullable|boolean',
            'logo'               => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:3072',

            // Footer & Signatures
            'show_footer'        => 'nullable|boolean',
            'show_signatures'    => 'nullable|boolean',
            'sig1_active'        => 'nullable|boolean',
            'sig1_title'         => 'nullable|string|max:100',
            'sig1_name'          => 'nullable|string|max:100',

            'sig2_active'        => 'nullable|boolean',
            'sig2_title'         => 'nullable|string|max:100',
            'sig2_name'          => 'nullable|string|max:100',

            'sig3_active'        => 'nullable|boolean',
            'sig3_title'         => 'nullable|string|max:100',
            'sig3_name'          => 'nullable|string|max:100',

            'show_stamp'         => 'nullable|boolean',
            'stamp_image'        => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:3072',
            'show_page_number'   => 'nullable|boolean',
            'footer_notice'      => 'nullable|string|max:500',
        ]);

        // Handle Logo Upload
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('report_logos', 'public');
            Setting::set('report_logo', $path);
        }

        // Handle Official Stamp Upload
        if ($request->hasFile('stamp_image')) {
            $path = $request->file('stamp_image')->store('report_stamps', 'public');
            Setting::set('report_stamp_image', $path);
        }

        // Save Header Settings
        Setting::set('report_republic', $validated['republic']);
        Setting::set('report_ministry', $validated['ministry']);
        Setting::set('report_school_name', $validated['school_name']);
        Setting::set('report_branch_name_override', $validated['branch_name'] ?? '');
        Setting::set('report_department_default', $validated['department_name']);
        Setting::set('report_brand_color', $validated['default_brand_color']);
        Setting::set('report_show_header', $request->boolean('show_header') ? '1' : '0', 'boolean');
        Setting::set('report_show_qr_code', $request->boolean('show_qr_code') ? '1' : '0', 'boolean');
        Setting::set('report_show_barcode', $request->boolean('show_barcode') ? '1' : '0', 'boolean');

        // Save Footer Settings
        Setting::set('report_show_footer', $request->boolean('show_footer') ? '1' : '0', 'boolean');
        Setting::set('report_show_signatures', $request->boolean('show_signatures') ? '1' : '0', 'boolean');
        Setting::set('report_sig1_active', $request->boolean('sig1_active') ? '1' : '0', 'boolean');
        Setting::set('report_sig1_title', $validated['sig1_title'] ?? 'إعداد / المختص');
        Setting::set('report_sig1_name', $validated['sig1_name'] ?? '');

        Setting::set('report_sig2_active', $request->boolean('sig2_active') ? '1' : '0', 'boolean');
        Setting::set('report_sig2_title', $validated['sig2_title'] ?? 'مراجعة / وكيل المدرسة');
        Setting::set('report_sig2_name', $validated['sig2_name'] ?? '');

        Setting::set('report_sig3_active', $request->boolean('sig3_active') ? '1' : '0', 'boolean');
        Setting::set('report_sig3_title', $validated['sig3_title'] ?? 'اعتماد / مدير الفرع');
        Setting::set('report_sig3_name', $validated['sig3_name'] ?? '');

        Setting::set('report_show_stamp', $request->boolean('show_stamp') ? '1' : '0', 'boolean');
        Setting::set('report_show_page_number', $request->boolean('show_page_number') ? '1' : '0', 'boolean');
        Setting::set('report_footer_notice', $validated['footer_notice'] ?? '');

        return redirect()->back()->with('success', 'تم حفظ وتطبيق إعدادات هوية وتصميم تقارير الـ PDF بنجاح.');
    }
}

