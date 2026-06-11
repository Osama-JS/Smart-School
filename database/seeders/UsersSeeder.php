<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;
use App\Models\Branch;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $mainBranch   = Branch::where('name', 'الفرع الرئيسي')->first();
        $jeddahBranch = Branch::where('name', 'فرع جدة')->first();

        $adminRole   = Role::where('name', 'مدير النظام')->first();
        $managerRole = Role::where('name', 'مدير فرع')->first();

        $users = [
            [
                'branch_id' => $mainBranch->id,
                'role_id'   => $adminRole->id,
                'name'      => 'مدير النظام',
                'username'  => 'admin',
                'password'  => Hash::make('admin123'),
                'is_active' => true,
            ],
            [
                'branch_id' => $mainBranch->id,
                'role_id'   => $managerRole->id,
                'name'      => 'عبدالله العتيبي',
                'username'  => 'manager.main',
                'password'  => Hash::make('manager123'),
                'is_active' => true,
            ],
            [
                'branch_id' => $jeddahBranch->id,
                'role_id'   => $managerRole->id,
                'name'      => 'فيصل الزهراني',
                'username'  => 'manager.jeddah',
                'password'  => Hash::make('manager123'),
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(['username' => $userData['username']], $userData);
        }

        $this->command->info('✅ Core users seeded: admin + 2 branch managers.');
    }
}
