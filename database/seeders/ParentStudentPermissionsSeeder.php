<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class ParentStudentPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Student Permissions
            ['name' => 'الدخول لبوابة الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض الجدول الأسبوعي للطالب', 'module' => 'student_portal'],
            ['name' => 'عرض حضور وغياب الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض جدول اختبارات الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض مهام وواجبات الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض مخالفات وتعهدات الطالب', 'module' => 'student_portal'],
            ['name' => 'عرض إنجازات الطالب', 'module' => 'student_portal'],
            ['name' => 'الدخول للمكتبة الرقمية للطالب', 'module' => 'student_portal'],
            
            // Parent Permissions
            ['name' => 'الدخول لبوابة ولي الأمر', 'module' => 'parent_portal'],
            ['name' => 'عرض مركز التحكم الشامل لولي الأمر', 'module' => 'parent_portal'],
            ['name' => 'تبديل الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة الجدول الأسبوعي للأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة حضور وغياب الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة جدول اختبارات الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة مهام وواجبات الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة مخالفات وتعهدات الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة درجات ونتائج الأبناء', 'module' => 'parent_portal'],
            ['name' => 'متابعة سجل إنجازات الأبناء', 'module' => 'parent_portal'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], ['module' => $perm['module']]);
        }

        // إسناد الصلاحيات لدور الطالب
        $studentRole = Role::firstOrCreate(['name' => 'طالب']);
        if ($studentRole) {
            $studentPerms = Permission::where('module', 'student_portal')->pluck('id');
            $studentRole->permissions()->syncWithoutDetaching($studentPerms);
        }

        // إسناد الصلاحيات لدور ولي الأمر
        $parentRole = Role::firstOrCreate(['name' => 'ولي أمر']);
        if ($parentRole) {
            $parentPerms = Permission::where('module', 'parent_portal')->pluck('id');
            $parentRole->permissions()->syncWithoutDetaching($parentPerms);
        }
        
        // مدير النظام يحصل على كل شيء تلقائياً
        $adminRole = Role::where('name', 'مدير النظام')->first();
        if ($adminRole) {
            $allPerms = Permission::pluck('id');
            $adminRole->permissions()->sync($allPerms);
        }
    }
}
