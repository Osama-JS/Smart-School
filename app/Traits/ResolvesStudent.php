<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait ResolvesStudent
{
    /**
     * Resolves the student for the current user.
     * If the user is a student, returns the student record.
     * If the user is a parent, returns the requested child (or the first child by default),
     * and also returns the list of all children so the frontend can render a child selector.
     * 
     * @return array [Student|null $student, Collection|null $children]
     */
    protected function resolveStudent(Request $request)
    {
        $user = auth()->user();
        
        if ($user->role->name === 'طالب' && $user->student) {
            return [$user->student, null];
        }
        
        if ($user->role->name === 'ولي أمر') {
            $children = $user->children()->with('user')->get();
            if ($children->isEmpty()) {
                return [null, collect([])];
            }
            
            $childId = $request->query('child_id');
            $student = $childId ? $children->firstWhere('id', $childId) : $children->first();
            
            if (!$student) {
                $student = $children->first();
            }
            
            return [$student, $children];
        }
        
        abort(403);
    }

    /**
     * Build shared attendance, homework, grades, and pledge metrics for Student/Parent portals.
     */
    protected function buildStudentPortalMetrics(\App\Models\Student $student, ?\App\Models\Enrollment $currentEnrollment, bool $isParent = false): array
    {
        $logQuery = \App\Models\AttendanceLog::where('user_id', $student->user_id);
        $logTotal = (clone $logQuery)->count();
        $logPresent = (clone $logQuery)->whereIn('status', ['present', 'late', 'excused'])->count();
        $logAbsentDates = (clone $logQuery)
            ->whereIn('status', ['absent', 'unexcused'])
            ->pluck('attendance_date')
            ->map(fn($d) => \Carbon\Carbon::parse($d)->format('Y-m-d'))
            ->unique();

        $studentLookupIds = array_values(array_unique(array_filter([$student->user_id, $student->id])));
        $classAtts = \App\Models\ClassAttendance::whereIn('student_id', $studentLookupIds)->get();
        $classTotal = $classAtts->count();
        $classPresent = $classAtts->whereIn('status', ['present', 'late', 'excused'])->count();
        $classAbsentDates = $classAtts
            ->whereIn('status', ['absent', 'unexcused'])
            ->pluck('date')
            ->filter()
            ->map(fn($d) => $d->format('Y-m-d'))
            ->unique();

        $absentDays = $logAbsentDates->merge($classAbsentDates)->unique()->count();
        $attendanceRate = $logTotal > 0
            ? round(($logPresent / $logTotal) * 100, 1)
            : ($classTotal > 0 ? round(($classPresent / $classTotal) * 100, 1) : 100.0);

        $recentHomeworks = collect();
        $recentGrades = collect();

        if ($currentEnrollment) {
            $gradeId = $currentEnrollment->division?->grade_id;
            $recentHomeworks = \App\Models\LessonPreparation::with(['subject:id,name', 'teacher:id,name'])
                ->where('status', 'published')
                ->whereNotNull('homework')
                ->where('homework', '!=', '')
                ->where(function ($q) use ($currentEnrollment, $gradeId) {
                    $q->where('division_id', $currentEnrollment->division_id);
                    if ($gradeId) {
                        $q->orWhere(fn($sq) => $sq->whereNull('division_id')->where('grade_id', $gradeId));
                    }
                })
                ->latest('preparation_date')
                ->take(5)
                ->get()
                ->map(fn($prep) => [
                    'id' => $prep->id,
                    'lesson_title' => $prep->lesson_title,
                    'homework' => $prep->homework,
                    'subject_name' => $prep->subject?->name ?? 'مادة',
                    'teacher_name' => $prep->teacher?->name ?? '',
                    'preparation_date' => $prep->preparation_date?->format('Y-m-d'),
                ])
                ->values();

            if (!$currentEnrollment->is_result_blocked) {
                $recentGrades = \App\Models\SemesterResult::with('subject:id,name')
                    ->where('enrollment_id', $currentEnrollment->id)
                    ->latest('updated_at')
                    ->take(5)
                    ->get()
                    ->map(fn($res) => [
                        'id' => $res->id,
                        'subject_name' => $res->subject?->name ?? 'مادة',
                        'monthly_aggregate' => $res->monthly_aggregate,
                        'final_exam_score' => $res->final_exam_score,
                        'semester_total' => $res->semester_total,
                        'status' => $res->status,
                    ])
                    ->values();
            }
        }

        $pendingPledgesCount = \App\Models\StudentPledge::where('student_id', $student->id)
            ->where($isParent ? 'is_signed_by_parent' : 'is_signed_by_student', false)
            ->count();

        return [
            'absentDays' => $absentDays,
            'attendanceRate' => $attendanceRate,
            'recentHomeworks' => $recentHomeworks,
            'recentGrades' => $recentGrades,
            'pendingPledgesCount' => $pendingPledgesCount,
        ];
    }
}
