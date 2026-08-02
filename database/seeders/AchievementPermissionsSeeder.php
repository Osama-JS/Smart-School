<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class AchievementPermissionsSeeder extends Seeder
{
    private array $permissionsMap = [
        'إدارة إنجازات الموظفين' => [
            'module'   => 'hr',
            'children' => [
                'عرض الإنجازات',
                'إضافة إنجاز',
                'تعديل إنجاز',
                'حذف إنجاز',
                'عرض أنواع الإنجازات',
                'إضافة نوع إنجاز',
                'تعديل نوع إنجاز',
                'حذف نوع إنجاز',
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
        $this->command->info('║   AchievementPermissionsSeeder                       ║');
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

        $this->command->info("   > إجمالي الصلاحيات العامة المُضافة حديثاً: {$createdParents}\n");

        // ── الخطوة 2: إنشاء الصلاحيات التفصيلية (Children) ──
        $this->command->info('🔧 [2/3] إنشاء الصلاحيات التفصيلية (Granular Permissions)...');
        $createdChildren = 0;

        foreach ($this->permissionsMap as $parentName => $config) {
            foreach ($config['children'] as $childName) {
                $child = Permission::firstOrCreate(
                    ['name' => $childName],
                    ['module' => $config['module']]
                );

                if ($child->wasRecentlyCreated) {
                    $this->command->line("   ✅ تم إنشاء: {$childName} (تابع لـ {$parentName})");
                    $createdChildren++;
                }
            }
        }
        $this->command->info("   > إجمالي الصلاحيات التفصيلية المُضافة حديثاً: {$createdChildren}\n");

        // ── الخطوة 3: إسناد الصلاحيات (Assignment) ──
        $this->command->info('🔧 [3/3] إسناد الصلاحيات للمديرين...');

        $allPermissionIds = [];
        foreach ($this->permissionsMap as $parentName => $config) {
            $p = Permission::where('name', $parentName)->first();
            if ($p) $allPermissionIds[] = $p->id;

            $children = Permission::whereIn('name', $config['children'])->pluck('id')->toArray();
            $allPermissionIds = array_merge($allPermissionIds, $children);
        }
        $allPermissionIds = array_unique($allPermissionIds);

        foreach ($this->fullAccessRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->permissions()->syncWithoutDetaching($allPermissionIds);
                $this->command->line("   ✅ تم منح كافة الصلاحيات إلى دور: {$roleName}");
            } else {
                $this->command->line("   ⚠️  الدور '{$roleName}' غير موجود بقاعدة البيانات.");
            }
        }

        $this->command->info("\n🚀 تمت عملية تسجيل صلاحيات إنجازات الموظفين بنجاح!\n");
    }
}
