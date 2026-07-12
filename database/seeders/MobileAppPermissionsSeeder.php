<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MobileAppPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // ── مراجعة الحضور والانصراف (للمدراء والوكلاء) ──
            ['name' => 'مراجعة الحضور والانصراف', 'module' => 'hr'],
            
            // ── عرض الإنجازات (للموظفين) ──
            ['name' => 'عرض إنجازاتي', 'module' => 'hr'],
        ];

        foreach ($permissions as $permData) {
            $perm = \App\Models\Permission::firstOrCreate(
                ['name' => $permData['name']],
                ['module' => $permData['module']]
            );
            $this->command->info("تم التأكد من وجود الصلاحية: {$permData['name']}");
        }

        // إسناد الصلاحيات الجديدة لمدير النظام تلقائياً
        $adminRole = \App\Models\Role::where('name', 'مدير النظام')->first();
        if ($adminRole) {
            $allPermissionIds = \App\Models\Permission::pluck('id')->toArray();
            $adminRole->permissions()->sync($allPermissionIds);
            $this->command->info('تم مزامنة جميع الصلاحيات لمدير النظام بنجاح.');
        }
    }
}
