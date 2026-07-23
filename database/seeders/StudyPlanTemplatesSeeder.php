<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StudyPlanTemplate;
use Illuminate\Support\Str;

class StudyPlanTemplatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $columns = [
            [
                'id' => (string) Str::uuid(),
                'label' => 'رقم الأسبوع',
                'width' => '100px',
                'type' => 'text',
            ],
            [
                'id' => (string) Str::uuid(),
                'label' => 'الفترة الزمنية (التاريخ)',
                'width' => '150px',
                'type' => 'text',
            ],
            [
                'id' => (string) Str::uuid(),
                'label' => 'عنوان الوحدة / الفصل',
                'width' => '200px',
                'type' => 'text',
            ],
            [
                'id' => (string) Str::uuid(),
                'label' => 'موضوع الدرس',
                'width' => '250px',
                'type' => 'textarea',
            ],
            [
                'id' => (string) Str::uuid(),
                'label' => 'عدد الحصص المقررة',
                'width' => '120px',
                'type' => 'text',
            ],
        ];

        StudyPlanTemplate::create([
            'name' => 'قالب الخطة الدراسية الأساسي',
            'columns' => $columns,
            'is_active' => true,
            'month' => 'سبتمبر', // شهر افتراضي كمثال
        ]);
    }
}
