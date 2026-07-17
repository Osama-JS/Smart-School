<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class LibraryPermissionsSeeder extends Seeder
{
    private array $permissionsMap = [
        // ── 1. المكتبة الرقمية ومصادر التعلم ──
        'إدارة المكتبة الرقمية' => [
            'module'   => 'academic',
            'children' => [
                'عرض المكتبة الرقمية',
                'إضافة للمكتبة الرقمية',
                'حذف من المكتبة الرقمية',
            ],
        ],

        // ── 2. الكتب الورقية ──
        'إدارة الكتب الورقية' => [
            'module'   => 'academic',
            'children' => [
                'عرض الكتب الورقية',
                'إضافة كتاب',
                'تعديل كتاب',
                'حذف كتاب',
            ],
        ],

        // ── 3. الاستعارات ──
        'إدارة الاستعارات' => [
            'module'   => 'academic',
            'children' => [
                'عرض الاستعارات',
                'إضافة استعارة',
                'إرجاع استعارة',
                'حذف استعارة',
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
        $this->command->info('║   LibraryPermissionsSeeder                           ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');

        // ── الخطوة 1: إنشاء الصلاحيات العامة (Parents) ──
        $this->command->info('🔧 [1/3] إنشاء الصلاحيات العامة (Parent Permissions)...');
        $createdParents = 0;
        $permissionIdsToAssign = [];

        foreach ($this->permissionsMap as $parentName => $config) {
            $perm = Permission::firstOrCreate(
                ['name'   => $parentName],
                ['module' => $config['module']]
            );
            $permissionIdsToAssign[] = $perm->id;

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
                $permissionIdsToAssign[] = $perm->id;

                if ($perm->wasRecentlyCreated) {
                    $this->command->line("   ✅ [{$config['module']}] {$childName}");
                    $createdChildren++;
                }
            }
        }

        $this->command->info("   → تم إنشاء {$createdChildren} صلاحية تفصيلية جديدة.");
        $this->command->info('');

        // ── الخطوة 3: منح جميع الصلاحيات للأدوار المحددة ──
        $this->command->info('🔧 [3/3] منح جميع الصلاحيات لـ "مدير النظام" و"مدير الفرع"...');

        foreach ($this->fullAccessRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->permissions()->syncWithoutDetaching($permissionIdsToAssign);
                $this->command->line("   ✅ [{$roleName}]: تم منحه صلاحيات المكتبة بنجاح.");
            } else {
                $this->command->warn("   ⚠  الدور [{$roleName}] غير موجود في قاعدة البيانات.");
            }
        }

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════╗');
        $this->command->info('║   ✅ تم الانتهاء من LibraryPermissionsSeeder         ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
