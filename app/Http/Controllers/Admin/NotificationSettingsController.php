<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;

class NotificationSettingsController extends Controller
{
    /**
     * القائمة التعريفية لجميع الإشعارات التلقائية في المنصة
     */
    private function getAvailableNotificationTypes(): array
    {
        return [
            // ─── 1. قسم شؤون الطلاب وأولياء الأمور ───
            [
                'key' => 'homework',
                'name' => 'إشعار الواجبات المدرسية',
                'description' => 'إرسال إشعار فوري للطلاب وأولياء أمورهم عند قيام المعلم بنشر واجب منزلي جديد (سواء من الويب أو تطبيق الجوال).',
                'category' => 'students',
                'supported_channels' => ['firebase', 'in_app'],
                'default_channels' => ['firebase', 'in_app'],
            ],
            [
                'key' => 'attendance',
                'name' => 'إشعار غياب وتأخر الطلاب',
                'description' => 'إرسال تنبيه فوري لهاتف ولي الأمر فور رصد غياب أو تأخر ابنه في كشف الحضور اليومي أو حضور الحصص.',
                'category' => 'students',
                'supported_channels' => ['firebase', 'in_app'],
                'default_channels' => ['firebase', 'in_app'],
            ],
            [
                'key' => 'student_pledge',
                'name' => 'إشعار التعهدات والمخالفات السلوكية للطلاب',
                'description' => 'إرسال إشعار فوري لولي الأمر والطالب عند تسجيل تعهد سلوكي أو مخالفة تربوية في النظام.',
                'category' => 'students',
                'supported_channels' => ['firebase', 'in_app'],
                'default_channels' => ['firebase', 'in_app'],
            ],
            [
                'key' => 'grades',
                'name' => 'إشعار رصد واعتماد الدرجات الشهرية',
                'description' => 'إرسال إشعار للطلاب وأولياء الأمور عند اعتماد ونشر درجات تقييم شهري جديد أو نتائج اختبارات.',
                'category' => 'students',
                'supported_channels' => ['firebase', 'in_app'],
                'default_channels' => ['firebase', 'in_app'],
            ],

            // ─── 2. قسم شؤون الموظفين والمعلمين ───
            [
                'key' => 'employee_request_new',
                'name' => 'إشعار تقديم طلب جديد (للمدير والـ HR)',
                'description' => 'إشعار فوري لمدير الفرع ومسؤولي الموارد البشرية عند قيام موظف بتقديم طلب إجازة أو إذن جديد.',
                'category' => 'employees',
                'supported_channels' => ['firebase', 'in_app', 'email'],
                'default_channels' => ['firebase', 'in_app', 'email'],
            ],
            [
                'key' => 'employee_request_decision',
                'name' => 'إشعار نتيجة الطلب (للموظف صاحب الطلب)',
                'description' => 'إشعار فوري للموظف عند اتخاذ قرار الإدارة (اعتماد أو رفض) بخصوص طلبه مع إرفاق الملاحظات.',
                'category' => 'employees',
                'supported_channels' => ['firebase', 'in_app', 'email'],
                'default_channels' => ['firebase', 'in_app', 'email'],
            ],
            [
                'key' => 'employee_achievement',
                'name' => 'إشعار تسجيل إنجاز ونقاط تميز',
                'description' => 'إشعار تشجيعي للموظف فور توثيق إنجاز جديد له أو منحه نقاط تميز في النظام.',
                'category' => 'employees',
                'supported_channels' => ['firebase', 'in_app'],
                'default_channels' => ['firebase', 'in_app'],
            ],
            [
                'key' => 'employee_violation',
                'name' => 'إشعار تسجيل مخالفة إدارية',
                'description' => 'إشعار إداري للموظف فور تسجيل مخالفة أو لفت نظر في النظام لإلزامه بتأكيد العلم.',
                'category' => 'employees',
                'supported_channels' => ['firebase', 'in_app'],
                'default_channels' => ['firebase', 'in_app'],
            ],
            [
                'key' => 'meeting',
                'name' => 'إشعار دعوات الاجتماعات المدرسية',
                'description' => 'إشعار تلقائي لجميع الموظفين والمعلمين المشاركين عند جدولة اجتماع مدرسي جديد.',
                'category' => 'employees',
                'supported_channels' => ['firebase', 'in_app', 'email'],
                'default_channels' => ['firebase', 'in_app', 'email'],
            ],
        ];
    }

    /**
     * عرض شاشة إعدادات الإشعارات التلقائية
     */
    public function index()
    {
        $types = $this->getAvailableNotificationTypes();

        $settings = [];
        foreach ($types as $type) {
            $key = $type['key'];
            $enabledRaw = Setting::get("auto_notify_{$key}_enabled", true);
            $channelsRaw = Setting::get("auto_notify_{$key}_channels", null);

            $enabled = filter_var($enabledRaw, FILTER_VALIDATE_BOOLEAN);
            if ($channelsRaw === null) {
                $channels = $type['default_channels'];
            } else {
                $channels = is_array($channelsRaw) ? $channelsRaw : (json_decode($channelsRaw, true) ?? $type['default_channels']);
            }

            $settings[$key] = [
                'enabled' => $enabled,
                'channels' => $channels,
            ];
        }

        return Inertia::render('Admin/Notifications/Settings', [
            'notificationTypes' => $types,
            'currentSettings' => $settings,
        ]);
    }

    /**
     * حفظ وتحديث إعدادات الإشعارات التلقائية
     */
    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.enabled' => 'required|boolean',
            'settings.*.channels' => 'nullable|array',
            'settings.*.channels.*' => 'in:firebase,in_app,email',
        ]);

        foreach ($request->input('settings') as $key => $data) {
            Setting::set("auto_notify_{$key}_enabled", $data['enabled'] ? '1' : '0', 'boolean');
            $channels = $data['channels'] ?? ['firebase', 'in_app'];
            Setting::set("auto_notify_{$key}_channels", json_encode(array_values($channels)), 'json');
        }

        return back()->with('success', 'تم حفظ وتحديث إعدادات الإشعارات التلقائية بنجاح.');
    }
}

