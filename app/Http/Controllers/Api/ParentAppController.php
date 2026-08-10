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
            $q->where('status', 'active')->with('division.grade');
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
            ->where('status', 'active')
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
                'subject_name' => $grade->subject?->name ?? 'غير محدد',
                'period_name' => $grade->period?->month_name ?? 'غير محدد',
                'semester_name' => $grade->semester?->name ?? 'غير محدد',
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
                ->orderBy('attendance_date', 'desc')
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

    /**
     * Get a specific child's semester results.
     */
    public function getChildSemesterResults(Request $request, $student_id)
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
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $results = \App\Models\SemesterResult::with(['subject', 'semester'])
            ->where('enrollment_id', $enrollment->id)
            ->where('status', 'locked') // Only show final results to parents
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
     * Get a specific child's timetable.
     */
    public function getChildTimetable(Request $request, $student_id)
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
     * Get a specific child's exam schedules.
     */
    public function getChildExamSchedules(Request $request, $student_id)
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
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $schedules = \App\Models\ExamScheduleItem::with(['schedule.period', 'subject'])
            ->where('division_id', $enrollment->division_id)
            ->whereDate('exam_date', '>=', now()->subDays(7))
            ->orderBy('exam_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $schedules
        ]);
    }

    /**
     * Get a specific child's homework/lesson plans.
     */
    public function getChildHomework(Request $request, $student_id)
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
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $homework = \App\Models\LessonPreparation::with(['subject', 'teacher'])
            ->where('division_id', $enrollment->division_id)
            ->whereDate('preparation_date', '>=', now()->subDays(7))
            ->orderBy('preparation_date', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $homework
        ]);
    }
}
