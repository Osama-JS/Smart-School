<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

/**
 * MasterPermissionsSeeder v1.0
 * ===================================================================
 * السيدر الموحد والمركزي لجميع الصلاحيات والأدوار في النظام.
 *
 * المبادئ الجوهرية:
 *  1. firstOrCreate  - لا ينشئ صلاحية موجودة مسبقاً
 *  2. syncWithoutDetaching - لا يحذف أي صلاحية مرتبطة بدور
 *  3. مدير النظام يحصل دائماً على جميع الصلاحيات المتاحة
 *  4. هذا السيدر هو المرجع الوحيد - لا تعارض ولا تكرار
 *
 *  لإضافة صلاحيات جديدة: أضفها في buildPermissionsMap()
 *  لتعديل أدوار: عدّل buildRolesConfig()
 * ===================================================================
 */
class MasterPermissionsSeeder extends Seeder
{
    // =========================================================================
    //  SECTION 1: خريطة جميع الصلاحيات موزعة حسب الوحدات
    //  لإضافة صلاحية جديدة: أضفها في الوحدة المناسبة أدناه.
    // =========================================================================
    private function buildPermissionsMap(): array
    {
        return [
            // ── 1. وحدة الإدارة العامة (admin) ──
            ['name' => 'إدارة المستخدمين', 'module' => 'admin'],
            ['name' => 'إدارة الصلاحيات', 'module' => 'admin'],
            ['name' => 'إعدادات النظام', 'module' => 'admin'],
            ['name' => 'إدارة الفروع', 'module' => 'admin'],
            ['name' => 'إدارة المهام', 'module' => 'admin'],
            ['name' => 'إدارة لوحة القيادة التنفيذية', 'module' => 'admin'],
            ['name' => 'إدارة سير العمل المؤتمت', 'module' => 'admin'],
            ['name' => 'إدارة الأرشفة المتقدمة', 'module' => 'admin'],
            ['name' => 'إدارة الأصول والصيانة', 'module' => 'admin'],
            ['name' => 'عرض المستخدمين', 'module' => 'admin'],
            ['name' => 'إضافة مستخدم', 'module' => 'admin'],
            ['name' => 'تعديل مستخدم', 'module' => 'admin'],
            ['name' => 'حذف مستخدم', 'module' => 'admin'],
            ['name' => 'عرض الصلاحيات', 'module' => 'admin'],
            ['name' => 'إضافة صلاحية', 'module' => 'admin'],
            ['name' => 'تعديل صلاحية', 'module' => 'admin'],
            ['name' => 'حذف صلاحية', 'module' => 'admin'],
            ['name' => 'عرض الفروع', 'module' => 'admin'],
            ['name' => 'إضافة فرع', 'module' => 'admin'],
            ['name' => 'تعديل فرع', 'module' => 'admin'],
            ['name' => 'حذف فرع', 'module' => 'admin'],
            ['name' => 'عرض المهام', 'module' => 'admin'],
            ['name' => 'إضافة مهمة', 'module' => 'admin'],
            ['name' => 'تعديل مهمة', 'module' => 'admin'],
            ['name' => 'حذف مهمة', 'module' => 'admin'],
            ['name' => 'عرض لوحة القيادة التنفيذية', 'module' => 'admin'],
            ['name' => 'تصدير تقارير لوحة القيادة', 'module' => 'admin'],
            ['name' => 'عرض مسارات سير العمل', 'module' => 'admin'],
            ['name' => 'إنشاء مسار سير عمل', 'module' => 'admin'],
            ['name' => 'تعديل مسار سير عمل', 'module' => 'admin'],
            ['name' => 'إيقاف مسار سير عمل', 'module' => 'admin'],
            ['name' => 'عرض الأرشيف', 'module' => 'admin'],
            ['name' => 'إضافة مستند للأرشيف', 'module' => 'admin'],
            ['name' => 'تعديل مستند أرشيفي', 'module' => 'admin'],
            ['name' => 'حذف مستند أرشيفي', 'module' => 'admin'],
            ['name' => 'صلاحية الوصول السري للأرشيف', 'module' => 'admin'],
            ['name' => 'عرض الأصول', 'module' => 'admin'],
            ['name' => 'إضافة أصل جديد', 'module' => 'admin'],
            ['name' => 'طلب صيانة', 'module' => 'admin'],
            ['name' => 'اعتماد طلبات الصيانة', 'module' => 'admin'],
            ['name' => 'تتبع حالة الأصول', 'module' => 'admin'],

            // ── 2. وحدة الموارد البشرية (hr) ──
            ['name' => 'إدارة الأقسام', 'module' => 'hr'],
            ['name' => 'إدارة الموظفين', 'module' => 'hr'],
            ['name' => 'إدارة الدرجات الوظيفية', 'module' => 'hr'],
            ['name' => 'إدارة الحضور والانصراف', 'module' => 'hr'],
            ['name' => 'إدارة الشفتات', 'module' => 'hr'],
            ['name' => 'إدارة الطلبات الإدارية', 'module' => 'hr'],
            ['name' => 'إدارة أنواع المخالفات', 'module' => 'hr'],
            ['name' => 'إدارة المخالفات', 'module' => 'hr'],
            ['name' => 'إدارة الإجازات والعطلات', 'module' => 'hr'],
            ['name' => 'إدارة طلبات الموظفين', 'module' => 'hr'],
            ['name' => 'إدارة التقييمات الإدارية', 'module' => 'hr'],
            ['name' => 'إدارة التقييم الشامل', 'module' => 'hr'],
            ['name' => 'إدارة إنجازات الموظفين', 'module' => 'hr'],
            ['name' => 'مراجعة الحضور والانصراف', 'module' => 'hr'],
            ['name' => 'عرض إنجازاتي', 'module' => 'hr'],
            ['name' => 'عرض الأقسام', 'module' => 'hr'],
            ['name' => 'إضافة قسم', 'module' => 'hr'],
            ['name' => 'تعديل قسم', 'module' => 'hr'],
            ['name' => 'حذف قسم', 'module' => 'hr'],
            ['name' => 'عرض الموظفين', 'module' => 'hr'],
            ['name' => 'إضافة موظف', 'module' => 'hr'],
            ['name' => 'تعديل موظف', 'module' => 'hr'],
            ['name' => 'حذف موظف', 'module' => 'hr'],
            ['name' => 'عرض الدرجات الوظيفية', 'module' => 'hr'],
            ['name' => 'إضافة درجة وظيفية', 'module' => 'hr'],
            ['name' => 'تعديل درجة وظيفية', 'module' => 'hr'],
            ['name' => 'حذف درجة وظيفية', 'module' => 'hr'],
            ['name' => 'عرض الحضور والانصراف', 'module' => 'hr'],
            ['name' => 'إضافة حضور وانصراف', 'module' => 'hr'],
            ['name' => 'تعديل حضور وانصراف', 'module' => 'hr'],
            ['name' => 'حذف حضور وانصراف', 'module' => 'hr'],
            ['name' => 'اعتماد الحضور', 'module' => 'hr'],
            ['name' => 'عرض الشفتات', 'module' => 'hr'],
            ['name' => 'إضافة شفت', 'module' => 'hr'],
            ['name' => 'تعديل شفت', 'module' => 'hr'],
            ['name' => 'حذف شفت', 'module' => 'hr'],
            ['name' => 'عرض أنواع المخالفات', 'module' => 'hr'],
            ['name' => 'إضافة نوع مخالفة', 'module' => 'hr'],
            ['name' => 'تعديل نوع مخالفة', 'module' => 'hr'],
            ['name' => 'حذف نوع مخالفة', 'module' => 'hr'],
            ['name' => 'عرض المخالفات', 'module' => 'hr'],
            ['name' => 'إضافة مخالفة', 'module' => 'hr'],
            ['name' => 'تعديل مخالفة', 'module' => 'hr'],
            ['name' => 'حذف مخالفة', 'module' => 'hr'],
            ['name' => 'اعتماد مخالفة', 'module' => 'hr'],
            ['name' => 'عرض مخالفاتي', 'module' => 'hr'],
            ['name' => 'عرض الإجازات والعطلات', 'module' => 'hr'],
            ['name' => 'إضافة إجازة أو عطلة', 'module' => 'hr'],
            ['name' => 'تعديل إجازة أو عطلة', 'module' => 'hr'],
            ['name' => 'حذف إجازة أو عطلة', 'module' => 'hr'],
            ['name' => 'عرض طلبات الموظفين', 'module' => 'hr'],
            ['name' => 'اعتماد طلبات الموظفين', 'module' => 'hr'],
            ['name' => 'رفض طلبات الموظفين', 'module' => 'hr'],
            ['name' => 'عرض التقييمات الإدارية', 'module' => 'hr'],
            ['name' => 'إدارة قوالب التقييم', 'module' => 'hr'],
            ['name' => 'إضافة قالب تقييم', 'module' => 'hr'],
            ['name' => 'تعديل قالب تقييم', 'module' => 'hr'],
            ['name' => 'حذف قالب تقييم', 'module' => 'hr'],
            ['name' => 'إدارة دورات التقييم', 'module' => 'hr'],
            ['name' => 'إضافة دورة تقييم', 'module' => 'hr'],
            ['name' => 'تعديل دورة تقييم', 'module' => 'hr'],
            ['name' => 'حذف دورة تقييم', 'module' => 'hr'],
            ['name' => 'توليد التقييمات', 'module' => 'hr'],
            ['name' => 'اعتماد التقييم النهائي', 'module' => 'hr'],
            ['name' => 'عرض نماذج التقييم', 'module' => 'hr'],
            ['name' => 'إنشاء نموذج تقييم', 'module' => 'hr'],
            ['name' => 'إرسال طلبات التقييم', 'module' => 'hr'],
            ['name' => 'عرض نتائج التقييم الشامل', 'module' => 'hr'],
            ['name' => 'عرض الإنجازات', 'module' => 'hr'],
            ['name' => 'إضافة إنجاز', 'module' => 'hr'],
            ['name' => 'تعديل إنجاز', 'module' => 'hr'],
            ['name' => 'حذف إنجاز', 'module' => 'hr'],
            ['name' => 'عرض أنواع الإنجازات', 'module' => 'hr'],
            ['name' => 'إضافة نوع إنجاز', 'module' => 'hr'],
            ['name' => 'تعديل نوع إنجاز', 'module' => 'hr'],
            ['name' => 'حذف نوع إنجاز', 'module' => 'hr'],

            // ── 3. وحدة الشؤون الأكاديمية (academic) ──
            ['name' => 'إدارة السنوات الدراسية', 'module' => 'academic'],
            ['name' => 'إدارة الفصول الدراسية', 'module' => 'academic'],
            ['name' => 'إدارة المراحل والصفوف', 'module' => 'academic'],
            ['name' => 'إدارة الشعب', 'module' => 'academic'],
            ['name' => 'إدارة المواد الدراسية', 'module' => 'academic'],
            ['name' => 'إدارة الجداول الدراسية', 'module' => 'academic'],
            ['name' => 'إدارة التسجيلات', 'module' => 'academic'],
            ['name' => 'إدارة المكتبة الرقمية', 'module' => 'academic'],
            ['name' => 'إدارة الكتب الورقية', 'module' => 'academic'],
            ['name' => 'إدارة الاستعارات', 'module' => 'academic'],
            ['name' => 'إدارة الخطط الدراسية', 'module' => 'academic'],
            ['name' => 'إدارة قوالب الخطط الدراسية', 'module' => 'academic'],
            ['name' => 'إدارة تغطية الحصص', 'module' => 'academic'],
            ['name' => 'إدارة جداول الاختبارات', 'module' => 'academic'],
            ['name' => 'إدارة فترات الرصد', 'module' => 'academic'],
            ['name' => 'إدارة إنجازات الطلاب', 'module' => 'academic'],
            ['name' => 'إدارة انضباط الطلاب', 'module' => 'academic'],
            ['name' => 'إدارة زيارات أولياء الأمور', 'module' => 'academic'],
            ['name' => 'عرض السنوات الدراسية', 'module' => 'academic'],
            ['name' => 'إضافة سنة دراسية', 'module' => 'academic'],
            ['name' => 'تعديل سنة دراسية', 'module' => 'academic'],
            ['name' => 'حذف سنة دراسية', 'module' => 'academic'],
            ['name' => 'عرض المراحل والصفوف', 'module' => 'academic'],
            ['name' => 'إضافة مرحلة أو صف', 'module' => 'academic'],
            ['name' => 'تعديل مرحلة أو صف', 'module' => 'academic'],
            ['name' => 'حذف مرحلة أو صف', 'module' => 'academic'],
            ['name' => 'عرض المواد الدراسية', 'module' => 'academic'],
            ['name' => 'إضافة مادة دراسية', 'module' => 'academic'],
            ['name' => 'تعديل مادة دراسية', 'module' => 'academic'],
            ['name' => 'حذف مادة دراسية', 'module' => 'academic'],
            ['name' => 'عرض الجداول الدراسية', 'module' => 'academic'],
            ['name' => 'إضافة جدول دراسي', 'module' => 'academic'],
            ['name' => 'تعديل جدول دراسي', 'module' => 'academic'],
            ['name' => 'حذف جدول دراسي', 'module' => 'academic'],
            ['name' => 'إسناد المعلمين', 'module' => 'academic'],
            ['name' => 'عرض التسجيلات', 'module' => 'academic'],
            ['name' => 'إضافة تسجيل', 'module' => 'academic'],
            ['name' => 'تعديل تسجيل', 'module' => 'academic'],
            ['name' => 'حذف تسجيل', 'module' => 'academic'],
            ['name' => 'عرض المكتبة الرقمية', 'module' => 'academic'],
            ['name' => 'إضافة للمكتبة الرقمية', 'module' => 'academic'],
            ['name' => 'حذف من المكتبة الرقمية', 'module' => 'academic'],
            ['name' => 'عرض الكتب الورقية', 'module' => 'academic'],
            ['name' => 'إضافة كتاب', 'module' => 'academic'],
            ['name' => 'تعديل كتاب', 'module' => 'academic'],
            ['name' => 'حذف كتاب', 'module' => 'academic'],
            ['name' => 'عرض الاستعارات', 'module' => 'academic'],
            ['name' => 'إضافة استعارة', 'module' => 'academic'],
            ['name' => 'إرجاع استعارة', 'module' => 'academic'],
            ['name' => 'حذف استعارة', 'module' => 'academic'],
            ['name' => 'عرض الخطط الدراسية', 'module' => 'academic'],
            ['name' => 'إضافة خطة دراسية', 'module' => 'academic'],
            ['name' => 'تعديل خطة دراسية', 'module' => 'academic'],
            ['name' => 'تحميل الخطط الدراسية', 'module' => 'academic'],
            ['name' => 'حذف الخطط الدراسية', 'module' => 'academic'],
            ['name' => 'عرض قوالب الخطط الدراسية', 'module' => 'academic'],
            ['name' => 'إضافة قوالب خطط دراسية', 'module' => 'academic'],
            ['name' => 'تعديل قوالب خطط دراسية', 'module' => 'academic'],
            ['name' => 'حذف قوالب خطط دراسية', 'module' => 'academic'],
            ['name' => 'عرض تغطية الحصص', 'module' => 'academic'],
            ['name' => 'إضافة تغطية حصة', 'module' => 'academic'],
            ['name' => 'حذف تغطية حصة', 'module' => 'academic'],
            ['name' => 'عرض جداول الاختبارات', 'module' => 'academic'],
            ['name' => 'إضافة جدول اختبارات', 'module' => 'academic'],
            ['name' => 'تعديل جدول اختبارات', 'module' => 'academic'],
            ['name' => 'حذف جدول اختبارات', 'module' => 'academic'],
            ['name' => 'اعتماد ونشر جدول الاختبارات', 'module' => 'academic'],
            ['name' => 'طباعة جداول الاختبارات', 'module' => 'academic'],
            ['name' => 'عرض فترات الرصد', 'module' => 'academic'],
            ['name' => 'إضافة فترة رصد', 'module' => 'academic'],
            ['name' => 'تعديل فترة رصد', 'module' => 'academic'],
            ['name' => 'حذف فترة رصد', 'module' => 'academic'],
            ['name' => 'إغلاق فترة الرصد', 'module' => 'academic'],
            ['name' => 'عرض إنجازات الطلاب', 'module' => 'academic'],
            ['name' => 'إضافة إنجاز لطالب', 'module' => 'academic'],
            ['name' => 'تعديل إنجاز طالب', 'module' => 'academic'],
            ['name' => 'حذف إنجاز طالب', 'module' => 'academic'],
            ['name' => 'اعتماد إنجازات الطلاب', 'module' => 'academic'],
            ['name' => 'طباعة شهادة التميز', 'module' => 'academic'],
            ['name' => 'إدارة أنواع الإنجازات', 'module' => 'academic'],
            ['name' => 'إعدادات التلعيب والشارات', 'module' => 'academic'],
            ['name' => 'عرض سجلات الانضباط', 'module' => 'academic'],
            ['name' => 'إضافة مخالفة سلوكية', 'module' => 'academic'],
            ['name' => 'تعديل مخالفة سلوكية', 'module' => 'academic'],
            ['name' => 'حذف مخالفة سلوكية', 'module' => 'academic'],
            ['name' => 'إعدادات أنواع المخالفات السلوكية', 'module' => 'academic'],
            ['name' => 'عرض الاستدعاءات', 'module' => 'academic'],
            ['name' => 'إضافة استدعاء', 'module' => 'academic'],
            ['name' => 'تعديل استدعاء', 'module' => 'academic'],
            ['name' => 'حذف استدعاء', 'module' => 'academic'],
            ['name' => 'طباعة الاستدعاء', 'module' => 'academic'],
            ['name' => 'عرض التعهدات', 'module' => 'academic'],
            ['name' => 'إضافة تعهد', 'module' => 'academic'],
            ['name' => 'تعديل تعهد', 'module' => 'academic'],
            ['name' => 'حذف تعهد', 'module' => 'academic'],
            ['name' => 'توقيع التعهد', 'module' => 'academic'],
            ['name' => 'طباعة التعهد', 'module' => 'academic'],
            ['name' => 'عرض زيارات أولياء الأمور', 'module' => 'academic'],
            ['name' => 'إضافة زيارة ولي أمر', 'module' => 'academic'],
            ['name' => 'تعديل زيارة ولي أمر', 'module' => 'academic'],
            ['name' => 'حذف زيارة ولي أمر', 'module' => 'academic'],
            ['name' => 'اعتماد زيارة ولي أمر', 'module' => 'academic'],
            ['name' => 'عرض إحصائيات الزيارات', 'module' => 'academic'],
            ['name' => 'تحويل الزيارة لإنجاز', 'module' => 'academic'],
            ['name' => 'تحويل الزيارة لمخالفة', 'module' => 'academic'],

            // ── 4. وحدة الطلاب (students) ──
            ['name' => 'إدارة الطلاب', 'module' => 'students'],
            ['name' => 'عرض نتائج الطلاب', 'module' => 'students'],
            ['name' => 'إدارة الدرجات', 'module' => 'students'],
            ['name' => 'إدارة غياب الطلاب', 'module' => 'students'],
            ['name' => 'عرض الطلاب', 'module' => 'students'],
            ['name' => 'إضافة طالب', 'module' => 'students'],
            ['name' => 'تعديل طالب', 'module' => 'students'],
            ['name' => 'حذف طالب', 'module' => 'students'],
            ['name' => 'عرض درجات الطلاب', 'module' => 'students'],
            ['name' => 'إدخال الدرجات', 'module' => 'students'],

            // ── 5. وحدة التقارير والاجتماعات (reports) ──
            ['name' => 'إدارة التقارير', 'module' => 'reports'],
            ['name' => 'إدارة قوالب التقارير', 'module' => 'reports'],
            ['name' => 'إدارة الاجتماعات', 'module' => 'reports'],
            ['name' => 'عرض التقارير', 'module' => 'reports'],
            ['name' => 'إضافة تقرير', 'module' => 'reports'],
            ['name' => 'تعديل تقرير', 'module' => 'reports'],
            ['name' => 'حذف تقرير', 'module' => 'reports'],
            ['name' => 'عرض قوالب التقارير', 'module' => 'reports'],
            ['name' => 'إضافة قالب تقرير', 'module' => 'reports'],
            ['name' => 'تعديل قالب تقرير', 'module' => 'reports'],
            ['name' => 'حذف قالب تقرير', 'module' => 'reports'],
            ['name' => 'عرض الاجتماعات', 'module' => 'reports'],
            ['name' => 'إضافة اجتماع', 'module' => 'reports'],
            ['name' => 'تعديل اجتماع', 'module' => 'reports'],
            ['name' => 'حذف اجتماع', 'module' => 'reports'],
            ['name' => 'تحضير الاجتماع', 'module' => 'reports'],

            // ── 6. وحدة الإشراف التربوي (supervision) ──
            ['name' => 'إدارة الزيارات الصفية', 'module' => 'supervision'],
            ['name' => 'إدارة دفاتر التحضير', 'module' => 'supervision'],
            ['name' => 'إدارة خطط الدراسة', 'module' => 'supervision'],
            ['name' => 'إدارة دفاتر المتابعة', 'module' => 'supervision'],
            ['name' => 'عرض الزيارات الصفية', 'module' => 'supervision'],
            ['name' => 'إضافة زيارة صفية', 'module' => 'supervision'],
            ['name' => 'تعديل زيارة صفية', 'module' => 'supervision'],
            ['name' => 'حذف زيارة صفية', 'module' => 'supervision'],
            ['name' => 'اعتماد زيارة صفية', 'module' => 'supervision'],
            ['name' => 'عرض زياراتي الصفية', 'module' => 'supervision'],
            ['name' => 'عرض دفاتر التحضير', 'module' => 'supervision'],
            ['name' => 'إضافة دفتر تحضير', 'module' => 'supervision'],
            ['name' => 'تعديل دفتر تحضير', 'module' => 'supervision'],
            ['name' => 'حذف دفتر تحضير', 'module' => 'supervision'],
            ['name' => 'نشر دفتر التحضير', 'module' => 'supervision'],
            ['name' => 'إدارة تحضيري للدروس', 'module' => 'supervision'],
            ['name' => 'عرض دفاتر المتابعة', 'module' => 'supervision'],

            // ── 7. وحدة التواصل والأخبار (communications) ──
            ['name' => 'إدارة الأخبار', 'module' => 'communications'],
            ['name' => 'عرض الأخبار', 'module' => 'communications'],
            ['name' => 'إضافة خبر', 'module' => 'communications'],
            ['name' => 'تعديل خبر', 'module' => 'communications'],
            ['name' => 'حذف خبر', 'module' => 'communications'],

            // ── 8. وحدة العيادة المدرسية (clinic) ──
            ['name' => 'إدارة العيادة', 'module' => 'clinic'],
            ['name' => 'عرض الملفات الطبية', 'module' => 'clinic'],
            ['name' => 'تعديل الملفات الطبية', 'module' => 'clinic'],
            ['name' => 'تسجيل الزيارات', 'module' => 'clinic'],

            // ── 9. بوابة الطالب الإلكترونية (student_portal) ──
            ['name' => 'الدخول لبوابة الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض الجدول الأسبوعي للطالب', 'module' => 'student_portal'],
            ['name' => 'عرض حضور وغياب الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض جدول اختبارات الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض مهام وواجبات الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض مخالفات وتعهدات الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض إنجازات الطالب', 'module' => 'student_portal'],
            ['name' => 'الدخول للمكتبة الرقمية للطالب', 'module' => 'student_portal'],

            // ── 10. بوابة ولي الأمر (parent_portal) ──
            ['name' => 'الدخول لبوابة ولي الأمر', 'module' => 'parent_portal'],
            ['name' => 'عرض مركز التحكم الشامل لولي الأمر', 'module' => 'parent_portal'],
            ['name' => 'تبديل الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة الجدول الأسبوعي للأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة حضور وغياب الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة جدول اختبارات الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة مهام وواجبات الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة مخالفات وتعهدات الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة درجات ونتائج الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة سجل إنجازات الأبناء', 'module' => 'parent_portal'],

        ];
    }

