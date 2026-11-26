<?php

use App\Models\JobGrade;
use App\Models\ReportTemplate;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $grade = JobGrade::withoutGlobalScope('branch_isolation')
            ->whereIn('name', ['إداري', 'أخصائي اجتماعي', 'موجه'])
            ->first();

        if (!$grade) {
            $grade = JobGrade::withoutGlobalScope('branch_isolation')->first();
        }

        $template = ReportTemplate::withoutGlobalScope('branch_isolation')->firstOrCreate(
            [
                'name' => 'تقرير مجلس انضباطي',
            ],
            [
                'branch_id' => $grade?->branch_id,
                'job_grade_id' => $grade?->id,
                'description' => 'محضر وتقرير رسمي لانعقاد المجلس الانضباطي ومناقشة الحالات وإقرار القرارات المعتمدة.',
                'period_type' => 'custom',
            ]
        );

        $fields = [
            [
                'name' => 'رقم التقرير',
                'type' => 'text',
                'options' => null,
                'is_required' => true,
                'order' => 0,
            ],
            [
                'name' => 'اليوم',
                'type' => 'select',
                'options' => ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
                'is_required' => true,
                'order' => 1,
            ],
            [
                'name' => 'التاريخ (الموافق)',
                'type' => 'date',
                'options' => null,
                'is_required' => true,
                'order' => 2,
            ],
            [
                'name' => 'موضوع انعقاد المجلس',
                'type' => 'textarea',
                'options' => null,
                'is_required' => true,
                'order' => 3,
            ],
            [
                'name' => 'القرارات (ما تم إقراره بعد المناقشة)',
                'type' => 'textarea',
                'options' => null,
                'is_required' => true,
                'order' => 4,
            ],
        ];

        foreach ($fields as $fieldData) {
            $template->fields()->updateOrCreate(
                ['name' => $fieldData['name']],
                [
                    'type' => $fieldData['type'],
                    'options' => $fieldData['options'],
                    'is_required' => $fieldData['is_required'],
                    'order' => $fieldData['order'],
                ]
            );
        }
    }

    public function down(): void
    {
        $templates = ReportTemplate::withoutGlobalScope('branch_isolation')
            ->where('name', 'تقرير مجلس انضباطي')
            ->get();

        foreach ($templates as $template) {
            $template->fields()->delete();
            $template->delete();
        }
    }
};
