<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ResultPeriod;
use App\Models\Semester;
use App\Models\Branch;

class ResultPeriodsSeeder extends Seeder
{
    public function run()
    {
        // Find a semester and branch
        $semester = Semester::first();
        $branch = Branch::first();

        if ($semester && $branch) {
            // Create some test periods
            ResultPeriod::firstOrCreate(
                ['semester_id' => $semester->id, 'branch_id' => $branch->id, 'month_name' => 'اختبارات منتصف الفصل الأول'],
                [
                    'academic_year' => $semester->academicYear->name ?? '2026/2027',
                    'fill_start_date' => now(),
                    'fill_end_date' => now()->addDays(15)
                ]
            );

            ResultPeriod::firstOrCreate(
                ['semester_id' => $semester->id, 'branch_id' => $branch->id, 'month_name' => 'اختبارات نهاية الفصل الأول'],
                [
                    'academic_year' => $semester->academicYear->name ?? '2026/2027',
                    'fill_start_date' => now()->addMonths(2),
                    'fill_end_date' => now()->addMonths(2)->addDays(15)
                ]
            );
            
            echo "Result Periods seeded successfully.\n";
        } else {
            echo "Please ensure you have at least one Semester and one Branch in the database.\n";
        }
    }
}
