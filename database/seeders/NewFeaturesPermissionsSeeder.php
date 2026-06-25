<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

/**
 * NewFeaturesPermissionsSeeder
 * ─────────────────────────────────────────────────────────────────────────────
 * يُنشئ ويُسند جميع الصلاحيات التفصيلية للميزات الحديثة التي أُضيفت
 * يدوياً بعد الإعداد الأوّلي للنظام:
 *
 *  1. وحدة الزيارات الصفية         (supervision)
 *  2. وحدة دفاتر التحضير           (supervision)
 *  3. وحدة مخالفات الموظفين        (hr)
 *  4. وحدة تغطية الحصص (الإنابة)   (academic)
 *  5. الإجازات والعطلات             (hr)
 *
 * الخوارزمية:
 *  أ) إنشاء الصلاحية العامة (Parent) إذا لم تكن موجودة.
 *  ب) إنشاء الصلاحيات التفصيلية (Granular) إذا لم تكن موجودة.
 *  ج) منح جميع الصلاحيات لـ "مدير النظام" و"مدير الفرع" فقط.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class NewFeaturesPermissionsSeeder extends Seeder
{
    /**
     * خريطة الصلاحيات:
     * المفتاح = اسم الصلاحية العامة (Parent Permission)
     * القيمة  = الوحدة + قائمة الصلاحيات التفصيلية المرتبطة بها
     */
    private array $permissionsMap = [

        // ── 1. الزيارات الصفية ──
        'إدارة الزيارات الصفية' => [
            'module'   => 'supervision',
            'children' => [
                'عرض الزيارات الصفية',
                'إضافة زيارة صفية',
                'تعديل زيارة صفية',
                'حذف زيارة صفية',
                'اعتماد زيارة صفية',
                'عرض زياراتي الصفية',
            ],
        ],

        // ── 2. دفاتر التحضير ──
        'إدارة دفاتر التحضير' => [
            'module'   => 'supervision',
            'children' => [
                'عرض دفاتر التحضير',
                'إضافة دفتر تحضير',
                'تعديل دفتر تحضير',
                'حذف دفتر تحضير',
                'نشر دفتر التحضير',
                'إدارة تحضيري للدروس',
            ],
        ],

        // ── 3. أنواع مخالفات الموظفين ──
        'إدارة أنواع المخالفات' => [
            'module'   => 'hr',
            'children' => [
                'عرض أنواع المخالفات',
                'إضافة نوع مخالفة',
                'تعديل نوع مخالفة',
                'حذف نوع مخالفة',
            ],
        ],

        // ── 4. سجلات مخالفات الموظفين ──
        'إدارة المخالفات' => [
            'module'   => 'hr',
            'children' => [
                'عرض المخالفات',
                'إضافة مخالفة',
                'تعديل مخالفة',
                'حذف مخالفة',
                'اعتماد مخالفة',
                'عرض مخالفاتي',
            ],
        ],

        // ── 5. تغطية الحصص / الإنابة ──
        'إدارة تغطية الحصص' => [
            'module'   => 'academic',
            'children' => [
                'عرض تغطية الحصص',
                'إضافة تغطية حصة',
                'حذف تغطية حصة',
            ],
        ],

        // ── 6. الإجازات والعطلات ──
        'إدارة الإجازات والعطلات' => [
            'module'   => 'hr',
            'children' => [
                'عرض الإجازات والعطلات',
                'إضافة إجازة أو عطلة',
                'تعديل إجازة أو عطلة',
                'حذف إجازة أو عطلة',
            ],
        ],

        // ── 7. طلبات الموظفين ──
        'إدارة طلبات الموظفين' => [
            'module'   => 'hr',
            'children' => [
                'عرض طلبات الموظفين',
                'اعتماد طلبات الموظفين',
                'رفض طلبات الموظفين',
            ],
        ],
    ];

    /**
     * الأدوار الوحيدة التي تحصل على جميع الصلاحيات تلقائياً.
     * لا يتم إسناد أي صلاحيات لأدوار أخرى — تُدار يدوياً من واجهة الصلاحيات.
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
        $this->command->info('║   NewFeaturesPermissionsSeeder                      ║');
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
        $this->command->info('║   ✅ تم الانتهاء من NewFeaturesPermissionsSeeder    ║');
        $this->command->info('║   إجمالي الصلاحيات في النظام: ' . str_pad(Permission::count(), 4) . '                 ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
