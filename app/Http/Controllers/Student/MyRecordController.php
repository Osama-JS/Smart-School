<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ClassAttendance;
use App\Models\StudentViolation;
use App\Models\StudentAchievement;

use App\Traits\ResolvesStudent;

class MyRecordController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        [$student, $children] = $this->resolveStudent($request);
        
        if (!$student) {
            return Inertia::render('Student/Records/Index', [
                'attendance' => collect(),
                'violations' => collect(),
                'achievements' => collect(),
                'stats' => [],
                'children' => $children,
                'activeChildId' => null,
            ]);
        }
        $currentEnrollment = $student->currentEnrollment()->first();
        
        $attendance = collect();
        $violations = collect();
        $achievements = collect();
        
        if ($currentEnrollment) {
            // Attendance
            $attendance = ClassAttendance::with(['subject', 'period'])
                ->where('student_id', $student->id)
                ->whereIn('status', ['absent', 'late', 'unexcused'])
                ->orderBy('date', 'desc')
                ->get();
                
            // Violations
            $violations = StudentViolation::with(['violationType', 'supervisor'])
                ->where('student_id', $student->id)
                ->orderBy('violation_date', 'desc')
                ->get();
                
            // Gamification Achievements
            $achievements = StudentAchievement::with(['type', 'awardedBy'])
                ->where('student_id', $student->id)
                ->where('status', 'approved')
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('Student/Records/Index', [
            'attendance' => $attendance,
            'violations' => $violations,
            'achievements' => $achievements,
            'stats' => [
                'totalPoints' => $achievements->sum('points'),
                'totalAbsent' => $attendance->whereIn('status', ['absent', 'unexcused'])->count(),
                'totalLate' => $attendance->where('status', 'late')->count(),
                'totalViolations' => $violations->count()
            ],
            'children' => $children,
            'activeChildId' => $student->id,
        ]);
    }
}
