<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class FollowupBooksPermissionsSeeder extends Seeder
{
    private array $permissionsMap = [
        'إدارة دفاتر المتابعة' => [
            'module'   => 'supervision',
            'children' => [
                'عرض دفاتر المتابعة',
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
        $this->command->info('║   FollowupBooksPermissionsSeeder                    ║');
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
        $this->command->info('║   ✅ تم الانتهاء من FollowupBooksPermissionsSeeder    ║');
        $this->command->info('║   إجمالي الصلاحيات في النظام: ' . str_pad(Permission::count(), 4) . '                 ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
