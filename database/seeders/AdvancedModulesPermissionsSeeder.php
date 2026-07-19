<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

/**
 * AdvancedModulesPermissionsSeeder
 * ─────────────────────────────────────────────────────────────────────────────
 * يُنشئ ويُسند جميع الصلاحيات التفصيلية للميزات والمقترحات الجديدة التي أُضيفت:
 *
 *  1. جداول الاختبارات             (academic)
 *  2. فترات الرصد والنتائج         (academic)
 *  3. لوحة القيادة التنفيذية       (admin)
 *  4. أتمتة سير العمل              (admin)
 *  5. الأرشفة المتقدمة والوثائق    (admin)
 *  6. التقييم الشامل 360           (hr)
 *  7. الأصول والصيانة              (admin)
 *
 * الخوارزمية مطابقة لـ NewFeaturesPermissionsSeeder:
 *  أ) إنشاء الصلاحية العامة (Parent).
 *  ب) إنشاء الصلاحيات التفصيلية (Granular).
 *  ج) مزامنة ومنح جميع الصلاحيات لـ "مدير النظام" و"مدير الفرع".
 * ─────────────────────────────────────────────────────────────────────────────
 */
class AdvancedModulesPermissionsSeeder extends Seeder
{
    /**
     * خريطة الصلاحيات:
     * المفتاح = اسم الصلاحية العامة (Parent Permission)
     * القيمة  = الوحدة + قائمة الصلاحيات التفصيلية المرتبطة بها
     */
    private array $permissionsMap = [

        // ── 1. جداول الاختبارات (Exam Schedules) ──
        'إدارة جداول الاختبارات' => [
            'module'   => 'academic',
            'children' => [
                'عرض جداول الاختبارات',
                'إضافة جدول اختبارات',
                'تعديل جدول اختبارات',
                'حذف جدول اختبارات',
                'اعتماد ونشر جدول الاختبارات',
                'طباعة جداول الاختبارات',
            ],
        ],

        // ── 2. فترات الرصد والنتائج (Result Periods) ──
        'إدارة فترات الرصد' => [
            'module'   => 'academic',
            'children' => [
                'عرض فترات الرصد',
                'إضافة فترة رصد',
                'تعديل فترة رصد',
                'حذف فترة رصد',
                'إغلاق فترة الرصد',
            ],
        ],

        // ── 3. لوحة القيادة التنفيذية (Executive Dashboard) ──
        'إدارة لوحة القيادة التنفيذية' => [
            'module'   => 'admin',
            'children' => [
                'عرض لوحة القيادة التنفيذية',
                'تصدير تقارير لوحة القيادة',
            ],
        ],

        // ── 4. أتمتة سير العمل (Automated Workflows) ──
        'إدارة سير العمل المؤتمت' => [
            'module'   => 'admin',
            'children' => [
                'عرض مسارات سير العمل',
                'إنشاء مسار سير عمل',
                'تعديل مسار سير عمل',
                'إيقاف مسار سير عمل',
            ],
        ],

        // ── 5. الأرشفة المتقدمة (Archiving System) ──
        'إدارة الأرشفة المتقدمة' => [
            'module'   => 'admin',
            'children' => [
                'عرض الأرشيف',
                'إضافة مستند للأرشيف',
                'تعديل مستند أرشيفي',
                'حذف مستند أرشيفي',
                'صلاحية الوصول السري للأرشيف',
            ],
        ],

        // ── 6. التقييم الشامل 360 (360-Degree Appraisal) ──
        'إدارة التقييم الشامل' => [
            'module'   => 'hr',
            'children' => [
                'عرض نماذج التقييم',
                'إنشاء نموذج تقييم',
                'إرسال طلبات التقييم',
                'عرض نتائج التقييم الشامل',
            ],
        ],

        // ── 7. الأصول والصيانة (Assets & Maintenance) ──
        'إدارة الأصول والصيانة' => [
            'module'   => 'admin',
            'children' => [
                'عرض الأصول',
                'إضافة أصل جديد',
                'طلب صيانة',
                'اعتماد طلبات الصيانة',
                'تتبع حالة الأصول',
            ],
        ],
    ];

    /**
     * الأدوار الوحيدة التي تحصل على جميع الصلاحيات تلقائياً.
     */
    private array $fullAccessRoles = [
        'مدير النظام',
        'مدير الفرع',
    ];

    // ─────────────────────────────────────────────────────────────────────────

    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════╗');
        $this->command->info('║   AdvancedModulesPermissionsSeeder                   ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');

        // ── الخطوة 1: إنشاء الصلاحيات العامة (Parents) ──
        $this->command->info('🔧 [1/3] إنشاء الصلاحيات العامة (Parent Permissions)...');
        $createdParents = 0;

        foreach ($this->permissionsMap as $parentName => $config) {
            $perm = Permission::firstOrCreate(
                ['name'   => $parentName],
                ['module' => $config['module']]
            );
            if ($perm->wasRecentlyCreated) {
                $this->command->line("   ✅ تم إنشاء: {$parentName}");
                $createdParents++;
            } else {
                $this->command->line("   ✔  موجودة بالفعل: {$parentName}");
            }
        }

        $this->command->info("   → تم إنشاء {$createdParents} صلاحية عامة جديدة.");
        $this->command->info('');

        // ── الخطوة 2: إنشاء الصلاحيات التفصيلية (Children) ──
        $this->command->info('🔧 [2/3] إنشاء الصلاحيات التفصيلية (Granular Permissions)...');
        $createdChildren = 0;

        foreach ($this->permissionsMap as $parentName => $config) {
            foreach ($config['children'] as $childName) {
                $perm = Permission::firstOrCreate(
                    ['name'   => $childName],
                    ['module' => $config['module']]
                );
                if ($perm->wasRecentlyCreated) {
                    $this->command->line("   ✅ [{$config['module']}] {$childName}");
                    $createdChildren++;
                }
            }
        }

        $this->command->info("   → تم إنشاء {$createdChildren} صلاحية تفصيلية جديدة.");
        $this->command->info('');

        // ── الخطوة 3: منح جميع الصلاحيات لمدير النظام ومدير الفرع فقط ──
        $this->command->info('🔧 [3/3] منح جميع الصلاحيات لـ "مدير النظام" و"مدير الفرع"...');

        $allPermissionIds = Permission::pluck('id')->toArray();
        $totalPerms       = count($allPermissionIds);

        foreach ($this->fullAccessRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->permissions()->sync($allPermissionIds);
                $this->command->line("   ✅ [{$roleName}]: تم منحه جميع الصلاحيات ({$totalPerms} صلاحية).");
            } else {
                $this->command->warn("   ⚠  الدور [{$roleName}] غير موجود في قاعدة البيانات.");
            }
        }

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════╗');
        $this->command->info('║   ✅ تم الانتهاء من AdvancedModulesPermissionsSeeder ║');
        $this->command->info('║   إجمالي الصلاحيات في النظام: ' . str_pad(Permission::count(), 4) . '                 ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
