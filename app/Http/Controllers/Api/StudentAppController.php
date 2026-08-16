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

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        // Get active enrollment
        $enrollment = Enrollment::with('division')->where('student_id', $user->student->id)
            ->where('status', 'active')
            ->first();

        // Find the active semester and academic year
        $academicYear = null;
        $activeSemester = null;
        if ($enrollment) {
             $academicYear = \App\Models\AcademicYear::where('branch_id', $enrollment->division->branch_id ?? null)
                 ->where('is_active', true)
                 ->first();
             if ($academicYear) {
                 $activeSemester = \App\Models\Semester::where('academic_year_id', $academicYear->id)
                     ->where('is_active', true)
                     ->first();
             }
        }
        
        if (!$activeSemester && !$academicYear) {
            $activeSemester = \App\Models\Semester::where('is_active', true)->first();
            $academicYear = $activeSemester ? $activeSemester->academicYear : \App\Models\AcademicYear::where('is_active', true)->first();
        }

        $daily = collect();

        if ($academicYear) {
            $requestedStart = \Carbon\Carbon::create($year, $month, 1)->startOfDay();
            $requestedEnd = \Carbon\Carbon::create($year, $month, 1)->endOfMonth();

            $boundStart = $activeSemester && $activeSemester->start_date ? \Carbon\Carbon::parse($activeSemester->start_date)->startOfDay() : \Carbon\Carbon::parse($academicYear->start_date)->startOfDay();
            
            $boundEndObj = null;
            if ($activeSemester && $activeSemester->end_date) {
                $boundEndObj = \Carbon\Carbon::parse($activeSemester->end_date)->endOfDay();
            } elseif ($academicYear->end_date) {
                $boundEndObj = \Carbon\Carbon::parse($academicYear->end_date)->endOfDay();
            } else {
                $boundEndObj = \Carbon\Carbon::today()->endOfDay();
            }

            $startDate = max($requestedStart, $boundStart);
            $endDate = min($requestedEnd, $boundEndObj, \Carbon\Carbon::today()->endOfDay());
            
            if ($startDate->lte($endDate)) {
                $workingDays = $academicYear->working_days ?? [];
                if (empty($workingDays)) {
                    $workingDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
                }
                
                $workingDaysEnglish = array_map(function($day) {
                    if (is_numeric($day)) {
                        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        return $days[$day] ?? 'Sunday';
                    }
                    return ucfirst(strtolower($day));
                }, $workingDays);

                $holidays = \App\Models\Holiday::where('academic_year_id', $academicYear->id)->get();
                
                $actualLogs = AttendanceLog::where('user_id', $user->id)
                    ->whereBetween('attendance_date', [$startDate->toDateString(), $endDate->toDateString()])
                    ->get()
                    ->keyBy(function($log) {
                        return \Carbon\Carbon::parse($log->attendance_date)->toDateString();
                    });

                // Get class attendance for the same period
                $classAttendances = ClassAttendance::with(['subject', 'period', 'teacher'])
                    ->where('student_id', $user->id)
                    ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
                    ->get()
                    ->groupBy(function($item) {
                        return \Carbon\Carbon::parse($item->date)->toDateString();
                    });

                // Get timetable to know total classes per day
                $timetable = \App\Models\MasterTimetable::with(['subject', 'period', 'teacher'])
                    ->where('division_id', $enrollment->division_id)
                    ->when($activeSemester, function ($q) use ($activeSemester) {
                        return $q->where('semester_id', $activeSemester->id);
                    })
                    ->get()
                    ->groupBy('day_of_week');

                $arabicDays = [
                    'Sunday' => 'الأحد',
                    'Monday' => 'الإثنين',
                    'Tuesday' => 'الثلاثاء',
                    'Wednesday' => 'الأربعاء',
                    'Thursday' => 'الخميس',
                    'Friday' => 'الجمعة',
                    'Saturday' => 'السبت'
                ];

                $currentDate = $startDate->copy();
                
                while ($currentDate->lte($endDate)) {
                    $dateStr = $currentDate->toDateString();
                    $dayName = $currentDate->englishDayOfWeek;
                    $dayNameAr = $arabicDays[$dayName] ?? $dayName;

                    $isHoliday = false;
                    foreach ($holidays as $holiday) {
                        if ($holiday->start_date && $holiday->end_date) {
                            $hStart = \Carbon\Carbon::parse($holiday->start_date)->startOfDay();
                            $hEnd = \Carbon\Carbon::parse($holiday->end_date)->endOfDay();
                            if ($currentDate->between($hStart, $hEnd)) {
                                $isHoliday = true;
                                break;
                            }
                        }
                    }

                    $classesForDay = $classAttendances->get($dateStr) ?? collect();
                    $dayNameEn = $currentDate->englishDayOfWeek;
                    
                    // Get timetable classes for this day
                    $timetableClasses = $timetable->get($dayNameEn) ?? collect();
                    $totalClasses = $timetableClasses->count();

                    $attendedClasses = $classesForDay->filter(function($c) {
                        return !in_array($c->status, ['absent', 'unexcused', 'غائب']);
                    })->count();

                    $classesDetails = $timetableClasses->map(function($tt) use ($classesForDay) {
                        // Find if there is an attendance record for this period
                        $attendance = $classesForDay->firstWhere('period_id', $tt->period_id);
                        
                        return [
                            'id' => $attendance ? $attendance->id : 'tt_'.$tt->id,
                            'subject' => $tt->subject ? $tt->subject->name : 'غير محدد',
                            'period' => $tt->period ? $tt->period->period_name : 'غير محدد',
                            'teacher' => $tt->teacher ? $tt->teacher->name : 'غير محدد',
                            'status' => $attendance ? $attendance->status : 'غير مسجل',
                            'notes' => $attendance ? $attendance->notes : '',
                        ];
                    })->values();

                    $baseData = [
                        'date' => $dateStr,
                        'day_name' => $dayNameAr,
                        'total_classes' => $totalClasses,
                        'attended_classes' => $attendedClasses,
                        'classes_details' => $classesDetails,
                    ];

                    if ($actualLogs->has($dateStr)) {
                        $log = $actualLogs->get($dateStr);
                        $daily->push(array_merge($baseData, [
                            'id' => $log->id,
                            'status' => $log->status,
                        ]));
                    } else {
                        if ($isHoliday) {
                            $daily->push(array_merge($baseData, [
                                'id' => 'holiday_' . $dateStr,
                                'status' => 'holiday',
                            ]));
                        } elseif (!in_array($dayName, $workingDaysEnglish)) {
                            // It's a weekend, maybe we push it as weekend? Or ignore?
                            // User said: لا تنسى الإجازات الأسبوعيه (Don't forget weekends).
                            // Let's explicitly add weekend
                            $daily->push(array_merge($baseData, [
                                'id' => 'weekend_' . $dateStr,
                                'status' => 'weekend',
                            ]));
                        } else {
                            $daily->push(array_merge($baseData, [
                                'id' => 'missing_' . $dateStr,
                                'status' => 'absent',
                            ]));
                        }
                    }

                    $currentDate->addDay();
                }

                $daily = $daily->sortByDesc('date')->values();
            }
        } else {
            // Fallback
            $daily = AttendanceLog::where('user_id', $user->id)
                ->orderBy('attendance_date', 'desc')
                ->take(30)
                ->get()
                ->map(function ($log) {
                    $dateStr = \Carbon\Carbon::parse($log->attendance_date)->toDateString();
                    $arabicDays = [
                        'Sunday' => 'الأحد', 'Monday' => 'الإثنين', 'Tuesday' => 'الثلاثاء', 
                        'Wednesday' => 'الأربعاء', 'Thursday' => 'الخميس', 'Friday' => 'الجمعة', 'Saturday' => 'السبت'
                    ];
                    return [
                        'id' => $log->id,
                        'date' => $dateStr,
                        'day_name' => $arabicDays[\Carbon\Carbon::parse($dateStr)->englishDayOfWeek] ?? '',
                        'status' => $log->status,
                        'total_classes' => 0,
                        'attended_classes' => 0,
                        'classes_details' => [],
                    ];
                });
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'daily_attendance' => $daily,
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

        $schedules = \App\Models\MasterTimetable::with(['teacher', 'subject', 'period', 'division.grade'])
            ->where('division_id', $enrollment->division_id)
            ->when($activeSemester, function ($q) use ($activeSemester) {
                return $q->where('semester_id', $activeSemester->id);
            })
            ->get();

        $timetableGroupGrade = \DB::table('timetable_group_grades')->where('grade_id', $enrollment->division->grade_id)->first();
        $timetableGroupId = $timetableGroupGrade ? $timetableGroupGrade->timetable_group_id : null;

        $academicYear = \App\Models\AcademicYear::where('is_active', 1)->first();
        $workingDays = $academicYear ? $academicYear->working_days : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        $breaks = [];
        if ($timetableGroupId) {
            $breakPeriods = \App\Models\DailyPeriod::where('is_break', 1)
                ->where('timetable_group_id', $timetableGroupId)
                ->get();
            
            foreach ($breakPeriods as $period) {
                foreach ($workingDays as $day) {
                    $breaks[] = [
                        'id' => 'break_' . $period->id . '_' . $day,
                        'day_of_week' => $day,
                        'period' => $period,
                        'subject' => ['name' => 'استراحة'],
                        'teacher' => null,
                        'division' => null,
                        'is_break' => true
                    ];
                }
            }
        }

        $schedulesArray = $schedules->toArray();
        $schedulesArray = array_merge($schedulesArray, $breaks);

        return response()->json([
            'status' => 'success',
            'working_days' => $workingDays,
            'data' => $schedulesArray
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
