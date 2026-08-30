<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AttendanceLog;
use App\Models\ClassAttendance;
use App\Models\Division;
use App\Models\Grade;
use App\Models\DailyPeriod;
use App\Models\User;
use App\Models\Enrollment;
use Carbon\Carbon;

class StudentAttendanceController extends Controller
{
    /**
     * تقارير الغياب اليومي للمدرسة
     */
    public function index(Request $request)
    {
        $date = $request->filled('date') ? $request->date : today()->toDateString();
        
        $query = User::with([
            'student.currentEnrollment.division', 
            'attendanceLogs' => function($q) use ($date) {
                $q->whereDate('attendance_date', $date);
            }
        ])->whereHas('role', function($q) {
            $q->where('name', 'طالب');
        });

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('division_id')) {
            $query->whereHas('student.currentEnrollment', function($q) use ($request) {
                $q->where('division_id', $request->division_id);
            });
        }

        $users = $query->paginate(20);

        // تحويل البيانات لإرجاع شكل مشابه لما كان يتم إرجاعه مسبقاً، ولكن مع معالجة الغياب
        $mappedData = $users->through(function($user) use ($date) {
            $log = $user->attendanceLogs->first();
            $division = $user->student?->currentEnrollment?->division?->name ?? 'غير محدد';
            
            return [
                'id' => $user->id, // استخدمنا رقم الطالب هنا
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'division' => $division
                ],
                'attendance_date' => $date,
                'check_in_time' => $log ? $log->check_in_time : null,
                'check_out_time' => $log ? $log->check_out_time : null,
                'location' => $log ? $log->location : null,
                'status' => $log ? $log->status : 'غائب'
            ];
        });

        // Filter by status after mapping (or before if we used complex SQL, but mapping is fine since it's an app-level filter for "Absent")
        // To properly filter by 'absent' at DB level:
        if ($request->filled('status')) {
             if ($request->status === 'غائب') {
                 $query->whereDoesntHave('attendanceLogs', function($q) use ($date) {
                     $q->whereDate('attendance_date', $date);
                 });
                 // re-paginate since query changed
                 $users = $query->paginate(20);
                 $mappedData = $users->through(function($user) use ($date) {
                    $division = $user->student?->currentEnrollment?->division?->name ?? 'غير محدد';
                    return [
                        'id' => $user->id,
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'avatar' => $user->avatar,
                            'division' => $division
                        ],
                        'attendance_date' => $date,
                        'check_in_time' => null,
                        'check_out_time' => null,
                        'location' => null,
                        'status' => 'غائب'
                    ];
                 });
             } else {
                 $query->whereHas('attendanceLogs', function($q) use ($date, $request) {
                     $q->whereDate('attendance_date', $date)->where('status', $request->status);
                 });
                 // re-paginate
                 $users = $query->paginate(20);
                 $mappedData = $users->through(function($user) use ($date) {
                    $log = $user->attendanceLogs->first();
                    $division = $user->student?->currentEnrollment?->division?->name ?? 'غير محدد';
                    return [
                        'id' => $user->id,
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'avatar' => $user->avatar,
                            'division' => $division
                        ],
                        'attendance_date' => $date,
                        'check_in_time' => $log ? $log->check_in_time : null,
                        'check_out_time' => $log ? $log->check_out_time : null,
                        'location' => $log ? $log->location : null,
                        'status' => $log ? $log->status : 'غائب'
                    ];
                 });
             }
        }

        $divisions = Division::with('grade')->get();

        return Inertia::render('Academic/Attendances/Index', [
            'logs' => $mappedData,
            'divisions' => $divisions,
            'filters' => $request->only(['date', 'search', 'division_id', 'status']),
        ]);
    }

    /**
     * صفحة التحضير اليومي اليدوي للطلاب
     */
    public function create(Request $request)
    {
        $branchId = auth()->user()->branch_id;
        $divisions = Division::with('grade.section')->where('branch_id', $branchId)->get();
        
        $date = $request->query('date', today()->toDateString());
        $divisionId = $request->query('division_id');
        
        $studentsList = [];
        if ($divisionId) {
            $enrollments = Enrollment::with('student.user')
                ->where('division_id', $divisionId)
                ->get();
                
            $dailyAttendances = AttendanceLog::whereIn('user_id', $enrollments->pluck('student.user_id'))
                ->whereDate('attendance_date', $date)
                ->get()
                ->keyBy('user_id');
                
            $studentsList = $enrollments->map(function ($enrollment) use ($dailyAttendances) {
                $studentId = $enrollment->student->user_id;
                $dailyRecord = $dailyAttendances->get($studentId);
                
                return [
                    'student_id' => $studentId,
                    'name' => $enrollment->student->user->name ?? 'غير معروف',
                    'status' => $dailyRecord ? $dailyRecord->status : 'present', // Default to present as per user preference
                ];
            });
        }
        
        return Inertia::render('Academic/Attendances/Create', [
            'divisions' => $divisions,
            'students' => $studentsList,
            'filters' => [
                'date' => $date,
                'division_id' => $divisionId,
            ]
        ]);
    }

    /**
     * حفظ التحضير اليومي اليدوي للطلاب
     */
    public function store(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.status' => 'required|in:present,absent,late,excused',
        ]);
        
        foreach ($request->attendances as $attendance) {
            AttendanceLog::updateOrCreate(
                [
                    'user_id' => $attendance['student_id'],
                    'attendance_date' => $request->date,
                ],
                [
                    'status' => $attendance['status'],
                ]
            );
        }
        
        return redirect()->back()->with('success', 'تم حفظ سجلات الغياب اليومي بنجاح.');
    }

    /**
     * تقرير كشف الحضور والغياب الأسبوعي (Weekly Report)
     */
    public function weeklyReport(Request $request)
    {
        $grades = Grade::with('divisions')->get();
        $divisions = Division::with('grade')->get();
        
        $date = $request->filled('date') ? $request->date : today()->toDateString();
        $divisionId = $request->division_id ?? ($divisions->first()->id ?? null);
        $gradeId = $request->grade_id ?? ($divisions->where('id', $divisionId)->first()->grade_id ?? null);

        // Calculate the week's Sunday and Thursday
        $selectedDate = \Carbon\Carbon::parse($date);
        
        // In Middle East, week usually starts on Sunday. 
        // We'll manually adjust to find the Sunday of the current week.
        $dayOfWeek = $selectedDate->dayOfWeek; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        $sunday = $selectedDate->copy()->subDays($dayOfWeek);
        $thursday = $sunday->copy()->addDays(4);

        $weekDays = [
            'sunday'    => ['date' => $sunday->toDateString(), 'name' => 'الأحد'],
            'monday'    => ['date' => $sunday->copy()->addDays(1)->toDateString(), 'name' => 'الإثنين'],
            'tuesday'   => ['date' => $sunday->copy()->addDays(2)->toDateString(), 'name' => 'الثلاثاء'],
            'wednesday' => ['date' => $sunday->copy()->addDays(3)->toDateString(), 'name' => 'الأربعاء'],
            'thursday'  => ['date' => $thursday->toDateString(), 'name' => 'الخميس'],
        ];

        if (!$divisionId) {
            return Inertia::render('Academic/Attendances/WeeklyReport', [
                'students' => [],
                'weekDays' => $weekDays,
                'grades' => $grades,
                'divisions' => $divisions,
                'filters' => $request->only(['date', 'grade_id', 'division_id']),
            ]);
        }

        $division = Division::with('grade')->find($divisionId);

        // 2. Fetch Students
        $students = User::with([
            'student.currentEnrollment.division.grade',
            // Fetch daily logs for the 5 days
            'attendanceLogs' => function($q) use ($sunday, $thursday) {
                $q->whereBetween('attendance_date', [$sunday->toDateString(), $thursday->toDateString()]);
            }
        ])->whereHas('student.currentEnrollment', function($q) use ($divisionId) {
            $q->where('division_id', $divisionId);
        })->whereHas('role', function($q) {
            $q->where('name', 'طالب');
        })->orderBy('name')->get();

        // 3. Map Data
        $mappedStudents = $students->map(function ($user) use ($weekDays) {
            $studentLogs = $user->attendanceLogs->keyBy('attendance_date');
            
            $daysData = [];
            $totalAbsences = 0;
            $totalLates = 0;

            foreach ($weekDays as $key => $day) {
                $log = $studentLogs->get($day['date']);
                $status = $log ? $log->status : 'present'; // Default to present if no explicit absence
                
                $daysData[$key] = [
                    'status' => $status,
                    'date' => $day['date']
                ];

                if ($status === 'absent') $totalAbsences++;
                if ($status === 'late') $totalLates++;
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'id_number' => $user->id_number,
                'days' => $daysData,
                'stats' => [
                    'absences' => $totalAbsences,
                    'lates' => $totalLates
                ]
            ];
        });

        return Inertia::render('Academic/Attendances/WeeklyReport', [
            'students' => $mappedStudents,
            'weekDays' => $weekDays,
            'divisionInfo' => $division,
            'grades' => $grades,
            'divisions' => $divisions,
            'filters' => [
                'date' => $date,
                'grade_id' => $gradeId,
                'division_id' => $divisionId,
            ],
        ]);
    }

    /**
     * تقارير الغياب التفصيلية في الحصص (Matrix View)
     */
    public function classReports(Request $request)
    {
        $grades = Grade::with('divisions')->get();
        $divisions = Division::with('grade')->get();
        
        $date = $request->filled('date') ? $request->date : today()->toDateString();
        $divisionId = $request->division_id ?? ($divisions->first()->id ?? null);
        $gradeId = $request->grade_id ?? ($divisions->where('id', $divisionId)->first()->grade_id ?? null);

        // إذا لم يتم تحديد شعبة (ولم نجد واحدة افتراضية)، نعود بواجهة فارغة
        if (!$divisionId) {
            return Inertia::render('Academic/Attendances/ClassReports', [
                'students' => [],
                'periods' => [],
                'grades' => $grades,
                'divisions' => $divisions,
                'filters' => $request->only(['date', 'grade_id', 'division_id']),
            ]);
        }

        // 1. جلب الحصص الدراسية
        // نجلب الحصص الخاصة بالمجموعة (TimetableGroup) التي تتبع لها الشعبة، أو كل الحصص إذا لم يتوفر
        $division = Division::with('grade')->find($divisionId);
        $periodsQuery = DailyPeriod::where('is_break', false)->orderBy('start_time');
        $periods = $periodsQuery->get();

        // 2. جلب جميع الطلاب في هذه الشعبة
        $students = User::with([
            'student.currentEnrollment.division.grade',
            // البصمة اليومية
            'attendanceLogs' => function($q) use ($date) {
                $q->whereDate('attendance_date', $date);
            },
            // حضور الحصص
            'classAttendances' => function($q) use ($date, $divisionId) {
                $q->whereDate('date', $date)
                  ->where('division_id', $divisionId)
                  ->with(['subject', 'recorder', 'teacher']);
            }
        ])->whereHas('student.currentEnrollment', function($q) use ($divisionId) {
            $q->where('division_id', $divisionId);
        })->whereHas('role', function($q) {
            $q->where('name', 'طالب');
        })->orderBy('name')->get();

        // 3. بناء المصفوفة
        $mappedStudents = $students->map(function ($user) use ($periods) {
            // الاستنتاج الذكي للبصمة اليومية
            // إذا لم يكن له سجل، فهو غائب
            $dailyRecord = $user->attendanceLogs->first();
            $dailyStatus = ($dailyRecord && $dailyRecord->status === 'present') ? 'present' : 'absent';
            
            // تحويل سجلات الحصص إلى Key-Value لتسهيل البحث
            $classRecords = $user->classAttendances->keyBy('period_id');

            $periodsData = $periods->map(function ($period) use ($classRecords, $dailyStatus) {
                $classRecord = $classRecords->get($period->id);

                if ($classRecord) {
                    return [
                        'period_id' => $period->id,
                        'status' => $classRecord->status,
                        'notes' => $classRecord->notes,
                        'subject_name' => $classRecord->subject ? $classRecord->subject->name : null,
                        'recorder_name' => $classRecord->recorder ? $classRecord->recorder->name : ($classRecord->teacher ? $classRecord->teacher->name : null),
                    ];
                }

                // إذا لم يكن هناك سجل للحصة، نعتمد الاستنتاج اليومي
                return [
                    'period_id' => $period->id,
                    'status' => $dailyStatus,
                    'notes' => null,
                    'subject_name' => null,
                    'recorder_name' => null,
                ];
            });

            return [
                'id' => $user->id,
                'name' => $user->name,
                'daily_status' => $dailyStatus,
                'periods' => $periodsData->keyBy('period_id'),
            ];
        });

        $activeYear = \App\Models\AcademicYear::with('semesters')->where('is_active', true)->first() 
                   ?? \App\Models\AcademicYear::with('semesters')->latest()->first();
        
        $workingDays = $activeYear && $activeYear->working_days ? $activeYear->working_days : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        $dayOfWeek = \Carbon\Carbon::parse($date)->englishDayOfWeek;
        
        $activeSemester = null;
        if ($activeYear) {
            $activeSemester = $activeYear->semesters->where('is_active', true)->first() 
                           ?? $activeYear->semesters->first();
        }
        
        $timetable = collect();
        if ($divisionId && $activeSemester) {
            $timetable = \App\Models\MasterTimetable::with(['subject:id,name', 'teacher:id,name'])
                ->where('division_id', $divisionId)
                ->where('semester_id', $activeSemester->id)
                ->where('day_of_week', $dayOfWeek)
                ->get()
                ->keyBy('period_id');
        }

        return Inertia::render('Academic/Attendances/ClassReports', [
            'students' => $mappedStudents,
            'periods' => $periods,
            'grades' => $grades,
            'divisions' => $divisions,
            'workingDays' => $workingDays,
            'timetable' => (object) $timetable->toArray(),
            'filters' => [
                'date' => $date,
                'grade_id' => $gradeId,
                'division_id' => $divisionId,
            ],
        ]);
    }

    /**
     * حفظ تحضير الحصص من قبل الإدارة
     */
    public function storeClassAttendance(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'division_id' => 'required|exists:divisions,id',
            'period_id' => 'required|exists:daily_periods,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late,excused',
            'notes' => 'nullable|string',
        ]);

        $activeSemester = \App\Models\Semester::where('is_active', true)->first();
        if (!$activeSemester) {
            $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();
            $activeSemester = $activeYear ? $activeYear->semesters->first() : null;
        }

        $timetableSlot = \App\Models\MasterTimetable::where('division_id', $request->division_id)
            ->where('semester_id', $activeSemester ? $activeSemester->id : null)
            ->where('period_id', $request->period_id)
            ->where('day_of_week', date('w', strtotime($request->date))) // 0 (Sunday) to 6 (Saturday)
            ->first();

        ClassAttendance::updateOrCreate(
            [
                'student_id' => $request->student_id,
                'division_id' => $request->division_id,
                'period_id' => $request->period_id,
                'date' => $request->date,
            ],
            [
                'subject_id' => $timetableSlot ? $timetableSlot->subject_id : null,
                'teacher_id' => $timetableSlot ? $timetableSlot->teacher_id : null,
                'recorder_id' => auth()->id(),
                'status' => $request->status,
                'notes' => $request->notes,
            ]
        );

        return redirect()->back()->with('success', 'تم حفظ التحضير بنجاح.');
    }

    /**
     * حفظ تحضير الحصص من قبل الإدارة لشعبة كاملة (حصة واحدة)
     */
    public function storeBulkClassAttendance(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'period_id' => 'required|exists:daily_periods,id',
            'date' => 'required|date',
        ]);

        $activeSemester = \App\Models\Semester::where('is_active', true)->first();
        if (!$activeSemester) {
            $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();
            $activeSemester = $activeYear ? $activeYear->semesters->first() : null;
        }

        $timetableSlot = \App\Models\MasterTimetable::where('division_id', $request->division_id)
            ->where('semester_id', $activeSemester ? $activeSemester->id : null)
            ->where('period_id', $request->period_id)
            ->where('day_of_week', date('w', strtotime($request->date))) 
            ->first();

        // Get all students in the division
        $students = User::whereHas('student.currentEnrollment', function($q) use ($request) {
            $q->where('division_id', $request->division_id);
        })->whereHas('role', function($q) {
            $q->where('name', 'طالب');
        })->get();

        foreach ($students as $student) {
            ClassAttendance::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'division_id' => $request->division_id,
                    'period_id' => $request->period_id,
                    'date' => $request->date,
                ],
                [
                    'subject_id' => $timetableSlot ? $timetableSlot->subject_id : null,
                    'teacher_id' => $timetableSlot ? $timetableSlot->teacher_id : null,
                    'recorder_id' => auth()->id(),
                    // إذا كان هناك سجل مسبق لا نغيره، وإلا نجعله حاضر كافتراضي أو حسب الحضور اليومي
                    'status' => \DB::raw('COALESCE(status, "present")'),
                ]
            );
        }

        return redirect()->back()->with('success', 'تم تحضير جميع الطلاب للحصة المحددة.');
    }
}
