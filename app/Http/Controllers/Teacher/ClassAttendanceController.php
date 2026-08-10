<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Enrollment;
use App\Models\ClassAttendance;
use App\Models\AttendanceLog;
use App\Models\MasterTimetable;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class ClassAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = Auth::id();
        $date = $request->query('date', Carbon::today()->toDateString());
        $dayName = Carbon::parse($date)->format('l');

        // Fetch the teacher's timetable for the selected date
        $timetables = MasterTimetable::with(['subject', 'division.grade', 'period'])
            ->where('teacher_id', $teacherId)
            ->where('day_of_week', $dayName)
            ->orderBy('period_id')
            ->get();

        return Inertia::render('Teacher/ClassAttendances/Index', [
            'timetables' => $timetables,
            'filters' => ['date' => $date]
        ]);
    }

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
        $teacherId = Auth::id();

        // 1. Verify Teacher owns this class today
        $dayName = Carbon::parse($date)->format('l');
        
        $ownsClass = MasterTimetable::where('teacher_id', $teacherId)
            ->where('division_id', $divisionId)
            ->where('subject_id', $subjectId)
            ->where('period_id', $periodId)
            ->where('day_of_week', $dayName)
            ->exists();

        if (!$ownsClass) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك بتحضير هذه الحصة'], 403);
        }

        // 2. Fetch students enrolled in this division
        $enrollments = Enrollment::with('student.user')
            ->where('division_id', $divisionId)
            ->get();

        // 3. Fetch Daily Gate Attendance
        $dailyAttendances = AttendanceLog::whereIn('user_id', $enrollments->pluck('student.user_id'))
            ->whereDate('attendance_date', $date)
            ->get()
            ->keyBy('user_id');

        // 4. Fetch existing class attendance
        $existingClassAttendances = ClassAttendance::where('division_id', $divisionId)
            ->where('subject_id', $subjectId)
            ->where('period_id', $periodId)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('student_id');

        $studentsList = $enrollments->map(function ($enrollment) use ($dailyAttendances, $existingClassAttendances) {
            $studentId = $enrollment->student->user_id;
            
            // Default logic based on Daily Gate Attendance
            $dailyRecord = $dailyAttendances->get($studentId);
            $defaultStatus = ($dailyRecord && $dailyRecord->status === 'absent') ? 'absent' : 'present';
            
            $classRecord = $existingClassAttendances->get($studentId);

            return [
                'student_id' => $studentId,
                'name' => $enrollment->student->user->name ?? 'غير معروف',
                'status' => $classRecord ? $classRecord->status : $defaultStatus,
                'notes' => $classRecord ? $classRecord->notes : '',
                'daily_status' => $dailyRecord ? $dailyRecord->status : 'present', // Hint for UI
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $studentsList
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'subject_id' => 'required|exists:subjects,id',
            'period_id' => 'required|exists:daily_periods,id',
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.status' => 'required|in:present,absent,late,excused',
            'attendances.*.notes' => 'nullable|string',
        ]);

        $teacherId = Auth::id();

        // Authorize
        $dayName = Carbon::parse($request->date)->format('l');
        $ownsClass = MasterTimetable::where('teacher_id', $teacherId)
            ->where('division_id', $request->division_id)
            ->where('subject_id', $request->subject_id)
            ->where('period_id', $request->period_id)
            ->where('day_of_week', $dayName)
            ->exists();

        if (!$ownsClass) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك بتحضير هذه الحصة'], 403);
        }

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
                    'status' => $attendance['status'],
                    'notes' => $attendance['notes'] ?? null,
                ]
            );
        }

        return redirect()->back()->with('success', 'تم حفظ تحضير الحصة بنجاح.');
    }
}
