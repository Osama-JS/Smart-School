<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        // ── تعريف الأدوار وصلاحياتها ──
        $rolesConfig = [
            'مدير النظام' => 'all', // جميع الصلاحيات

            'مدير عام' => [
                'modules' => ['hr', 'academic', 'students', 'reports', 'supervision'],
                'extra'   => ['إدارة المستخدمين'],
            ],

            'مدير فرع' => [
                'modules' => ['hr', 'academic', 'students', 'reports', 'supervision'],
                'extra'   => ['إدارة المستخدمين'],
            ],

            'مشرف تربوي' => [
                'permissions' => [
                    'إدارة الزيارات الصفية',
                    'إدارة دفاتر التحضير',
                    'إدارة خطط الدراسة',
                    'عرض نتائج الطلاب',
                    'إدارة غياب الطلاب',
                    'إدارة الاجتماعات',
                    'إدارة التقارير',
                ],
            ],

            'معلم' => [
                'permissions' => [
                    'إدارة دفاتر التحضير',
                    'إدارة خطط الدراسة',
                    'إدارة الدرجات',
                    'إدارة غياب الطلاب',
                    'عرض نتائج الطلاب',
                    'إدارة التقارير',
                    'إدارة الاجتماعات',
                ],
            ],

            'إداري' => [
                'permissions' => [
                    'إدارة الطلاب',
                    'إدارة التسجيلات',
                    'إدارة التقارير',
                    'إدارة الاجتماعات',
                    'إدارة الطلبات الإدارية',
                ],
            ],

            'طالب' => [
                'permissions' => [
                    'عرض نتائج الطلاب',
                ],
            ],

            'ولي أمر' => [
                'permissions' => [
                    'عرض نتائج الطلاب',
                ],
            ],
        ];

        foreach ($rolesConfig as $roleName => $config) {
            $role = Role::firstOrCreate(['name' => $roleName]);

            if ($config === 'all') {
                $role->permissions()->sync(Permission::pluck('id'));
                continue;
            }

            $permissionIds = collect();

            // إضافة صلاحيات وحدات كاملة
            if (!empty($config['modules'])) {
                $modulePerms = Permission::whereIn('module', $config['modules'])->pluck('id');
                $permissionIds = $permissionIds->merge($modulePerms);
            }

            // إضافة صلاحيات محددة من وحدات أخرى
            if (!empty($config['extra'])) {
                $extraPerms = Permission::whereIn('name', $config['extra'])->pluck('id');
                $permissionIds = $permissionIds->merge($extraPerms);
            }

            // إضافة صلاحيات بالاسم مباشرة
            if (!empty($config['permissions'])) {
                $namedPerms = Permission::whereIn('name', $config['permissions'])->pluck('id');
                $permissionIds = $permissionIds->merge($namedPerms);
            }

            $role->permissions()->sync($permissionIds->unique()->values());
        }

        $this->command->info('✅ Roles seeded: ' . Role::count() . ' roles with permissions.');
    }
}
