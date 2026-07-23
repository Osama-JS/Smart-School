<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

/**
 * ClinicPermissionsSeeder
 * ─────────────────────────────────────────────────────────────────────────────
 * يُنشئ ويُسند جميع الصلاحيات التفصيلية الخاصة بمديول العيادة المدرسية:
 *
 * الخوارزمية مطابقة لـ AdvancedModulesPermissionsSeeder:
 *  أ) إنشاء الصلاحية العامة (Parent).
 *  ب) إنشاء الصلاحيات التفصيلية (Granular).
 *  ج) مزامنة ومنح جميع الصلاحيات لـ "مدير النظام" و"مدير الفرع".
 * ─────────────────────────────────────────────────────────────────────────────
 */
class ClinicPermissionsSeeder extends Seeder
{
    /**
     * خريطة الصلاحيات:
     * المفتاح = اسم الصلاحية العامة (Parent Permission)
     * القيمة  = الوحدة + قائمة الصلاحيات التفصيلية المرتبطة بها
     */
    private array $permissionsMap = [

        // ── العيادة المدرسية (School Clinic) ──
        'إدارة العيادة' => [
            'module'   => 'clinic',
            'children' => [
                'عرض الملفات الطبية',
                'تعديل الملفات الطبية',
                'تسجيل الزيارات',
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
        $this->command->info('║   ClinicPermissionsSeeder                            ║');
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
                } else {
                    $this->command->line("   ✔  موجودة بالفعل: {$childName}");
                }
            }
        }

        $this->command->info("   → تم إنشاء {$createdChildren} صلاحية تفصيلية جديدة.");
        $this->command->info('');

        // ── الخطوة 3: منح الصلاحيات لمدير النظام ومدير الفرع ──
        $this->command->info('🔧 [3/3] منح الصلاحيات للأدوار الإدارية العليا...');

        // جمع كافة الصلاحيات المذكورة في هذا الـ Seeder
        $allNames = array_keys($this->permissionsMap);
        foreach ($this->permissionsMap as $config) {
            $allNames = array_merge($allNames, $config['children']);
        }
        
        $permissionIds = Permission::whereIn('name', $allNames)->pluck('id')->toArray();
        $totalPerms = count($permissionIds);

        foreach ($this->fullAccessRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->permissions()->syncWithoutDetaching($permissionIds);
                $this->command->line("   ✅ [{$roleName}]: تم منحه صلاحيات العيادة ({$totalPerms} صلاحية).");
            } else {
                $this->command->warn("   ⚠  الدور [{$roleName}] غير موجود في قاعدة البيانات.");
            }
        }

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════╗');
        $this->command->info('║   ✅ تم الانتهاء من ClinicPermissionsSeeder          ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
