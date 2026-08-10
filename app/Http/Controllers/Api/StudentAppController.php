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
            ->where('status', 'active')
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
                'subject_name' => $grade->subject?->name ?? 'غير محدد',
                'period_name' => $grade->period?->month_name ?? 'غير محدد',
                'semester_name' => $grade->semester?->name ?? 'غير محدد',
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
            ->orderBy('attendance_date', 'desc')
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

    /**
     * Get the authenticated student's semester results.
     */
    public function getSemesterResults(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        $enrollment = Enrollment::where('student_id', $user->student->id)
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $results = \App\Models\SemesterResult::with(['subject', 'semester'])
            ->where('enrollment_id', $enrollment->id)
            ->where('status', 'locked') // Only show final results to students
            ->orderBy('semester_id', 'desc')
            ->get();

        $data = $results->map(function ($result) {
            return [
                'id' => $result->id,
                'subject_name' => $result->subject?->name ?? 'غير محدد',
                'semester_name' => $result->semester?->name ?? 'غير محدد',
                'monthly_aggregate' => $result->monthly_aggregate,
                'final_exam_score' => $result->final_exam_score,
                'semester_total' => $result->semester_total,
                'notes' => $result->notes,
                'attachment_url' => $result->attachment_path ? asset('storage/' . $result->attachment_path) : null,
            ];
        });

        $grouped = $data->groupBy('semester_name');

        return response()->json([
            'status' => 'success',
            'data' => $grouped
        ]);
    }

    /**
     * Get the authenticated student's timetable.
     */
    public function getTimetable(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        $enrollment = Enrollment::where('student_id', $user->student->id)
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        $schedules = \App\Models\MasterTimetable::with(['teacher', 'subject', 'period'])
            ->where('division_id', $enrollment->division_id)
            ->when($activeSemester, function ($q) use ($activeSemester) {
                return $q->where('semester_id', $activeSemester->id);
            })
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $schedules
        ]);
    }

    /**
     * Get the authenticated student's exam schedules.
     */
    public function getExamSchedules(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        $enrollment = Enrollment::where('student_id', $user->student->id)
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $schedules = \App\Models\ExamScheduleItem::with(['schedule.period', 'subject'])
            ->where('division_id', $enrollment->division_id)
            ->whereDate('exam_date', '>=', now()->subDays(7)) // Show recent and upcoming exams
            ->orderBy('exam_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $schedules
        ]);
    }

    /**
     * Get the authenticated student's homework/lesson plans.
     */
    public function getHomework(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        $enrollment = Enrollment::where('student_id', $user->student->id)
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $homework = \App\Models\LessonPreparation::with(['subject', 'teacher'])
            ->where('division_id', $enrollment->division_id)
            ->whereDate('preparation_date', '>=', now()->subDays(7)) // recent week
            ->orderBy('preparation_date', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $homework
        ]);
    }
}
