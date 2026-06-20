<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class ViolationPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'إدارة أنواع المخالفات', 'module' => 'hr'],
            ['name' => 'إدارة المخالفات', 'module' => 'hr'],
            ['name' => 'عرض مخالفاتي', 'module' => 'hr'],
        ];

        $admin = Role::where('name', 'Admin')->first();
        if (!$admin) $admin = Role::first();

        foreach ($permissions as $pData) {
            $perm = Permission::firstOrCreate(['name' => $pData['name']], $pData);
            if ($admin && !$admin->permissions->contains($perm->id)) {
                $admin->permissions()->attach($perm->id);
            }
        }
    }
}
