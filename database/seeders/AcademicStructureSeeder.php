<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Section;
use App\Models\Grade;
use App\Models\Division;
use App\Models\Subject;

class AcademicStructureSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();

        // ── المواد الدراسية (مشتركة) ──
        $subjectsData = [
            'القرآن الكريم', 'التوحيد', 'الفقه', 'الحديث',
            'اللغة العربية', 'الإملاء', 'التعبير', 'الخط',
            'الرياضيات', 'العلوم', 'الاجتماعيات', 'اللغة الإنجليزية',
            'الحاسب الآلي', 'التربية البدنية', 'التربية الفنية',
        ];

        foreach ($subjectsData as $subjectName) {
            Subject::firstOrCreate(['name' => $subjectName]);
        }

        $this->command->info('  ✅ Subjects seeded: ' . count($subjectsData));

        // ── الهيكل الأكاديمي لكل فرع ──
        $sectionsData = [
            ['name' => 'المرحلة الابتدائية', 'grades' => [
                'الصف الأول الابتدائي', 'الصف الثاني الابتدائي',
                'الصف الثالث الابتدائي', 'الصف الرابع الابتدائي',
                'الصف الخامس الابتدائي', 'الصف السادس الابتدائي',
            ]],
            ['name' => 'المرحلة المتوسطة', 'grades' => [
                'الصف الأول المتوسط', 'الصف الثاني المتوسط', 'الصف الثالث المتوسط',
            ]],
            ['name' => 'المرحلة الثانوية', 'grades' => [
                'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي',
            ]],
        ];

        $divisionNames = ['أ', 'ب', 'ج'];

        foreach ($branches as $branch) {
            // جلب السنة الدراسية الحالية لهذا الفرع
            $currentYear = AcademicYear::where('branch_id', $branch->id)->where('is_active', true)->first();

            if (!$currentYear) {
                $this->command->warn("  ⚠️ No active academic year for branch: {$branch->name}");
                continue;
            }

            foreach ($sectionsData as $sectionData) {
                $section = Section::firstOrCreate([
                    'name'      => $sectionData['name'],
                    'branch_id' => $branch->id,
                ]);

                foreach ($sectionData['grades'] as $gradeName) {
                    $grade = Grade::firstOrCreate([
                        'name'       => $gradeName,
                        'section_id' => $section->id,
                        'branch_id'  => $branch->id,
                    ]);

                    // إنشاء شعبتين لكل صف في السنة الحالية
                    foreach (array_slice($divisionNames, 0, 2) as $divName) {
                        Division::firstOrCreate([
                            'name'             => $divName,
                            'grade_id'         => $grade->id,
                            'branch_id'        => $branch->id,
                            'academic_year_id' => $currentYear->id,
                        ], [
                            'max_students' => 30,
                        ]);
                    }
                }
            }

            $this->command->info("  ✅ Academic structure seeded for branch: {$branch->name}");
        }
    }
}
