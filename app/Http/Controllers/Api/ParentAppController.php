<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MonthlyGrade;
use App\Models\AttendanceLog;
use App\Models\ClassAttendance;
use App\Models\Enrollment;

class ParentAppController extends Controller
{
    /**
     * Get the children of the authenticated parent.
     */
    public function getChildren(Request $request)
    {
        $user = $request->user();
        if (!$user->parentRecord) {
            return response()->json(['message' => 'User is not a parent'], 403);
        }

        $children = $user->parentRecord->students()->with(['enrollments' => function($q) {
            $q->where('status', 'نشط')->with('division.grade');
        }])->get()->map(function($student) {
            $enrollment = $student->enrollments->first();
            return [
                'id' => $student->id,
                'name' => $student->user->name ?? $student->name,
                'division' => $enrollment ? $enrollment->division->name : null,
                'grade' => $enrollment ? $enrollment->division->grade->name : null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $children
        ]);
    }

    /**
     * Get a specific child's monthly grades.
     */
    public function getChildGrades(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user->parentRecord) {
            return response()->json(['message' => 'User is not a parent'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->parentRecord->students()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $enrollment = Enrollment::where('student_id', $student_id)
            ->where('status', 'نشط')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $grades = MonthlyGrade::with(['subject', 'period', 'semester'])
            ->where('enrollment_id', $enrollment->id)
            ->orderBy('period_id', 'desc')
            ->get();

        $data = $grades->map(function ($grade) {
            $total = 0;
            if (is_array($grade->scores)) {
                $total = array_sum($grade->scores);
            }
            return [
                'id' => $grade->id,
                'subject_name' => $grade->subject->name,
                'period_name' => $grade->period->month_name,
                'semester_name' => $grade->semester->name,
                'scores' => $grade->scores,
                'total_score' => $total,
            ];
        });

        $grouped = $data->groupBy('period_name');

        return response()->json([
            'status' => 'success',
            'data' => $grouped
        ]);
    }

    /**
     * Get a specific child's attendance records.
     */
    public function getChildAttendance(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user->parentRecord) {
            return response()->json(['message' => 'User is not a parent'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->parentRecord->students()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // To get daily attendance, we need the child's user_id. 
        $child = $user->parentRecord->students()->where('students.id', $student_id)->first();

        $daily = [];
        if ($child->user_id) {
            $daily = AttendanceLog::where('user_id', $child->user_id)
                ->orderBy('date', 'desc')
                ->take(30)
                ->get();
        }

        $classAttendances = ClassAttendance::with(['subject', 'period', 'teacher'])
            ->where('student_id', $student_id)
            ->orderBy('date', 'desc')
            ->take(50)
            ->get()
            ->map(function ($ca) {
                return [
                    'id' => $ca->id,
                    'date' => $ca->date,
                    'status' => $ca->status,
                    'subject' => $ca->subject->name,
                    'period' => $ca->period->name,
                    'teacher' => $ca->teacher->name,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'daily_attendance' => $daily,
                'class_attendance' => $classAttendances
            ]
        ]);
    }
}
