<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RequestType;

class RequestTypesSeeder extends Seeder
{
    public function run(): void
    {
        $requestTypes = [
            ['name' => 'إجازة اعتيادية',  'requires_approval' => true],
            ['name' => 'إجازة مرضية',     'requires_approval' => true],
            ['name' => 'إجازة طارئة',     'requires_approval' => true],
            ['name' => 'مغادرة مبكرة',    'requires_approval' => true],
            ['name' => 'تأخر عن الدوام',  'requires_approval' => true],
            ['name' => 'سلفة مالية',       'requires_approval' => true],
            ['name' => 'شهادة خبرة',       'requires_approval' => true],
            ['name' => 'شهادة راتب',       'requires_approval' => true],
            ['name' => 'تعديل بيانات',     'requires_approval' => true],
            ['name' => 'طلب نقل',          'requires_approval' => true],
        ];

        foreach ($requestTypes as $type) {
            RequestType::firstOrCreate(['name' => $type['name']], $type);
        }

        $this->command->info('✅ Request types seeded: ' . RequestType::count() . ' types.');
    }
}
