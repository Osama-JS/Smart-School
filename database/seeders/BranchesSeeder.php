<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;

class BranchesSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'name'    => 'الفرع الرئيسي',
                'address' => 'الرياض - حي العليا - شارع العروبة',
                'phone'   => '0112345678',
            ],
            [
                'name'    => 'فرع جدة',
                'address' => 'جدة - حي الروضة - طريق الكورنيش',
                'phone'   => '0126789012',
            ],
        ];

        foreach ($branches as $branch) {
            Branch::firstOrCreate(['name' => $branch['name']], $branch);
        }

        $this->command->info('✅ Branches seeded: ' . Branch::count() . ' branches.');
    }
}
