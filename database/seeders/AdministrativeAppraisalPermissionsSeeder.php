<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

/**
 * AdministrativeAppraisalPermissionsSeeder
 * ─────────────────────────────────────────────────────────────────────────────
 * يُنشئ ويُسند جميع الصلاحيات الخاصة بنظام التقييم الإداري الجديد (Appraisals).
 *
 * الخوارزمية:
 *  أ) إنشاء الصلاحية العامة (Parent) إذا لم تكن موجودة.
 *  ب) إنشاء الصلاحيات التفصيلية (Granular) إذا لم تكن موجودة.
 *  ج) منح جميع الصلاحيات لـ "مدير النظام" و"مدير الفرع" فقط تلقائياً.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class AdministrativeAppraisalPermissionsSeeder extends Seeder
{
    /**
     * خريطة الصلاحيات:
     * المفتاح = اسم الصلاحية العامة (Parent Permission)
     * القيمة  = الوحدة + قائمة الصلاحيات التفصيلية المرتبطة بها
     */
    private array $permissionsMap = [

        // ── 1. التقييمات الإدارية ──
        'إدارة التقييمات الإدارية' => [
            'module'   => 'hr',
            'children' => [
                'عرض التقييمات الإدارية',
                'إدارة قوالب التقييم',
                'إضافة قالب تقييم',
                'تعديل قالب تقييم',
                'حذف قالب تقييم',
                'إدارة دورات التقييم',
                'إضافة دورة تقييم',
                'تعديل دورة تقييم',
                'حذف دورة تقييم',
                'توليد التقييمات',
                'اعتماد التقييم النهائي',
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
        $this->command->info('║   AdministrativeAppraisalPermissionsSeeder          ║');
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
        $this->command->info('║   ✅ تم الانتهاء من AppraisalPermissionsSeeder      ║');
        $this->command->info('║   إجمالي الصلاحيات في النظام: ' . str_pad(Permission::count(), 4) . '                 ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
