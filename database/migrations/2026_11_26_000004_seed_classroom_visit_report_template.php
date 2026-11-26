<?php

use App\Models\JobGrade;
use App\Models\ReportTemplate;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $grades = JobGrade::withoutGlobalScope('branch_isolation')
            ->whereIn('name', ['موجه', 'مشرف تربوي'])
            ->get();

        if ($grades->isEmpty()) {
            $fallback = JobGrade::withoutGlobalScope('branch_isolation')->first();
            if ($fallback) {
                $grades = collect([$fallback]);
            }
        }

        foreach ($grades as $grade) {
            $template = ReportTemplate::firstOrCreate(
                [
                    'branch_id' => $grade->branch_id,
                    'job_grade_id' => $grade->id,
                    'name' => 'استمارة الزيارات الصفية',
                ],
                [
                    'description' => 'استمارة الزيارات الصفية المعتمدة (18 معياراً موزعة على 4 مجالات لثلاث زيارات صفية مع التقييم الفصلي وجوانب التميز ونقاط التحسين)',
                    'period_type' => 'custom',
                ]
            );

            $template->fields()->firstOrCreate(
                ['type' => 'classroom_visit_form_matrix'],
                [
                    'name' => 'استمارة الزيارات الصفية',
                    'options' => null,
                    'is_required' => true,
                    'order' => 0,
                ]
            );
        }
    }

    public function down(): void
    {
        $templates = ReportTemplate::where('name', 'استمارة الزيارات الصفية')
            ->whereHas('fields', fn ($q) => $q->where('type', 'classroom_visit_form_matrix'))
            ->get();

        foreach ($templates as $template) {
            $template->fields()->delete();
            $template->delete();
        }
    }
};
