<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class AchievementPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // الإنجازات
            ['name' => 'عرض الإنجازات', 'module' => 'hr'],
            ['name' => 'إضافة إنجاز', 'module' => 'hr'],
            ['name' => 'تعديل إنجاز', 'module' => 'hr'],
            ['name' => 'حذف إنجاز', 'module' => 'hr'],
            
            // أنواع الإنجازات
            ['name' => 'عرض أنواع الإنجازات', 'module' => 'hr'],
            ['name' => 'إضافة نوع إنجاز', 'module' => 'hr'],
            ['name' => 'تعديل نوع إنجاز', 'module' => 'hr'],
            ['name' => 'حذف نوع إنجاز', 'module' => 'hr'],
        ];

        foreach ($permissions as $permData) {
            Permission::firstOrCreate(
                ['name' => $permData['name']],
                ['module' => $permData['module']]
            );
            $this->command->info("تم التأكد من وجود الصلاحية: {$permData['name']}");
        }
    }
}