    // =========================================================================
    //  SECTION 2: تعريف الأدوار وصلاحياتها
    //
    //  'all'         -> جميع الصلاحيات (مدير النظام فقط)
    //  'modules'     -> جميع صلاحيات الوحدات المحددة
    //  'permissions' -> صلاحيات محددة بالاسم
    //  يُجمع modules + permissions معاً عند الإسناد.
    // =========================================================================
    private function buildRolesConfig(): array
    {
        return [
            // مدير النظام: جميع الصلاحيات بلا استثناء
            'مدير النظام' => 'all',

            'مدير الفرع' => ['modules' => ['hr', 'academic', 'students', 'reports', 'supervision', 'communications', 'clinic'], 'permissions' => ['إدارة المستخدمين', 'عرض المستخدمين', 'إضافة مستخدم', 'تعديل مستخدم', 'حذف مستخدم', 'إدارة الفروع', 'عرض الفروع', 'إعدادات النظام']],
            'مدير فرع' => ['modules' => ['hr', 'academic', 'students', 'reports', 'supervision', 'communications', 'clinic'], 'permissions' => ['إدارة المستخدمين', 'عرض المستخدمين', 'إضافة مستخدم', 'تعديل مستخدم', 'حذف مستخدم', 'إدارة الفروع', 'عرض الفروع', 'إعدادات النظام']],
            'مشرف تربوي' => ['permissions' => ['إدارة الزيارات الصفية', 'عرض الزيارات الصفية', 'إضافة زيارة صفية', 'تعديل زيارة صفية', 'حذف زيارة صفية', 'اعتماد زيارة صفية', 'عرض زياراتي الصفية', 'إدارة دفاتر التحضير', 'عرض دفاتر التحضير', 'إدارة دفاتر المتابعة', 'عرض دفاتر المتابعة', 'إدارة خطط الدراسة', 'عرض الخطط الدراسية', 'عرض نتائج الطلاب', 'عرض درجات الطلاب', 'إدارة غياب الطلاب', 'إدارة الاجتماعات', 'عرض الاجتماعات', 'إضافة اجتماع', 'تعديل اجتماع', 'حذف اجتماع', 'تحضير الاجتماع', 'إدارة التقارير', 'عرض التقارير']],
            'معلم' => ['permissions' => ['إدارة دفاتر التحضير', 'عرض دفاتر التحضير', 'إضافة دفتر تحضير', 'تعديل دفتر تحضير', 'نشر دفتر التحضير', 'إدارة تحضيري للدروس', 'إدارة خطط الدراسة', 'عرض الخطط الدراسية', 'إدارة الدرجات', 'عرض درجات الطلاب', 'إدخال الدرجات', 'عرض نتائج الطلاب', 'إدارة غياب الطلاب', 'إدارة التقارير', 'عرض التقارير', 'إدارة الاجتماعات', 'عرض الاجتماعات', 'عرض المكتبة الرقمية', 'إضافة للمكتبة الرقمية']],
            'إداري' => ['permissions' => ['إدارة الطلاب', 'عرض الطلاب', 'إضافة طالب', 'تعديل طالب', 'إدارة التسجيلات', 'عرض التسجيلات', 'إضافة تسجيل', 'تعديل تسجيل', 'إدارة التقارير', 'عرض التقارير', 'إدارة الاجتماعات', 'عرض الاجتماعات', 'إدارة الطلبات الإدارية', 'عرض طلبات الموظفين']],
            'طالب' => ['modules' => ['student_portal'], 'permissions' => ['عرض نتائج الطلاب', 'عرض المكتبة الرقمية']],
            'ولي أمر' => ['modules' => ['parent_portal'], 'permissions' => ['عرض نتائج الطلاب', 'عرض المكتبة الرقمية']],
        ];
    }

