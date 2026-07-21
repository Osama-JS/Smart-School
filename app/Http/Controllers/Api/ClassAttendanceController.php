<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Enrollment;
use App\Models\ClassAttendance;
use App\Models\Student;

class ClassAttendanceController extends Controller
{
    /**
     * Get students for a specific division and their attendance status for a period.
     */
    public function getStudents(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'subject_id' => 'required|exists:subjects,id',
            'period_id' => 'required|exists:daily_periods,id',
            'date' => 'required|date',
        ]);

        $divisionId = $request->division_id;
        $subjectId = $request->subject_id;
        $periodId = $request->period_id;
        $date = $request->date;

        // Fetch students enrolled in this division
        $enrollments = Enrollment::with('student.user')
            ->where('division_id', $divisionId)
            ->get();

        // Fetch existing attendance records for this class
        $existingAttendances = ClassAttendance::where('division_id', $divisionId)
            ->where('subject_id', $subjectId)
            ->where('period_id', $periodId)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('student_id');

        $studentsList = $enrollments->map(function ($enrollment) use ($existingAttendances) {
            $studentId = $enrollment->student->user_id;
            $attendanceRecord = $existingAttendances->get($studentId);

            return [
                'student_id' => $studentId,
                'name' => $enrollment->student->user->name ?? 'Unknown',
                'status' => $attendanceRecord ? $attendanceRecord->status : 'none', // present, absent, late, excused, none
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $studentsList
        ]);
    }

    /**
     * Store or update class attendance.
     */
    public function store(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'subject_id' => 'required|exists:subjects,id',
            'period_id' => 'required|exists:daily_periods,id',
            'date' => 'required|date',
            'attendances' => 'required|array', // ['student_id' => 'status']
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.status' => 'required|in:present,absent,late,excused',
        ]);

        $teacherId = $request->user()->id;

        foreach ($request->attendances as $attendance) {
            ClassAttendance::updateOrCreate(
                [
                    'student_id' => $attendance['student_id'],
                    'division_id' => $request->division_id,
                    'subject_id' => $request->subject_id,
                    'period_id' => $request->period_id,
                    'date' => $request->date,
                ],
                [
                    'teacher_id' => $teacherId,
                    'status' => $attendance['status']
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ التحضير بنجاح'
        ]);
    }
}
