<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // ── وحدة الإدارة العامة ──
            ['name' => 'إدارة المستخدمين',      'module' => 'admin'],
            ['name' => 'إدارة الصلاحيات',       'module' => 'admin'],
            ['name' => 'إعدادات النظام',         'module' => 'admin'],
            ['name' => 'إدارة الفروع',           'module' => 'admin'],
            ['name' => 'إدارة المهام',           'module' => 'admin'],

            // ── وحدة الموارد البشرية ──
            ['name' => 'إدارة الأقسام',              'module' => 'hr'],
            ['name' => 'إدارة الموظفين',             'module' => 'hr'],
            ['name' => 'إدارة الدرجات الوظيفية',     'module' => 'hr'],
            ['name' => 'إدارة الحضور والانصراف',     'module' => 'hr'],
            ['name' => 'إدارة الشفتات',              'module' => 'hr'],
            ['name' => 'إدارة الطلبات الإدارية',     'module' => 'hr'],

            // ── وحدة الشؤون الأكاديمية ──
            ['name' => 'إدارة السنوات الدراسية',  'module' => 'academic'],
            ['name' => 'إدارة الفصول الدراسية',  'module' => 'academic'],
            ['name' => 'إدارة المراحل والصفوف',  'module' => 'academic'],
            ['name' => 'إدارة الشعب',            'module' => 'academic'],
            ['name' => 'إدارة المواد الدراسية',  'module' => 'academic'],
            ['name' => 'إدارة الجداول الدراسية', 'module' => 'academic'],
            ['name' => 'إدارة التسجيلات',         'module' => 'academic'],

            // ── وحدة الطلاب ──
            ['name' => 'إدارة الطلاب',         'module' => 'students'],
            ['name' => 'عرض نتائج الطلاب',    'module' => 'students'],
            ['name' => 'إدارة الدرجات',        'module' => 'students'],
            ['name' => 'إدارة غياب الطلاب',   'module' => 'students'],

            // ── وحدة التقارير والاجتماعات ──
            ['name' => 'إدارة التقارير',         'module' => 'reports'],
            ['name' => 'إدارة قوالب التقارير',   'module' => 'reports'],
            ['name' => 'إدارة الاجتماعات',       'module' => 'reports'],

            // ── وحدة الإشراف التربوي ──
            ['name' => 'إدارة الزيارات الصفية',  'module' => 'supervision'],
            ['name' => 'إدارة دفاتر التحضير',    'module' => 'supervision'],
            ['name' => 'إدارة خطط الدراسة',      'module' => 'supervision'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                ['module' => $permission['module']]
            );
        }

        $this->command->info('✅ Permissions seeded: ' . Permission::count() . ' permissions.');
        
        $this->command->info('⚙️ Now generating granular permissions...');
        $this->call(GranularPermissionsSeeder::class);
    }
}
