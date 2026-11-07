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
use Illuminate\Support\Carbon;
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

        $grouped = $this->formatMonthlyGradesData($grades);

        return response()->json([
            'status' => 'success',
            'data' => (object)$grouped
        ]);
    }

    private function formatMonthlyGradesData($grades): array
    {
        $labelMap = [
            'oral_total'     => 'الشفهي والأنشطة',
            'homework_total' => 'الواجبات المنزلية',
            'behavior'       => 'المواظبة والسلوك',
            'monthly_exam'   => 'اختبار الشهر',
            'oral'           => 'الشفهي',
            'homework'       => 'الواجبات',
            'exam'           => 'الاختبار التحريري',
            'activities'     => 'الأنشطة الصفية',
            'attendance'     => 'الحضور والغياب',
        ];

        $data = $grades->map(function ($grade) use ($labelMap) {
            $rawScores = is_array($grade->scores) ? $grade->scores : [];
            $weeklyScores = is_array($grade->weekly_scores) ? $grade->weekly_scores : [];

            // If final monthly scores haven't been submitted yet, aggregate weekly_scores automatically
            if (!empty($weeklyScores)) {
                if (!isset($rawScores['oral_total']) && !isset($rawScores['oral'])) {
                    $rawScores['oral_total'] = $grade->computeWeeklyOralTotal();
                }
                if (!isset($rawScores['homework_total']) && !isset($rawScores['homework'])) {
                    $rawScores['homework_total'] = $grade->computeWeeklyHomeworkTotal();
                }
            }

            $total = 0;
            $breakdown = [];

            if (isset($rawScores['grand_total']) && is_numeric($rawScores['grand_total'])) {
                $total = (float)$rawScores['grand_total'];
            }

            foreach ($rawScores as $key => $val) {
                if ($key === 'grand_total' || $key === 'total' || $key === 'note') continue;
                if (is_numeric($val)) {
                    $breakdown[$labelMap[$key] ?? $key] = (float)$val;
                    if (!isset($rawScores['grand_total'])) {
                        $total += (float)$val;
                    }
                }
            }

            $maxScore = 50.0;
            if ($total > 50 || count($breakdown) > 4) {
                $maxScore = 100.0;
            }
            $percentage = $maxScore > 0 ? round(($total / $maxScore) * 100, 1) : 0;

            $rating = 'ممتاز 🌟';
            if ($percentage < 50) $rating = 'راسب ⚠️';
            elseif ($percentage < 65) $rating = 'مقبول';
            elseif ($percentage < 75) $rating = 'جيد';
            elseif ($percentage < 85) $rating = 'جيد جداً';

            return [
                'id' => $grade->id,
                'subject_name' => $grade->subject?->name ?? 'غير محدد',
                'period_name' => $grade->period?->month_name ?? ($grade->period?->title ?? 'فترة رصد'),
                'semester_name' => $grade->semester?->name ?? 'الفصل الدراسي',
                'scores' => $breakdown,
                'total_score' => round($total, 2),
                'max_score' => $maxScore,
                'percentage' => $percentage,
                'rating' => $rating,
            ];
        });

        return $data->groupBy('period_name')->toArray();
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

        if (!$enrollment) {
            $enrollment = Enrollment::with('division')->where('student_id', $user->student->id)->latest()->first();
        }

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

        if (!$academicYear) {
            $academicYear = \App\Models\AcademicYear::latest()->first();
        }

        $daily = collect();

        if ($academicYear) {
            $requestedStart = \Carbon\Carbon::create($year, $month, 1)->startOfDay();
            $requestedEnd = \Carbon\Carbon::create($year, $month, 1)->endOfMonth();

            $boundStart = $activeSemester && $activeSemester->start_date ? \Carbon\Carbon::parse($activeSemester->start_date)->startOfDay() : ($academicYear->start_date ? \Carbon\Carbon::parse($academicYear->start_date)->startOfDay() : $requestedStart);
            
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

            if ($startDate->gt($endDate) && $requestedStart->lte(\Carbon\Carbon::today()->endOfDay())) {
                $startDate = $requestedStart;
                $endDate = min($requestedEnd, \Carbon\Carbon::today()->endOfDay());
            }
            
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
            ->where('status', 'locked')
            ->orderBy('semester_id', 'desc')
            ->get();

        $grouped = $this->formatSemesterResultsData($results);

        return response()->json([
            'status' => 'success',
            'data' => (object)$grouped
        ]);
    }

    private function formatSemesterResultsData($results): array
    {
        $data = $results->map(function ($result) {
            $monthlyAggregate = (float)($result->monthly_aggregate ?? 0);
            $finalExamScore   = (float)($result->final_exam_score ?? 0);
            $semesterTotal    = (float)($result->semester_total ?? ($monthlyAggregate + $finalExamScore));

            $maxScore = 100.0;
            $percentage = round(($semesterTotal / $maxScore) * 100, 1);

            $statusText = $semesterTotal >= 50 ? 'ناجح ✓' : 'دور ثانٍ ⚠️';
            $rating = 'ممتاز 🌟';
            if ($percentage < 50) $rating = 'راسب ⚠️';
            elseif ($percentage < 65) $rating = 'مقبول';
            elseif ($percentage < 75) $rating = 'جيد';
            elseif ($percentage < 85) $rating = 'جيد جداً';

            return [
                'id' => $result->id,
                'subject_name' => $result->subject?->name ?? 'غير محدد',
                'semester_name' => $result->semester?->name ?? 'الفصل الدراسي',
                'monthly_aggregate' => round($monthlyAggregate, 2),
                'final_exam_score' => round($finalExamScore, 2),
                'semester_total' => round($semesterTotal, 2),
                'percentage' => $percentage,
                'status_text' => $statusText,
                'rating' => $rating,
            ];
        });

        return $data->groupBy('semester_name')->toArray();
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
     * Get the authenticated student's exam schedules.
     */
    public function getExamSchedules(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        $enrollment = Enrollment::with('division')->where('student_id', $user->student->id)
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No active enrollment found'], 404);
        }

        $query = \App\Models\ExamScheduleItem::with(['schedule.period', 'subject', 'division.grade'])
            ->where('division_id', $enrollment->division_id);

        if ((clone $query)->count() === 0 && $enrollment->division?->grade_id) {
            $gradeId = $enrollment->division->grade_id;
            $query = \App\Models\ExamScheduleItem::with(['schedule.period', 'subject', 'division.grade'])
                ->whereHas('division', fn($q) => $q->where('grade_id', $gradeId));
        }

        if ($request->boolean('upcoming_only')) {
            $query->whereDate('exam_date', '>=', now()->subDays(7));
        }

        $schedules = $query->orderBy('exam_date', 'asc')
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

        $query = \App\Models\LessonPreparation::with(['subject', 'teacher'])
            ->where('division_id', $enrollment->division_id);

        if ($request->filled('date')) {
            $query->whereDate('preparation_date', $request->date);
        } elseif ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('preparation_date', [$request->start_date, $request->end_date]);
        } else {
            $query->whereDate('preparation_date', '>=', now()->subDays(30));
        }

        $homework = $query->orderBy('preparation_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $homework
        ]);
    }

    /**
     * Get the authenticated student's digital library items.
     */
    public function getLibraryItems(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        $enrollment = Enrollment::with('division')->where('student_id', $user->student->id)
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            $enrollment = Enrollment::with('division')->where('student_id', $user->student->id)->latest()->first();
        }

        $gradeId = $enrollment?->division?->grade_id;

        $query = \App\Models\LibraryItem::with(['subject', 'uploader'])
            ->where(function($q) use ($gradeId) {
                if ($gradeId) {
                    $q->where('grade_id', $gradeId)
                      ->orWhereNull('grade_id');
                } else {
                    $q->whereNull('grade_id');
                }
            })
            ->where(function($q) {
                // Target audience can be null, 'all', or 'students'
                $q->whereNull('target_audience')
                  ->orWhere('target_audience', 'all')
                  ->orWhere('target_audience', 'students');
            });

        // Search query
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by subject if requested
        if ($request->has('subject_id') && $request->input('subject_id') != 'all') {
            $query->where('subject_id', $request->input('subject_id'));
        }

        // Filter by category
        if ($request->has('category') && $request->input('category') != 'all') {
            $query->where('category', $request->input('category'));
        }

        $items = $query->orderBy('created_at', 'desc')->paginate(15);

        // We can use transform to format the pagination items cleanly
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
                'is_bookmarked' => $item->is_bookmarked_by_user,
                'average_rating' => $item->average_rating,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $items
        ]);
    }

    /**
     * Get the authenticated student's discipline records (Violations & Pledges).
     */
    public function getDiscipline(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        $studentId = $user->student->id;

        // Automatically mark discipline/violation/pledge notifications as seen/read by this student
        $unreadNotifications = \App\Models\Notification::whereIn('type', ['violation', 'pledge', 'discipline'])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereJsonContains('target_users', $user->id);
            })
            ->get();
        foreach ($unreadNotifications as $notif) {
            if ($notif->user_id === $user->id && !$notif->is_read) {
                $notif->update(['is_read' => true]);
            }
            \App\Models\UserNotificationRead::firstOrCreate(
                ['user_id' => $user->id, 'notification_id' => $notif->id],
                ['read_at' => now()]
            );
        }

        // Get Violations
        $violations = StudentViolation::with(['violationType', 'supervisor'])
            ->where('student_id', $studentId)
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
                    'attachment_url' => $violation->attachment_path ? asset('storage/' . $violation->attachment_path) : null,
                ];
            });

        // Get Pledges
        $pledges = StudentPledge::with('violation.violationType')
            ->where('student_id', $studentId)
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
                    'attachment_url' => $pledge->attachment_path ? asset('storage/' . $pledge->attachment_path) : null,
                    'student_signature_url' => $pledge->student_signature_path ? asset('storage/' . $pledge->student_signature_path) : null,
                    'parent_signature_url' => $pledge->parent_signature_path ? asset('storage/' . $pledge->parent_signature_path) : null,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'violations' => $violations,
                'pledges' => $pledges,
                'stats' => [
                    'totalViolations' => $violations->count(),
                    'pendingPledges' => $pledges->where('is_signed_by_student', false)->count(),
                    'resolvedViolations' => $violations->where('status', 'resolved')->count(),
                ],
            ]
        ]);
    }

    /**
     * Student signs a pledge.
     */
    public function signPledge(Request $request, $pledgeId)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        $pledge = StudentPledge::find($pledgeId);

        if (!$pledge) {
            return response()->json(['message' => 'التعهد غير موجود'], 404);
        }

        if ($pledge->student_id !== $user->student->id) {
            return response()->json(['message' => 'غير مصرح لك بتوقيع هذا التعهد'], 403);
        }

        if ($pledge->is_signed_by_student) {
            return response()->json(['message' => 'تم توقيع هذا التعهد مسبقاً'], 400);
        }

        $updateData = ['is_signed_by_student' => true];
        $sigInput = $request->input('signature') ?? $request->input('signature_data');
        if ($sigInput && is_string($sigInput)) {
            $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $sigInput);
            $decoded = base64_decode($base64);
            if ($decoded) {
                $fileName = 'pledges/signatures/student_' . $pledge->id . '_' . uniqid() . '.png';
                \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $decoded);
                $updateData['student_signature_path'] = $fileName;
            }
        }

        $pledge->update($updateData);

        return response()->json([
            'status' => 'success',
            'message' => 'تم توقيع التعهد بنجاح'
        ]);
    }

    /**
     * Get the authenticated student's achievements.
     */
    public function getAchievements(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['message' => 'User is not a student'], 403);
        }

        $studentId = $user->student->id;

        // Automatically mark achievement notifications as seen/read by this student
        $unreadNotifications = \App\Models\Notification::whereIn('type', ['achievement', 'gamification'])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereJsonContains('target_users', $user->id);
            })
            ->get();
        foreach ($unreadNotifications as $notif) {
            if ($notif->user_id === $user->id && !$notif->is_read) {
                $notif->update(['is_read' => true]);
            }
            \App\Models\UserNotificationRead::firstOrCreate(
                ['user_id' => $user->id, 'notification_id' => $notif->id],
                ['read_at' => now()]
            );
        }

        $achievements = StudentAchievement::with(['type', 'awardedBy'])
            ->where('student_id', $studentId)
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

        // Group achievements by category for easier UI rendering
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
}
