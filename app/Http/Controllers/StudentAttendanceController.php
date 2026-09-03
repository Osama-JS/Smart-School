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
use Spatie\LaravelPdf\Facades\Pdf;

class StudentAttendanceController extends Controller
{
    /**
     * تقارير الغياب اليومي للمدرسة
     */
    public function getAttendanceReportFilterData(Request $request)
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

        // Grade Filter
        if ($request->filled('grade_id')) {
            $query->whereHas('student.currentEnrollment.division', function($q) use ($request) {
                if (is_array($request->grade_id)) {
                    $q->whereIn('grade_id', $request->grade_id);
                } else {
                    $q->where('grade_id', $request->grade_id);
                }
            });
        }

        // Division Filter (Array Support for Multi-select)
        if ($request->filled('division_id')) {
            $query->whereHas('student.currentEnrollment', function($q) use ($request) {
                if (is_array($request->division_id)) {
                    $q->whereIn('division_id', $request->division_id);
                } else {
                    $q->where('division_id', $request->division_id);
                }
            });
        }

        // Smart Filters
        if ($request->filled('smart_filter')) {
            $startOfMonth = today()->startOfMonth()->toDateString();
            $endOfMonth = today()->endOfMonth()->toDateString();
            
            if ($request->smart_filter === 'absent_today') {
                $query->whereDoesntHave('attendanceLogs', function($q) use ($date) {
                    $q->whereDate('attendance_date', $date)
                      ->whereIn('status', ['present', 'late', 'excused']);
                });
            }
            elseif ($request->smart_filter === 'frequent_late') {
                $query->whereHas('attendanceLogs', function($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereBetween('attendance_date', [$startOfMonth, $endOfMonth])
                      ->where('status', 'late');
                }, '>=', 3);
            }
            elseif ($request->smart_filter === 'frequent_absent') {
                $query->whereHas('attendanceLogs', function($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereBetween('attendance_date', [$startOfMonth, $endOfMonth])
                      ->where('status', 'absent');
                }, '>=', 3);
            }
        }

        // Status Filter (Array Support for Multi-select)
        if ($request->filled('status') && empty($request->smart_filter)) {
            $statuses = is_array($request->status) ? $request->status : [$request->status];
            
            $query->where(function($q) use ($date, $statuses) {
                if (in_array('absent', $statuses) || in_array('غائب', $statuses)) {
                    // Filter for absent: they either have no log for today, or have a log with 'absent'
                    $q->whereDoesntHave('attendanceLogs', function($subQ) use ($date) {
                        $subQ->whereDate('attendance_date', $date);
                    })->orWhereHas('attendanceLogs', function($subQ) use ($date, $statuses) {
                        $subQ->whereDate('attendance_date', $date)->whereIn('status', $statuses);
                    });
                } else {
                    $q->whereHas('attendanceLogs', function($subQ) use ($date, $statuses) {
                        $subQ->whereDate('attendance_date', $date)->whereIn('status', $statuses);
                    });
                }
            });
        }

        $users = $query->get();

