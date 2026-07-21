<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MonthlyGrade;
use App\Models\AttendanceLog;
use App\Models\ClassAttendance;
use App\Models\Enrollment;

class StudentAppController extends Controller
{
    /**
     * Get the authenticated student's monthly grades.
     */
    public function getMonthlyGrades(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        // Get active enrollment
        $enrollment = Enrollment::where('student_id', $user->student->id)
            ->where('status', 'نشط')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $grades = MonthlyGrade::with(['subject', 'period', 'semester'])
            ->where('enrollment_id', $enrollment->id)
            ->orderBy('period_id', 'desc')
            ->get();

        // Map to a cleaner format
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

        // Group by period
        $grouped = $data->groupBy('period_name');

        return response()->json([
            'status' => 'success',
            'data' => $grouped
        ]);
    }

    /**
     * Get the authenticated student's attendance records.
     */
    public function getAttendance(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        // Get daily attendance
        $daily = AttendanceLog::where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->take(30)
            ->get();

        // Get class attendance
        $classAttendances = ClassAttendance::with(['subject', 'period', 'teacher'])
            ->where('student_id', $user->student->id)
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
