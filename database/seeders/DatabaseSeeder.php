<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. إنشاء فروع افتراضية
        $branch = Branch::create(['name' => 'الفرع الرئيسي']);
        $branch2 = Branch::create(['name' => 'فرع جدة']);

        // 2. إنشاء الأدوار الأساسية
        $adminRole = Role::create(['name' => 'مدير النظام']);
        $managerRole = Role::create(['name' => 'مدير فرع']);
        $teacherRole = Role::create(['name' => 'معلم']);
        $studentRole = Role::create(['name' => 'طالب']);
        $parentRole = Role::create(['name' => 'ولي أمر']);

        // 3. إنشاء الصلاحيات الأساسية
        $permissions = [
            ['name' => 'إدارة المستخدمين', 'module' => 'admin'],
            ['name' => 'إدارة الصلاحيات', 'module' => 'admin'],
            ['name' => 'إعدادات النظام', 'module' => 'admin'],
            
            ['name' => 'إدارة الأقسام', 'module' => 'hr'],
            ['name' => 'إدارة الموظفين', 'module' => 'hr'],
            ['name' => 'إدارة الدرجات الوظيفية', 'module' => 'hr'],
            ['name' => 'إدارة الحضور والانصراف', 'module' => 'hr'],
            
            ['name' => 'إدارة الطلاب', 'module' => 'academic'],
            ['name' => 'إدارة الدرجات', 'module' => 'academic'],
            ['name' => 'إدارة الجداول', 'module' => 'academic'],
        ];

        foreach ($permissions as $p) {
            Permission::create($p);
        }

        // إعطاء مدير النظام جميع الصلاحيات
        $adminRole->permissions()->sync(Permission::all());

        // إعطاء مدير الفرع الصلاحيات المرتبطة بالعمليات والإدارة والأكاديميا + إدارة المستخدمين
        $managerPermissions = Permission::where('module', '!=', 'admin')
            ->orWhere('name', 'إدارة المستخدمين')
            ->pluck('id');
        $managerRole->permissions()->sync($managerPermissions);

        // 4. إنشاء مستخدم مدير للنظام
        User::create([
            'branch_id' => $branch->id,
            'role_id' => $adminRole->id,
            'name' => 'مدير النظام',
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'is_active' => true,
        ]);

        // إنشاء مستخدمين وهميين يحملون دور "مدير فرع"
        User::create([
            'branch_id' => $branch->id,
            'role_id' => $managerRole->id,
            'name' => 'عبدالله العتيبي (مدير الفرع الرئيسي)',
            'username' => 'manager.main',
            'password' => Hash::make('manager123'),
            'is_active' => true,
        ]);

        User::create([
            'branch_id' => $branch2->id,
            'role_id' => $managerRole->id,
            'name' => 'فيصل الزهراني (مدير فرع جدة)',
            'username' => 'manager.jeddah',
            'password' => Hash::make('manager123'),
            'is_active' => true,
        ]);

        // 5. استدعاء بيانات النظام الإداري (HR)
        $this->call(HRSeeder::class);
    }
}
