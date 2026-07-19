<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

class SystemPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // ── النظام والإدارة العامة ──
            ['name' => 'إدارة المستخدمين',      'module' => 'admin'],
            ['name' => 'إدارة الصلاحيات',       'module' => 'admin'],
            ['name' => 'إعدادات النظام',         'module' => 'admin'],
            ['name' => 'إدارة الفروع',           'module' => 'admin'],

            // ── الموارد البشرية (HR) ──
            ['name' => 'إدارة الأقسام',              'module' => 'hr'],
            ['name' => 'إدارة الموظفين',             'module' => 'hr'],
            ['name' => 'إدارة الدرجات الوظيفية',     'module' => 'hr'],
            ['name' => 'إدارة الحضور والانصراف',     'module' => 'hr'],
            ['name' => 'إدارة الشفتات',              'module' => 'hr'],
            ['name' => 'إدارة الطلبات الإدارية',     'module' => 'hr'],

            // ── الشؤون الأكاديمية ──
            ['name' => 'إدارة السنوات الدراسية',  'module' => 'academic'],
            ['name' => 'إدارة الفصول الدراسية',  'module' => 'academic'],
            ['name' => 'إدارة المراحل والصفوف',  'module' => 'academic'],
            ['name' => 'إدارة الشعب',            'module' => 'academic'],
            ['name' => 'إدارة المواد الدراسية',  'module' => 'academic'],
            ['name' => 'إدارة الجداول الدراسية', 'module' => 'academic'],
            ['name' => 'إدارة التسجيلات',         'module' => 'academic'],

            // ── الطلاب ──
            ['name' => 'إدارة الطلاب',         'module' => 'students'],
            ['name' => 'عرض نتائج الطلاب',    'module' => 'students'],
            ['name' => 'إدارة الدرجات',        'module' => 'students'],
            ['name' => 'إدارة غياب الطلاب',   'module' => 'students'],

            // ── التقارير والاجتماعات ──
            ['name' => 'إدارة التقارير',         'module' => 'reports'],
            ['name' => 'إدارة قوالب التقارير',   'module' => 'reports'],
            ['name' => 'إدارة الاجتماعات',       'module' => 'reports'],

            // ── الإشراف التربوي ──
            ['name' => 'إدارة الزيارات الصفية',  'module' => 'supervision'],
            ['name' => 'إدارة دفاتر التحضير',    'module' => 'supervision'],
            ['name' => 'إدارة خطط الدراسة',      'module' => 'supervision'],
        ];

        // Ensure we wipe old disconnected permissions if necessary or just sync them
        // To be safe, we don't delete existing to avoid breaking foreign keys, just create/update
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                ['module' => $permission['module']]
            );
        }

        // Give ALL permissions to 'مدير النظام' and 'مدير عام' roles if they exist
        $allPermissionIds = Permission::pluck('id')->toArray();
        
        $rolesToUpdate = Role::whereIn('name', ['مدير النظام', 'مدير عام'])->get();
        foreach ($rolesToUpdate as $role) {
            $role->permissions()->sync($allPermissionIds);
            $this->command->info("✅ Granted all permissions to role: {$role->name}");
        }

        $this->command->info('✅ SystemPermissionsSeeder completed successfully. Total permissions: ' . count($permissions));
        
        $this->command->info('⚙️ Now generating granular permissions...');
        $this->call(GranularPermissionsSeeder::class);
        
        $this->command->info('⚙️ Now adding new features permissions...');
        $this->call(NewFeaturesPermissionsSeeder::class);
        
        $this->command->info('⚙️ Now adding library permissions...');
        $this->call(LibraryPermissionsSeeder::class);

        $this->command->info('⚙️ Now adding news permissions...');
        $this->call(NewsPermissionsSeeder::class);

        $this->command->info('⚙️ Now adding study plan permissions...');
        $this->call(StudyPlanPermissionsSeeder::class);

        $this->command->info('⚙️ Now adding follow-up books permissions...');
        $this->call(FollowupBooksPermissionsSeeder::class);

        $this->command->info('⚙️ Now adding advanced modules permissions...');
        $this->call(AdvancedModulesPermissionsSeeder::class);
    }
}
