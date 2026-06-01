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
        // 1. إنشاء فرع افتراضي
        $branch = Branch::create(['name' => 'الفرع الرئيسي']);

        // 2. إنشاء الأدوار الأساسية
        $adminRole = Role::create(['name' => 'مدير النظام']);
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

        // 4. إنشاء مستخدم مدير للنظام
        User::create([
            'branch_id' => $branch->id,
            'role_id' => $adminRole->id,
            'name' => 'مدير النظام',
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'is_active' => true,
        ]);

        // 5. استدعاء بيانات النظام الإداري (HR)
        $this->call(HRSeeder::class);
    }
}