    // =========================================================================
    //  SECTION 3: منطق التشغيل (لا تعدّل هذا القسم)
    // =========================================================================
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════════╗');
        $this->command->info('║          MasterPermissionsSeeder  v1.0                   ║');
        $this->command->info('║    السيدر الموحد لجميع الصلاحيات والأدوار              ║');
        $this->command->info('╚══════════════════════════════════════════════════════════╝');
        $this->command->info('');

        // ── الخطوة 1: إنشاء جميع الصلاحيات (firstOrCreate - آمن للتكرار) ──
        $this->command->info('[1/3] إنشاء الصلاحيات (firstOrCreate)...');
        $created = 0;
        foreach ($this->buildPermissionsMap() as $perm) {
            $p = Permission::firstOrCreate(
                ['name'   => $perm['name']],
                ['module' => $perm['module']]
            );
            if ($p->wasRecentlyCreated) {
                $this->command->line("   + [{$perm['module']}] {$perm['name']}");
                $created++;
            }
        }
        $total = Permission::count();
        $this->command->info("   -> {$created} صلاحية جديدة. الإجمالي الكلي: {$total}");
        $this->command->info('');

        // ── الخطوة 2: إنشاء الأدوار (firstOrCreate - آمن للتكرار) ──
        $this->command->info('[2/3] إنشاء الأدوار (firstOrCreate)...');
        foreach (array_keys($this->buildRolesConfig()) as $rn) {
            $r      = Role::firstOrCreate(['name' => $rn]);
            $status = $r->wasRecentlyCreated ? '[جديد] ' : '[موجود]';
            $this->command->line("   {$status} {$rn}");
        }
        $this->command->info('');

