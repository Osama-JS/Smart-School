<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Grade;
use App\Models\Division;
use App\Models\Enrollment;
use App\Models\ClassAttendance;
use App\Models\AttendanceLog;
use App\Models\DailyPeriod;
use App\Models\MasterTimetable;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class ClassAttendanceController extends Controller
{
    /**
     * Get Teacher's scheduled classes for a selected date (or today).
     */
    public function getTeacherTodaySchedule(Request $request)
    {
        $teacherId = Auth::id();
        $date = $request->query('date', Carbon::today()->toDateString());
        $dayName = Carbon::parse($date)->format('l');

        $daysAr = [
            'Saturday' => 'السبت',
            'Sunday' => 'الأحد',
            'Monday' => 'الإثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
        ];

        // Fetch the teacher's timetable for the selected date
        $timetables = MasterTimetable::with(['subject', 'division.grade', 'period'])
            ->where('teacher_id', $teacherId)
            ->where('day_of_week', $dayName)
            ->orderBy('period_id')
            ->get();

        $completedCount = 0;

        $formattedTimetables = $timetables->map(function ($tt) use ($date, &$completedCount) {
            $divisionId = $tt->division_id;
            $subjectId = $tt->subject_id;
            $periodId = $tt->period_id;

            // Total students in this division
            $totalStudents = Enrollment::where('division_id', $divisionId)->count();

            // Check existing attendance records for this period on selected date
            $existingRecords = ClassAttendance::where('division_id', $divisionId)
                ->where('subject_id', $subjectId)
                ->where('period_id', $periodId)
                ->whereDate('date', $date)
                ->get();

            $isCompleted = $existingRecords->isNotEmpty();
            if ($isCompleted) {
                $completedCount++;
            }

            $presentCount = $existingRecords->where('status', 'present')->count();
            $absentCount = $existingRecords->where('status', 'absent')->count();
            $lateCount = $existingRecords->where('status', 'late')->count();
            $excusedCount = $existingRecords->where('status', 'excused')->count();

            $periodTime = '';
            if ($tt->period) {
                $start = $tt->period->start_time ? substr($tt->period->start_time, 0, 5) : '';
                $end = $tt->period->end_time ? substr($tt->period->end_time, 0, 5) : '';
                $periodTime = ($start && $end) ? "$start - $end" : ($tt->period->period_name ?? '');
            }

            return [
                'id' => $tt->id,
                'division_id' => $divisionId,
                'division_name' => $tt->division?->name ?? 'شعبة',
                'grade_name' => $tt->division?->grade?->name ?? '',
                'subject_id' => $subjectId,
                'subject_name' => $tt->subject?->name ?? 'مادة',
                'period_id' => $periodId,
                'period_name' => $tt->period?->period_name ?? "الحصة $periodId",
                'period_time' => $periodTime,
                'day_of_week' => $tt->day_of_week,
                'room' => $tt->room ?? '',
                'is_completed' => $isCompleted,
                'total_students' => $totalStudents,
                'present_count' => $presentCount,
                'absent_count' => $absentCount,
                'late_count' => $lateCount,
                'excused_count' => $excusedCount,
            ];
        });

        return response()->json([
            'success' => true,
            'today_date' => $date,
            'today_day_name' => $daysAr[$dayName] ?? $dayName,
            'stats' => [
                'total_periods' => $timetables->count(),
                'completed' => $completedCount,
                'pending' => $timetables->count() - $completedCount,
            ],
            'data' => $formattedTimetables
        ]);
    }

    /**
     * Get students for a specific class period.
     */
    public function getStudents(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());

        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'subject_id' => 'required|exists:subjects,id',
            'period_id' => 'required|exists:daily_periods,id',
            'date' => 'nullable|date',
        ]);

        $divisionId = $request->division_id;
        $subjectId = $request->subject_id;
        $periodId = $request->period_id;
        $teacherId = Auth::id();

        // 1. Verify Teacher owns this class for the selected day
        $dayName = Carbon::parse($date)->format('l');
        $ownsClass = MasterTimetable::where('teacher_id', $teacherId)
            ->where('division_id', $divisionId)
            ->where('subject_id', $subjectId)
            ->where('period_id', $periodId)
            ->where('day_of_week', $dayName)
            ->exists();

        if (!$ownsClass) {
            $user = $request->user();
            $isAdmin = $user->role && in_array($user->role->name, ['مدير النظام', 'وكيل شؤون الطلاب', 'مشرف تربوي']);
            if (!$isAdmin) {
                return response()->json(['success' => false, 'message' => 'غير مصرح لك بتحضير هذه الحصة'], 403);
            }
        }

        // 2. Fetch students enrolled in this division
        $enrollments = Enrollment::with('student.user')
            ->where('division_id', $divisionId)
            ->get();

        // 3. Fetch Daily Gate Attendance for the selected date
        $dailyLogs = AttendanceLog::whereIn('user_id', $enrollments->pluck('student.user_id')->filter())
            ->whereDate('attendance_date', $date)
            ->get()
            ->keyBy('user_id');

        // 4. Fetch existing class period attendance for the selected date
        $existingClassAttendances = ClassAttendance::where('division_id', $divisionId)
            ->where('subject_id', $subjectId)
            ->where('period_id', $periodId)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('student_id');

        $studentsList = $enrollments->map(function ($enrollment) use ($dailyLogs, $existingClassAttendances) {
            $studentUser = $enrollment->student?->user;
            if (!$studentUser) return null;

            $userId = $studentUser->id;
            $dailyLog = $dailyLogs->get($userId);
            $classRecord = $existingClassAttendances->get($userId);

            $defaultStatus = ($dailyLog && $dailyLog->status === 'absent') ? 'absent' : 'present';

            return [
                'student_id' => $userId,
                'name' => $studentUser->name,
                'avatar' => $studentUser->avatar ? asset('storage/' . $studentUser->avatar) : null,
                'status' => $classRecord ? $classRecord->status : $defaultStatus,
                'notes' => $classRecord ? ($classRecord->notes ?? '') : '',
                'daily_gate_status' => $dailyLog ? $dailyLog->status : 'present',
                'is_gate_absent' => $dailyLog && $dailyLog->status === 'absent',
                'is_saved' => $classRecord !== null,
            ];
        })->filter()->values();

        return response()->json([
            'success' => true,
            'today_date' => $date,
            'data' => $studentsList
        ]);
    }

    /**
     * Store or update class attendance.
     */
    public function store(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());

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
        $divisionId = $request->division_id;
        $subjectId = $request->subject_id;
        $periodId = $request->period_id;

        // Authorize Teacher ownership
        $dayName = Carbon::parse($date)->format('l');
        $ownsClass = MasterTimetable::where('teacher_id', $teacherId)
            ->where('division_id', $divisionId)
            ->where('subject_id', $subjectId)
            ->where('period_id', $periodId)
            ->where('day_of_week', $dayName)
            ->exists();

        if (!$ownsClass) {
            $user = $request->user();
            $isAdmin = $user->role && in_array($user->role->name, ['مدير النظام', 'وكيل شؤون الطلاب', 'مشرف تربوي']);
            if (!$isAdmin) {
                return response()->json(['success' => false, 'message' => 'غير مصرح لك بتحضير هذه الحصة'], 403);
            }
        }

        foreach ($request->attendances as $attendance) {
            $studentId = $attendance['student_id'];
            $status = $attendance['status'];
            $notes = $attendance['notes'] ?? null;

            ClassAttendance::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'division_id' => $divisionId,
                    'subject_id' => $subjectId,
                    'period_id' => $periodId,
                    'date' => $date,
                ],
                [
                    'teacher_id' => $teacherId,
                    'recorder_id' => $teacherId,
                    'status' => $status,
                    'notes' => $notes,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ واعتماد تحضير الحصة بنجاح ✅'
        ]);
    }

    /**
     * Get Grades & Periods for generic administrative lookup if needed.
     */
    public function getFormData(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $gradesQuery = Grade::with(['divisions' => function($q) use ($branchId) {
            if ($branchId) {
                $q->where('branch_id', $branchId);
            }
        }])->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $grades = $gradesQuery->get();
        $periods = DailyPeriod::orderBy('start_time')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'grades' => $grades,
                'periods' => $periods,
            ]
        ]);
    }
}