        $mappedData = $users->map(function($user) use ($date) {
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
                'status' => $log ? $log->status : 'absent' // Default is absent
            ];
        });

        $grades = Grade::with('divisions')->get();
        $divisions = Division::with('grade')->get();

        $studentsList = User::whereHas('role', function($q) {
            $q->where('name', 'طالب');
        })->with('student.currentEnrollment.division:id,grade_id')
          ->select('id', 'name')->get()->map(function($user) {
            $div = $user->student?->currentEnrollment?->division;
            return [
                'value' => $user->name,
                'label' => $user->name,
                'division_id' => $div ? $div->id : null,
                'grade_id' => $div ? $div->grade_id : null,
            ];
        });

        return [
            'logs' => $mappedData,
            'grades' => $grades,
            'divisions' => $divisions,
            'studentsList' => $studentsList,
            'filters' => $request->only(['date', 'search', 'grade_id', 'division_id', 'status', 'smart_filter']),
            'date' => $date
        ];
    }

    public function attendanceReport(Request $request)
    {
        $data = $this->getAttendanceReportFilterData($request);

        return Inertia::render('Academic/Attendances/AttendanceReport', [
            'logs' => $data['logs'],
            'grades' => $data['grades'],
            'divisions' => $data['divisions'],
            'studentsList' => $data['studentsList'],
            'filters' => $data['filters'],
        ]);
    }

    public function downloadAttendanceReportPdf(Request $request)
    {
        $data = $this->getAttendanceReportFilterData($request);
        
        $printSettings = json_decode($request->input('printSettings', '{}'), true);
        $paperSize = $printSettings['paperSize'] ?? 'A4';
        $brandColor = $printSettings['brandColor'] ?? '#63a22f';
        $orientation = $printSettings['orientation'] ?? 'portrait';
        $marginSetting = $printSettings['margins'] ?? 'normal';
        
        $margins = match ($marginSetting) {
            'none' => [0, 0, 0, 0],
            '1cm' => [10, 10, 10, 10],
            '2cm' => [20, 20, 20, 20],
            default => [15, 15, 15, 15],
        };

        if ($orientation === 'landscape') {
            $paperSize = \Spatie\LaravelPdf\Enums\Format::tryFrom(strtolower($paperSize)) ?? \Spatie\LaravelPdf\Enums\Format::A4;
            $margins = [$margins[0], $margins[1], $margins[2], $margins[3]];
        }

        $data['printSettings'] = $printSettings;
        $data['brandColor'] = $brandColor;
        $data['watermark'] = $printSettings['watermark'] ?? 'none';
        $data['orientation'] = $orientation;

        $footerHtml = '
            <div style="width: 100%; padding: 0 40px 10px 40px; margin: 0; font-family: tahoma, arial, sans-serif; direction: rtl; box-sizing: border-box;">
                <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 9px; color: #64748b;">
                    <div style="width: 33%; text-align: right;">
                        <strong style="color: ' . $brandColor . ';">نظام الإدارة الذكية</strong> (Smart School)
                    </div>
                    <div style="width: 33%; text-align: center; color: #94a3b8;">
                        طُبع بتاريخ: ' . now()->format('Y-m-d H:i') . '
                    </div>
                    <div style="width: 33%; text-align: left;">
                        <span style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 12px; font-weight: bold; color: #475569; display: inline-block;">
                            صفحة <span class="pageNumber"></span> / <span class="totalPages"></span>
                        </span>
                    </div>
                </div>
            </div>
        ';

        $pdf = Pdf::view('pdf.academic.student-absences', $data)
            ->format($paperSize)
            ->margins($margins[0], $margins[1], $margins[2] + 12, $margins[3])
            ->footerHtml($footerHtml);

        if ($orientation === 'landscape') {
            $pdf->landscape();
        }

        return $pdf->withBrowsershot(function ($browsershot) {
                $browsershot->setChromePath('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
                           ->noSandbox()
                           ->showBackground()
                           ->waitUntilNetworkIdle()
                           ->delay(2000);
            })
            ->download('student_absences_report.pdf');
    }

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
    public function getWeeklyAttendanceReportFilterData(Request $request)
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
            return [
                'students' => [],
                'weekDays' => $weekDays,
                'grades' => $grades,
                'divisions' => $divisions,
                'divisionInfo' => null,
                'filters' => $request->only(['date', 'grade_id', 'division_id']),
            ];
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

        return [
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
        ];
    }

    public function weeklyReport(Request $request)
    {
        $data = $this->getWeeklyAttendanceReportFilterData($request);
        return Inertia::render('Academic/Attendances/WeeklyReport', $data);
    }

    public function downloadWeeklyAttendanceReportPdf(Request $request)
    {
        $data = $this->getWeeklyAttendanceReportFilterData($request);
        
        $printSettings = json_decode($request->input('printSettings', '{}'), true);
        $paperSize = $printSettings['paperSize'] ?? 'A4';
        $brandColor = $printSettings['brandColor'] ?? '#63a22f';
        $orientation = $printSettings['orientation'] ?? 'portrait';
        $marginSetting = $printSettings['margins'] ?? 'normal';
        
        $margins = match ($marginSetting) {
            'none' => [0, 0, 0, 0],
            '1cm' => [10, 10, 10, 10],
            '2cm' => [20, 20, 20, 20],
            default => [15, 15, 15, 15],
        };

        if ($orientation === 'landscape') {
            $paperSize = \Spatie\LaravelPdf\Enums\Format::tryFrom(strtolower($paperSize)) ?? \Spatie\LaravelPdf\Enums\Format::A4;
            $margins = [$margins[0], $margins[1], $margins[2], $margins[3]];
        }

        $data['printSettings'] = $printSettings;
        $data['brandColor'] = $brandColor;
        $data['watermark'] = $printSettings['watermark'] ?? 'none';
        $data['orientation'] = $orientation;

        $footerHtml = '
            <div style="width: 100%; padding: 0 40px 10px 40px; margin: 0; font-family: tahoma, arial, sans-serif; direction: rtl; box-sizing: border-box;">
                <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 9px; color: #64748b;">
                    <div style="width: 33%; text-align: right;">
                        <strong style="color: ' . $brandColor . ';">نظام الإدارة الذكية</strong> (Smart School)
                    </div>
                    <div style="width: 33%; text-align: center; color: #94a3b8;">
                        طُبع بتاريخ: ' . now()->format('Y-m-d H:i') . '
                    </div>
                    <div style="width: 33%; text-align: left;">
                        <span style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 12px; font-weight: bold; color: #475569; display: inline-block;">
                            صفحة <span class="pageNumber"></span> / <span class="totalPages"></span>
                        </span>
                    </div>
                </div>
            </div>
        ';

        $pdf = Pdf::view('pdf.academic.student-weekly-absences', $data)
            ->format($paperSize)
            ->margins($margins[0], $margins[1], $margins[2] + 12, $margins[3])
            ->footerHtml($footerHtml);

        if ($orientation === 'landscape') {
            $pdf->landscape();
        }

        return $pdf->withBrowsershot(function ($browsershot) {
                $browsershot->setChromePath('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
                           ->noSandbox()
                           ->showBackground()
                           ->waitUntilNetworkIdle()
                           ->delay(2000);
            })
            ->download('student_weekly_absences_report.pdf');
    }

    /**
     * تقارير الغياب التفصيلية في الحصص (Matrix View)
     */
    public function getClassAttendanceReportFilterData(Request $request)
    {
        $grades = Grade::with('divisions')->get();
        $divisions = Division::with('grade')->get();
        
        $date = $request->filled('date') ? $request->date : today()->toDateString();
        $divisionId = $request->division_id ?? ($divisions->first()->id ?? null);
        $gradeId = $request->grade_id ?? ($divisions->where('id', $divisionId)->first()->grade_id ?? null);

        if (!$divisionId) {
            return [
                'students' => [],
                'periods' => [],
                'grades' => $grades,
                'divisions' => $divisions,
                'filters' => $request->only(['date', 'grade_id', 'division_id']),
                'workingDays' => [],
                'timetable' => collect(),
            ];
        }

        $division = Division::with('grade')->find($divisionId);
        $periodsQuery = DailyPeriod::where('is_break', false)->orderBy('start_time');
        $periods = $periodsQuery->get();

        $students = User::with([
            'student.currentEnrollment.division.grade',
            'attendanceLogs' => function($q) use ($date) {
                $q->whereDate('attendance_date', $date);
            },
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

        $mappedStudents = $students->map(function ($user) use ($periods) {
            $dailyRecord = $user->attendanceLogs->first();
            $dailyStatus = ($dailyRecord && $dailyRecord->status === 'present') ? 'present' : 'absent';
            
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

        return [
            'students' => $mappedStudents,
            'periods' => $periods,
            'grades' => $grades,
            'divisions' => $divisions,
            'filters' => $request->only(['date', 'grade_id', 'division_id']),
            'workingDays' => $workingDays,
            'timetable' => $timetable,
        ];
    }

    public function classAttendanceReport(Request $request)
    {
        $data = $this->getClassAttendanceReportFilterData($request);
        return Inertia::render('Academic/Attendances/ClassAttendanceReport', $data);
    }

    public function downloadClassAttendanceReportPdf(Request $request)
    {
        $data = $this->getClassAttendanceReportFilterData($request);
        
        $printSettings = json_decode($request->input('printSettings', '{}'), true);
        $paperSize = $printSettings['paperSize'] ?? 'A4';
        $brandColor = $printSettings['brandColor'] ?? '#63a22f';
        $orientation = $printSettings['orientation'] ?? 'landscape'; // Default to landscape for this report
        $marginSetting = $printSettings['margins'] ?? 'normal';
        
        $margins = match ($marginSetting) {
            'none' => [0, 0, 0, 0],
            '1cm' => [10, 10, 10, 10],
            '2cm' => [20, 20, 20, 20],
            default => [15, 15, 15, 15],
        };

        if ($orientation === 'landscape') {
            $paperSize = \Spatie\LaravelPdf\Enums\Format::tryFrom(strtolower($paperSize)) ?? \Spatie\LaravelPdf\Enums\Format::A4;
            $margins = [$margins[0], $margins[1], $margins[2], $margins[3]];
        }

        $data['printSettings'] = $printSettings;
        $data['brandColor'] = $brandColor;
        $data['watermark'] = $printSettings['watermark'] ?? 'none';
        $data['orientation'] = $orientation;

        $footerHtml = '
            <div style="width: 100%; padding: 0 40px 10px 40px; margin: 0; font-family: tahoma, arial, sans-serif; direction: rtl; box-sizing: border-box;">
                <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 9px; color: #64748b;">
                    <div style="width: 33%; text-align: right;">
                        <strong style="color: ' . $brandColor . ';">نظام الإدارة الذكية</strong> (Smart School)
                    </div>
                    <div style="width: 33%; text-align: center; color: #94a3b8;">
                        طُبع بتاريخ: ' . now()->format('Y-m-d H:i') . '
                    </div>
                    <div style="width: 33%; text-align: left;">
                        <span style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 12px; font-weight: bold; color: #475569; display: inline-block;">
                            صفحة <span class="pageNumber"></span> / <span class="totalPages"></span>
                        </span>
                    </div>
                </div>
            </div>
        ';

        $pdf = Pdf::view('pdf.academic.student-class-absences', $data)
            ->format($paperSize)
            ->margins($margins[0], $margins[1], $margins[2] + 12, $margins[3])
            ->footerHtml($footerHtml);

        if ($orientation === 'landscape') {
            $pdf->landscape();
        }

        return $pdf->withBrowsershot(function ($browsershot) {
                $browsershot->setChromePath('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
                           ->noSandbox()
                           ->showBackground()
                           ->waitUntilNetworkIdle()
                           ->delay(2000);
            })
            ->download('student_class_absences_report.pdf');
    }

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