        // ── الخطوة 3: إسناد الصلاحيات للأدوار (syncWithoutDetaching - لا حذف أبداً) ──
        $this->command->info('[3/3] إسناد الصلاحيات للأدوار (syncWithoutDetaching)...');
        $this->command->info('   -> لن تُحذف أي صلاحية موجودة مسبقاً.');
        $this->command->info('');

        $allPerms = Permission::all();

        foreach ($this->buildRolesConfig() as $roleName => $config) {
            $role = Role::where('name', $roleName)->first();
            if (!$role) {
                $this->command->warn("   [!] الدور [{$roleName}] غير موجود - تخطي.");
                continue;
            }

            // مدير النظام: جميع الصلاحيات المتاحة حالياً
            if ($config === 'all') {
                $ids = $allPerms->pluck('id')->toArray();
                $role->permissions()->syncWithoutDetaching($ids);
                $cnt = count($ids);
                $this->command->line("   [OK] {$roleName}: {$cnt} صلاحية (الكل)");
                continue;
            }

            $ids = collect();

            // إضافة صلاحيات الوحدات المحددة
            if (!empty($config['modules'])) {
                $ids = $ids->merge($allPerms->whereIn('module', $config['modules'])->pluck('id'));
            }

            // إضافة صلاحيات محددة بالاسم
            if (!empty($config['permissions'])) {
                $ids = $ids->merge($allPerms->whereIn('name', $config['permissions'])->pluck('id'));
            }

            $unique = $ids->unique()->values()->toArray();
            $role->permissions()->syncWithoutDetaching($unique);
            $cnt = count($unique);
            $this->command->line("   [OK] {$roleName}: {$cnt} صلاحية");
        }

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════════╗');
        $this->command->info('║   اكتملت عملية إسناد الصلاحيات والأدوار بنجاح!       ║');
        $totalP = Permission::count();
        $totalR = Role::count();
        $this->command->info("║   إجمالي الصلاحيات : {$totalP}                                   ║");
        $this->command->info("║   إجمالي الأدوار   : {$totalR}                                   ║");
        $this->command->info('╚══════════════════════════════════════════════════════════╝');
        $this->command->info('');
    }

}
