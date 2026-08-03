<?php

namespace App\Services;

use App\Models\StudentViolation;
use App\Models\StudentViolationType;
use App\Models\AcademicYear;
use App\Models\ParentSummon;
use App\Models\StudentPledge;
use Carbon\Carbon;

class EscalationService
{
    /**
     * Process escalation for a given violation if it repeats.
     * Returns the repetition count.
     *
     * @param StudentViolation $violation
     * @return int
     */
    public function processEscalation(StudentViolation $violation): int
    {
        $activeYearId = AcademicYear::where('is_active', true)->value('id');
        
        $repetitionCount = StudentViolation::where('student_id', $violation->student_id)
            ->where('violation_type_id', $violation->violation_type_id)
            ->where('academic_year_id', $activeYearId)
            ->count();

        // If it's the 2nd time or more, we auto-escalate
        if ($repetitionCount >= 2) {
            $type = StudentViolationType::find($violation->violation_type_id);
            
            // 1. Auto generate Parent Summon
            ParentSummon::create([
                'branch_id' => $violation->branch_id,
                'student_id' => $violation->student_id,
                'student_violation_id' => $violation->id,
                'summon_date' => Carbon::parse($violation->violation_date)->addDays(1)->format('Y-m-d'), // Next day
                'reason' => 'استدعاء آلي بسبب تكرار مخالفة: ' . $type->name,
                'status' => 'scheduled',
                'notes' => 'تم إنشاء هذا الاستدعاء آلياً بواسطة محرك التصعيد بسبب تكرار المخالفة للمرة ' . $repetitionCount
            ]);

            // 2. Auto generate Student Pledge
            StudentPledge::create([
                'branch_id' => $violation->branch_id,
                'student_id' => $violation->student_id,
                'student_violation_id' => $violation->id,
                'pledge_text' => 'أتعهد أنا الطالب بعدم تكرار مخالفة (' . $type->name . ') والالتزام بأنظمة وقوانين المدرسة.',
                'date' => Carbon::parse($violation->violation_date)->format('Y-m-d'),
                'is_signed_by_student' => false,
                'is_signed_by_parent' => false,
            ]);
        }

        return $repetitionCount;
    }
}
