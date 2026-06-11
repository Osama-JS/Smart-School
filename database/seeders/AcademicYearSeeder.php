<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\AcademicYear;
use App\Models\Semester;

class AcademicYearSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();

        foreach ($branches as $branch) {
            // إنشاء سنة دراسية سابقة (2024/2025)
            $lastYear = AcademicYear::firstOrCreate(
                ['branch_id' => $branch->id, 'name' => '2024/2025'],
                [
                    'start_date' => '2024-09-01',
                    'end_date'   => '2025-06-15',
                    'is_active'  => false,
                ]
            );

            Semester::firstOrCreate(
                ['academic_year_id' => $lastYear->id, 'term_number' => 1],
                ['name' => 'الفصل الأول', 'start_date' => '2024-09-01', 'end_date' => '2025-01-15', 'is_active' => false]
            );
            Semester::firstOrCreate(
                ['academic_year_id' => $lastYear->id, 'term_number' => 2],
                ['name' => 'الفصل الثاني', 'start_date' => '2025-01-25', 'end_date' => '2025-06-15', 'is_active' => false]
            );

            // إنشاء السنة الدراسية الحالية (2025/2026) - نشطة
            $currentYear = AcademicYear::firstOrCreate(
                ['branch_id' => $branch->id, 'name' => '2025/2026'],
                [
                    'start_date' => '2025-09-01',
                    'end_date'   => '2026-06-15',
                    'is_active'  => true,
                ]
            );

            // الفصل الأول - نشط حالياً
            $sem1 = Semester::firstOrCreate(
                ['academic_year_id' => $currentYear->id, 'term_number' => 1],
                ['name' => 'الفصل الأول', 'start_date' => '2025-09-01', 'end_date' => '2026-01-20', 'is_active' => true]
            );

            // الفصل الثاني - لم يبدأ بعد
            Semester::firstOrCreate(
                ['academic_year_id' => $currentYear->id, 'term_number' => 2],
                ['name' => 'الفصل الثاني', 'start_date' => '2026-02-01', 'end_date' => '2026-06-15', 'is_active' => false]
            );
        }

        $this->command->info('✅ Academic Years seeded: ' . AcademicYear::count() . ' years, ' . Semester::count() . ' semesters.');
    }
}
