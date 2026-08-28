<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MonthlyGrade;
use App\Models\AttendanceLog;
use App\Models\ClassAttendance;
use App\Models\Enrollment;
use App\Models\StudentViolation;
use App\Models\StudentPledge;
use App\Models\StudentAchievement;
use App\Models\ParentSummon;
use App\Models\ParentVisit;
use App\Models\LibraryItem;
use Illuminate\Support\Carbon;
class ParentAppController extends Controller
{
    /**
     * Get the children of the authenticated parent.
     */
    public function getChildren(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $children = $user->children()->withCount(['achievements', 'violations', 'pledges'])->with(['enrollments' => function($q) {
            $q->where('status', 'active')->with('division.grade');
        }])->get()->map(function($student) {
            $enrollment = $student->enrollments->first();
            return [
                'id' => $student->id,
                'name' => $student->user->name ?? $student->name,
                'division' => $enrollment ? $enrollment->division->name : null,
                'grade' => $enrollment ? $enrollment->division->grade->name : null,
                'relationship' => $student->pivot->relationship_type ?? 'غير محدد',
                'achievements_count' => $student->achievements_count ?? 0,
                'violations_count' => $student->violations_count ?? 0,
                'pledges_count' => $student->pledges_count ?? 0,
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
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
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
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $child = $user->children()->where('students.id', $student_id)->first();

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        $enrollment = Enrollment::with('division')->where('student_id', $student_id)
            ->where('status', 'active')
            ->first();

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

        if ($child->user_id && $activeSemester && $academicYear) {
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
                
                $actualLogs = AttendanceLog::where('user_id', $child->user_id)
                    ->whereBetween('attendance_date', [$startDate->toDateString(), $endDate->toDateString()])
                    ->get()
                    ->keyBy(function($log) {
                        return \Carbon\Carbon::parse($log->attendance_date)->toDateString();
                    });

                // Get class attendance
                $classAttendances = ClassAttendance::with(['subject', 'period', 'teacher'])
                    ->where('student_id', $student_id)
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
            if ($child->user_id) {
                $daily = AttendanceLog::where('user_id', $child->user_id)
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
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'daily_attendance' => $daily,
            ]
        ]);
    }



    /**
     * Get a specific child's semester results.
     */
    public function getChildSemesterResults(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
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
        if (!$user || $user->role->name !== 'ولي أمر') {
            return response()->json(['message' => 'User is not a parent'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $enrollment = Enrollment::with('division.grade')->where('student_id', $student_id)
            ->where('status', 'active')
            ->first();

        if (!$enrollment || !$enrollment->division) {
            return response()->json(['message' => 'No active enrollment or division found'], 404);
        }

        $activeSemester = \App\Models\Semester::where('is_active', true)
            ->orWhere(function($q) {
                $q->whereDate('start_date', '<=', now())->whereDate('end_date', '>=', now());
            })->first();

        $schedules = \App\Models\MasterTimetable::with(['teacher', 'subject', 'period', 'division.grade'])
            ->where('division_id', $enrollment->division_id)
            ->when($activeSemester, function ($q) use ($activeSemester) {
                return $q->where(function($sq) use ($activeSemester) {
                    $sq->where('semester_id', $activeSemester->id)->orWhereNull('semester_id');
                });
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
     * Get a specific child's exam schedules.
     */
    public function getChildExamSchedules(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user || $user->role->name !== 'ولي أمر') {
            return response()->json(['message' => 'User is not a parent'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
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
        if (!$user || $user->role->name !== 'ولي أمر') {
            return response()->json(['message' => 'User is not a parent'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
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

    /**
     * Get the student's medical record (Allergies, Chronic Diseases, etc.)
     */
    public function getChildMedicalRecord(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user || $user->role->name !== 'ولي أمر') {
            return response()->json(['message' => 'User is not a parent'], 403);
        }

        // 1. Security Check: Ensure the child belongs to this parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized access to child data'], 403);
        }

        $medicalRecord = \App\Models\StudentMedicalRecord::where('student_id', $student_id)->first();

        if (!$medicalRecord) {
            return response()->json([
                'status' => 'success',
                'message' => 'لا يوجد ملف طبي مسجل لهذا الطالب',
                'data' => null
            ]);
        }

        // Add BMI dynamically to the response (accessing the accessor)
        $medicalRecord->bmi = $medicalRecord->bmi;

        return response()->json([
            'status' => 'success',
            'data' => $medicalRecord
        ]);
    }

    /**
     * Get the student's clinic visits log
     */
    public function getChildClinicVisits(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user || $user->role->name !== 'ولي أمر') {
            return response()->json(['message' => 'User is not a parent'], 403);
        }

        // 1. Security Check: Ensure the child belongs to this parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized access to child data'], 403);
        }

        $visits = \App\Models\ClinicVisit::with('nurse:id,name')
            ->where('student_id', $student_id)
            ->orderBy('visited_at', 'desc')
            ->get()
            ->map(function ($visit) {
                return [
                    'id' => $visit->id,
                    'visited_at' => clone $visit->visited_at,
                    'formatted_date' => $visit->visited_at ? $visit->visited_at->format('Y-m-d g:i A') : null,
                    'symptoms' => $visit->symptoms,
                    'action_taken' => $visit->action_taken,
                    'status' => $visit->status,
                    'nurse_name' => $visit->nurse->name ?? 'غير محدد',
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $visits
        ]);
    }

    /**
     * Update the student's medical record (Allergies, Consent, etc.)
     */
    public function updateChildMedicalRecord(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // 2. Validate the incoming data
        $validated = $request->validate([
            'height' => 'nullable|numeric|min:30|max:250',
            'weight' => 'nullable|numeric|min:10|max:200',
            'blood_type' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'chronic_diseases' => 'nullable|string',
            'regular_medications' => 'nullable|string',
            'past_surgeries' => 'nullable|string',
            'consent_given' => 'boolean',
        ]);

        // 3. Update or Create the medical record
        $medicalRecord = \App\Models\StudentMedicalRecord::updateOrCreate(
            ['student_id' => $student_id],
            $validated
        );

        // Add BMI dynamically to the response (accessing the accessor)
        $medicalRecord->bmi = $medicalRecord->bmi;

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث الملف الطبي بنجاح',
            'data' => $medicalRecord
        ]);
    }

    /**
     * Get the child's discipline records (Violations & Pledges).
     */
    public function getChildDiscipline(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get Violations
        $violations = StudentViolation::with(['violationType', 'supervisor'])
            ->where('student_id', $student_id)
            ->orderBy('violation_date', 'desc')
            ->get()
            ->map(function ($violation) {
                return [
                    'id' => $violation->id,
                    'type' => $violation->violationType ? $violation->violationType->name : 'مخالفة',
                    'degree' => $violation->violationType ? $violation->violationType->degree : null,
                    'date' => Carbon::parse($violation->violation_date)->format('Y-m-d'),
                    'supervisor' => $violation->supervisor ? $violation->supervisor->name : null,
                    'details' => $violation->details,
                    'action_taken' => $violation->action_taken,
                    'status' => $violation->status,
                ];
            });

        // Get Pledges
        $pledges = StudentPledge::with('violation.violationType')
            ->where('student_id', $student_id)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($pledge) {
                return [
                    'id' => $pledge->id,
                    'violation_type' => $pledge->violation && $pledge->violation->violationType ? $pledge->violation->violationType->name : null,
                    'pledge_text' => $pledge->pledge_text,
                    'date' => Carbon::parse($pledge->date)->format('Y-m-d'),
                    'is_signed_by_student' => (bool)$pledge->is_signed_by_student,
                    'is_signed_by_parent' => (bool)$pledge->is_signed_by_parent,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'violations' => $violations,
                'pledges' => $pledges,
                'stats' => [
                    'totalViolations' => $violations->count(),
                    'pendingPledges' => $pledges->where('is_signed_by_parent', false)->count(),
                    'resolvedViolations' => $violations->where('status', 'resolved')->count(),
                ],
            ]
        ]);
    }

    /**
     * Parent signs a child's pledge.
     */
    public function signChildPledge(Request $request, $student_id, $pledgeId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pledge = StudentPledge::find($pledgeId);

        if (!$pledge) {
            return response()->json(['message' => 'التعهد غير موجود'], 404);
        }

        if ($pledge->student_id != $student_id) {
            return response()->json(['message' => 'التعهد لا يخص هذا الطالب'], 403);
        }

        if ($pledge->is_signed_by_parent) {
            return response()->json(['message' => 'تم توقيع هذا التعهد مسبقاً'], 400);
        }

        $pledge->update([
            'is_signed_by_parent' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تم توقيع التعهد بنجاح'
        ]);
    }

    /**
     * Get the child's achievements.
     */
    public function getChildAchievements(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $achievements = StudentAchievement::with(['type', 'awardedBy'])
            ->where('student_id', $student_id)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($achievement) {
                return [
                    'id' => $achievement->id,
                    'title' => $achievement->type ? $achievement->type->name : 'إنجاز',
                    'category' => $achievement->type ? $achievement->type->category : 'عام',
                    'points' => (int) $achievement->points,
                    'date' => Carbon::parse($achievement->created_at)->format('Y-m-d'),
                    'awarded_by' => $achievement->awardedBy ? $achievement->awardedBy->name : 'النظام',
                    'description' => $achievement->description,
                ];
            });

        // Group achievements by category
        $groupedAchievements = $achievements->groupBy('category');

        return response()->json([
            'status' => 'success',
            'data' => [
                'achievements' => $achievements,
                'grouped_achievements' => $groupedAchievements,
                'stats' => [
                    'totalPoints' => $achievements->sum('points'),
                    'totalCount' => $achievements->count(),
                ],
            ]
        ]);
    }

    /**
     * Get the parent summons for a specific child.
     */
    public function getChildSummons(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $summons = ParentSummon::with(['violation.violationType'])
            ->where('student_id', $student_id)
            ->orderBy('summon_date', 'desc')
            ->get()
            ->map(function ($summon) {
                return [
                    'id' => $summon->id,
                    'summon_date' => Carbon::parse($summon->summon_date)->format('Y-m-d'),
                    'reason' => $summon->reason,
                    'status' => $summon->status,
                    'notes' => $summon->notes,
                    'violation' => $summon->violation ? [
                        'id' => $summon->violation->id,
                        'name' => $summon->violation->violationType ? $summon->violation->violationType->name : 'مخالفة',
                        'date' => Carbon::parse($summon->violation->violation_date)->format('Y-m-d'),
                    ] : null,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $summons
        ]);
    }

    /**
     * Get the digital library items for a specific child's grade.
     */
    public function getChildLibraryItems(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $enrollment = Enrollment::with('division')->where('student_id', $student_id)
            ->where('status', 'active')
            ->first();

        if (!$enrollment || !$enrollment->division) {
            return response()->json(['message' => 'No active enrollment or division found'], 404);
        }

        $gradeId = $enrollment->division->grade_id;

        $query = LibraryItem::with(['subject', 'uploader'])
            ->where(function($q) use ($gradeId) {
                // Show items specifically for their grade, or items available for all grades (grade_id = null)
                $q->where('grade_id', $gradeId)
                  ->orWhereNull('grade_id');
            })
            ->where(function($q) {
                // Target audience can be null, 'all', 'students', or 'parents'
                $q->whereNull('target_audience')
                  ->orWhere('target_audience', 'all')
                  ->orWhere('target_audience', 'students')
                  ->orWhere('target_audience', 'parents');
            });

        // Filter by subject if requested
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }

        // Filter by category (e.g., video, document)
        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        $items = $query->orderBy('created_at', 'desc')->paginate(15);

        // Transform pagination items cleanly
        $items->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'category' => $item->category,
                'item_type' => $item->item_type,
                'file_url' => $item->file_url,
                'thumbnail_url' => $item->thumbnail_url,
                'subject_name' => $item->subject?->name ?? 'عام',
                'uploader_name' => $item->uploader?->name ?? 'إدارة المدرسة',
                'views_count' => $item->views_count,
                'created_at_formatted' => $item->created_at->format('Y-m-d'),
                'description' => $item->description,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $items
        ]);
    }

    /**
     * Get the parent's visits for a specific child.
     */
    public function getChildVisits(Request $request, $student_id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify child belongs to parent
        $isChild = $user->children()->where('students.id', $student_id)->exists();
        if (!$isChild) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $visits = ParentVisit::with(['employee:id,name'])
            ->where('student_id', $student_id)
            ->orderBy('visit_date', 'desc')
            ->orderBy('visit_time', 'desc')
            ->get()
            ->map(function ($visit) {
                return [
                    'id' => $visit->id,
                    'visit_date' => Carbon::parse($visit->visit_date)->format('Y-m-d'),
                    'visit_time' => Carbon::parse($visit->visit_time)->format('H:i'),
                    'visitor_name' => $visit->visitor_name,
                    'visitor_relation' => $visit->visitor_relation,
                    'purpose_category' => $visit->purpose_category,
                    'purpose' => $visit->purpose,
                    'status' => $visit->status,
                    'notes' => $visit->notes,
                    'met_with_employee' => $visit->employee ? $visit->employee->name : null,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $visits
        ]);
    }
}
