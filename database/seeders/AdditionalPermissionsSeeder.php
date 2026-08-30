<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

/**
 * AdditionalPermissionsSeeder
 * ─────────────────────────────────────────────────────────────────────────────
 * يُنشئ ويُسند الصلاحيات الخاصة بالميزات والتقارير الجديدة التي تمت برمجتها:
 *
 *  1. وحدة العيادة المدرسية        (clinic)
 *  2. وحدة التوجيه والإرشاد        (guidance)
 *  3. وحدة التقارير الشاملة        (reports)
 *
 * الخوارزمية:
 *  أ) إنشاء الصلاحية العامة (Parent) إذا لم تكن موجودة.
 *  ب) إنشاء الصلاحيات التفصيلية (Granular) إذا لم تكن موجودة.
 *  ج) منح جميع الصلاحيات لـ "مدير النظام" و"مدير الفرع" فقط.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class AdditionalPermissionsSeeder extends Seeder
{
    private array $permissionsMap = [

        // ── 1. العيادة المدرسية ──
        'إدارة العيادة' => [
            'module'   => 'clinic',
            'children' => [
                'عرض السجلات الطبية',
                'إضافة زيارة طبية',
                'تعديل زيارة طبية',
                'حذف زيارة طبية',
                'تحديث الملف الطبي للطالب',
                'عرض التقارير الطبية',
            ],
        ],

        // ── 2. التوجيه والإرشاد ──
        'إدارة التوجيه والإرشاد' => [
            'module'   => 'guidance',
            'children' => [
                'عرض استدعاءات أولياء الأمور',
                'إضافة استدعاء ولي أمر',
                'تعديل استدعاء ولي أمر',
                'حذف استدعاء ولي أمر',
                'عرض زيارات أولياء الأمور',
                'عرض تقارير التوجيه والإرشاد',
            ],
        ],

        // ── 3. التقارير الشاملة ──
        'إدارة التقارير' => [
            'module'   => 'reports',
            'children' => [
                'عرض مركز التقارير',
                'عرض تقارير الحضور والغياب',
                'عرض تقارير الموظفين',
                'عرض تقارير شؤون الطلاب',
                'طباعة التقارير',
                'تصدير التقارير',
            ],
        ],

        // ── 4. تقييمات الأداء (الموارد البشرية) ──
        'إدارة التقييمات' => [
            'module'   => 'hr',
            'children' => [
                'عرض تقييمات الأداء',
                'إضافة دورة تقييم',
                'إعداد نماذج التقييم',
                'اعتماد تقييمات الموظفين',
                'عرض تقارير التقييم',
            ],
        ],

        // ── 5. نتائج الاختبارات ──
        'إدارة نتائج الاختبارات' => [
            'module'   => 'academic',
            'children' => [
                'عرض نتائج الطلاب',
                'إدخال درجات الطلاب',
                'اعتماد النتائج',
                'طباعة كشوف العلامات والشهادات',
            ],
        ],
    ];

    private array $fullAccessRoles = [
        'مدير النظام',
        'مدير الفرع',
    ];

    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════╗');
        $this->command->info('║   AdditionalPermissionsSeeder                        ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');

        // ── الخطوة 1: إنشاء الصلاحيات العامة ──
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
        $this->command->info("   > إجمالي الصلاحيات العامة الجديدة: {$createdParents}");
        $this->command->info('');

        // ── الخطوة 2: إنشاء الصلاحيات التفصيلية ──
        $this->command->info('🔧 [2/3] إنشاء الصلاحيات التفصيلية (Child Permissions)...');
        $createdChildren = 0;

        foreach ($this->permissionsMap as $parentName => $config) {
            foreach ($config['children'] as $childName) {
                $child = Permission::firstOrCreate(
                    ['name' => $childName],
                    ['module' => $config['module']]
                );
                
                if ($child->wasRecentlyCreated) {
                    $this->command->line("   ✅ تم إنشاء: {$childName} (تابع لـ: {$parentName})");
                    $createdChildren++;
                }
            }
        }
        $this->command->info("   > إجمالي الصلاحيات التفصيلية الجديدة: {$createdChildren}");
        $this->command->info('');

        // ── الخطوة 3: إسناد جميع الصلاحيات لمدراء النظام ──
        $this->command->info('🔐 [3/3] إسناد الصلاحيات لأدوار الإدارة العليا...');
        $allNewPermissionsNames = collect($this->permissionsMap)
            ->flatMap(function ($config, $parentName) {
                return array_merge([$parentName], $config['children']);
            })->unique()->toArray();

        // استخراج معرّفات الصلاحيات من قاعدة البيانات
        $permissionIds = Permission::whereIn('name', $allNewPermissionsNames)->pluck('id');

        foreach ($this->fullAccessRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                // نستخدم syncWithoutDetaching حتى لا نحذف الصلاحيات القديمة
                $role->permissions()->syncWithoutDetaching($permissionIds);
                $this->command->line("   ✅ تم إسناد الصلاحيات إلى دور: {$roleName}");
            } else {
                $this->command->warn("   ⚠️ الدور غير موجود، تم التخطي: {$roleName}");
            }
        }
        $this->command->info('');

        $this->command->info('🎉 تم الانتهاء من إعداد صلاحيات الإضافات الجديدة بنجاح!');
        $this->command->info('────────────────────────────────────────────────────────');
    }
}
