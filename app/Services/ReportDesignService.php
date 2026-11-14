<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\Branch;

class ReportDesignService
{
    /**
     * Get default design configuration for reports
     */
    public static function getDesignConfig(?int $branchId = null): array
    {
        $branch = null;
        if ($branchId) {
            $branch = Branch::find($branchId);
        } elseif (auth()->check() && auth()->user()->branch_id) {
            $branch = Branch::find(auth()->user()->branch_id);
        }

        $branchName = $branch ? $branch->name : 'المركز الرئيسي';

        return [
            // Header Settings
            'republic'           => Setting::get('report_republic', 'الجمهورية اليمنية'),
            'ministry'           => Setting::get('report_ministry', 'وزارة التربية والتعليم والبحث العلمي'),
            'school_name'        => Setting::get('report_school_name', Setting::get('school_name', 'مدارس القيم الأهلية')),
            'branch_name'        => Setting::get('report_branch_name_override') ?: $branchName,
            'department_name'    => Setting::get('report_department_default', 'الشؤون التعليمية والإدارية'),
            'logo'               => Setting::get('report_logo', Setting::get('logo', null)),
            'show_header'        => filter_var(Setting::get('report_show_header', true), FILTER_VALIDATE_BOOLEAN),
            'show_qr_code'       => filter_var(Setting::get('report_show_qr_code', true), FILTER_VALIDATE_BOOLEAN),
            'show_barcode'       => filter_var(Setting::get('report_show_barcode', true), FILTER_VALIDATE_BOOLEAN),
            'default_brand_color'=> Setting::get('report_brand_color', '#059669'), // Default Emerald Green

            // Footer & Signatures Settings
            'show_footer'        => filter_var(Setting::get('report_show_footer', true), FILTER_VALIDATE_BOOLEAN),
            'show_signatures'    => filter_var(Setting::get('report_show_signatures', true), FILTER_VALIDATE_BOOLEAN),
            'sig1_active'        => filter_var(Setting::get('report_sig1_active', true), FILTER_VALIDATE_BOOLEAN),
            'sig1_title'         => Setting::get('report_sig1_title', 'إعداد / المختص'),
            'sig1_name'          => Setting::get('report_sig1_name', ''),

            'sig2_active'        => filter_var(Setting::get('report_sig2_active', true), FILTER_VALIDATE_BOOLEAN),
            'sig2_title'         => Setting::get('report_sig2_title', 'مراجعة / وكيل المدرسة'),
            'sig2_name'          => Setting::get('report_sig2_name', ''),

            'sig3_active'        => filter_var(Setting::get('report_sig3_active', true), FILTER_VALIDATE_BOOLEAN),
            'sig3_title'         => Setting::get('report_sig3_title', 'اعتماد / مدير الفرع'),
            'sig3_name'          => Setting::get('report_sig3_name', ''),

            'show_stamp'         => filter_var(Setting::get('report_show_stamp', true), FILTER_VALIDATE_BOOLEAN),
            'stamp_image'        => Setting::get('report_stamp_image', null),
            'show_page_number'   => filter_var(Setting::get('report_show_page_number', true), FILTER_VALIDATE_BOOLEAN),
            'footer_notice'      => Setting::get('report_footer_notice', 'وثيقة رسمية صادرة آلياً من نظام مدارك الذكي - مدارس القيم الأهلية'),
        ];
    }
}

