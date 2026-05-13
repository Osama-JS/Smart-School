<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. إنشاء فرع افتراضي
        $branch = Branch::create(['name' => 'الفرع الرئيسي']);

        // 2. إنشاء الأدوار الأساسية
        $adminRole = Role::create(['name' => 'مدير النظام']);
        $teacherRole = Role::create(['name' => 'معلم']);
        $studentRole = Role::create(['name' => 'طالب']);
        $parentRole = Role::create(['name' => 'ولي أمر']);

        // 3. إنشاء مستخدم مدير للنظام
        User::create([
            'branch_id' => $branch->id,
            'role_id' => $adminRole->id,
            'name' => 'مدير النظام',
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'is_active' => true,
        ]);

        // 4. (اختياري) إضافة بعض الأقسام والصفوف الأساسية
        $primarySection = \App\Models\Section::create(['name' => 'القسم الابتدائي']);
        $intermediateSection = \App\Models\Section::create(['name' => 'القسم المتوسط']);
        
        \App\Models\Grade::create([
            'section_id' => $intermediateSection->id,
            'name' => 'الأول المتوسط'
        ]);
    }
}
