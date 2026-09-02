<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LessonPreparation;
use App\Models\MasterTimetable;
use App\Models\Setting;
use App\Models\Subject;
use App\Models\Grade;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Spatie\LaravelPdf\Facades\Pdf;

class FollowupBookController extends Controller
{
    private function getFilterData(Request $request)
    {
        $timeLimit = Setting::where('key', 'preparation_upload_time_limit')->value('value')
            ?: Setting::where('key', 'followup_upload_time_limit')->value('value')
            ?: '14:00';

        $search = $request->input('search', '');
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');
        $departmentId = $request->input('department_id');
        $employeeId = $request->input('employee_id');
        $statuses = $request->input('statuses');
        $violatorsOnly = filter_var($request->input('violators_only', false), FILTER_VALIDATE_BOOLEAN);

        if (is_string($statuses) && !empty($statuses)) {
            $statusesList = explode(',', $statuses);
        } else if (is_array($statuses)) {
            $statusesList = $statuses;
        } else {
            $statusesList = ['published', 'late', 'draft', 'missing'];
        }

        // Determine Start and End Date (Default: Full Week from Saturday to Friday)
        if ($startDateInput && $endDateInput) {
            $startOfWeek = Carbon::parse($startDateInput)->startOfDay();
            $endOfWeek = Carbon::parse($endDateInput)->endOfDay();
        } else {
            $startOfWeek = now()->startOfWeek(Carbon::SATURDAY)->startOfDay();
            $endOfWeek = $startOfWeek->copy()->addDays(6)->endOfDay();
        }

        $period = CarbonPeriod::create($startOfWeek, $endOfWeek);

        // Get user branch
        $user = auth()->user();
        $branchId = $user ? $user->branch_id : null;

        // Fetch departments list
        $departments = Department::when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select('id', 'name')
            ->get();

        // Base Query for Teachers (supports role names like معلم, معلم أول, Teacher)
        $teachersQuery = User::whereHas('role', function ($query) {
                $query->where('name', 'like', '%معلم%')
                      ->orWhere('name', 'Teacher')
                      ->orWhere('name', 'مشرف تربوي');
            })
            ->with(['employee.department']);

        if ($branchId) {
            $teachersQuery->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            });
        }
            
        if ($search) {
            $teachersQuery->where('name', 'like', '%' . $search . '%');
        }

        if ($employeeId) {
            $teachersQuery->where('id', $employeeId);
        }

        if ($departmentId) {
            $teachersQuery->whereHas('employee', function($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }
        
        $teachers = $teachersQuery->get();
        $teacherIds = $teachers->pluck('id')->toArray();

        // Eager load lesson preparations
        $allPreps = LessonPreparation::with(['subject', 'grade', 'division'])
            ->whereIn('teacher_id', $teacherIds)
            ->whereBetween('preparation_date', [$startOfWeek->format('Y-m-d'), $endOfWeek->format('Y-m-d')])
            ->get()
            ->groupBy('teacher_id');

        // Eager load master timetables
        $timetables = MasterTimetable::with(['subject', 'division.grade'])
            ->whereIn('teacher_id', $teacherIds)
            ->get()
            ->groupBy('teacher_id');

        $dayNames = [
            'Saturday'  => 'السبت',
            'Sunday'    => 'الأحد',
            'Monday'    => 'الاثنين',
            'Tuesday'   => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday'  => 'الخميس',
            'Friday'    => 'الجمعة',
        ];

        $dayAliases = [
            'saturday'  => ['saturday', 'السبت', '6'],
            'sunday'    => ['sunday', 'الأحد', 'الاحد', '0'],
            'monday'    => ['monday', 'الاثنين', 'الإثنين', '1'],
            'tuesday'   => ['tuesday', 'الثلاثاء', '2'],
            'wednesday' => ['wednesday', 'الأربعاء', 'الاربعاء', '3'],
            'thursday'  => ['thursday', 'الخميس', '4'],
            'friday'    => ['friday', 'الجمعة', '5'],
        ];

        $statusLabels = [
            'published' => 'تم التحضير',
            'late'      => 'تحضير متأخر',
            'draft'     => 'مسودة',
            'missing'   => 'لم يتم التحضير'
        ];

        $teachersData = [];
        $deptStatsMap = [];

        $totalExpectedAll = 0;
        $totalPublishedAll = 0;
        $totalLateAll = 0;
        $totalDraftAll = 0;
        $totalNegligenceAll = 0;
        $violatorTeachersCount = 0;

        foreach ($teachers as $teacher) {
            $deptName = $teacher->employee && $teacher->employee->department 
                ? $teacher->employee->department->name 
                : 'القسم الأكاديمي';

            $preps = $allPreps->get($teacher->id, collect());
            $teacherTimetable = $timetables->get($teacher->id, collect());
            $expectedLessonsCount = $teacherTimetable->count();

            $records = [];
            $publishedCount = 0;
            $lateCount = 0;
            $draftCount = 0;
            $missingCount = 0;

            // Iterate over each date in period
            foreach ($period as $date) {
                $dateStr = $date->format('Y-m-d');
                $dayOfWeek = $date->format('l');
                $lowerDay = strtolower($dayOfWeek);
                $validDayNames = $dayAliases[$lowerDay] ?? [$lowerDay];

                $lessonsForDay = $teacherTimetable->filter(function($item) use ($validDayNames) {
                    $itemDay = strtolower(trim($item->day_of_week ?? ''));
                    return in_array($itemDay, $validDayNames);
                });

                foreach ($lessonsForDay as $lesson) {
                    $prep = $preps->first(function($p) use ($dateStr, $lesson) {
                        $prepDate = is_string($p->preparation_date) ? $p->preparation_date : $p->preparation_date->format('Y-m-d');
                        return $prepDate === $dateStr 
                            && $p->subject_id == $lesson->subject_id 
                            && ($p->division_id == $lesson->division_id || empty($p->division_id));
                    });

                    $statusCode = 'missing';
                    if ($prep) {
                        if ($prep->status === 'draft') {
                            $statusCode = 'draft';
                        } else {
                            $limitTime = Carbon::parse($dateStr . ' ' . $timeLimit);
                            if ($prep->created_at && $prep->created_at->gt($limitTime)) {
                                $statusCode = 'late';
                            } else {
                                $statusCode = 'published';
                            }
                        }
                    }

                    if (!in_array($statusCode, $statusesList)) {
                        continue;
                    }

                    if ($statusCode === 'published') $publishedCount++;
                    if ($statusCode === 'late') $lateCount++;
                    if ($statusCode === 'draft') $draftCount++;
                    if ($statusCode === 'missing') $missingCount++;

                    $records[] = [
                        'id' => $prep ? $prep->id : 'm_' . $teacher->id . '_' . $dateStr . '_' . $lesson->id,
                        'date' => $dateStr,
                        'day' => $dayNames[$dayOfWeek] ?? $dayOfWeek,
                        'subject_name' => $prep->subject->name ?? $lesson->subject->name ?? 'مادة',
                        'grade_name' => $prep->grade->name ?? ($lesson->division && $lesson->division->grade ? $lesson->division->grade->name : ''),
                        'division_name' => $prep->division->name ?? ($lesson->division ? $lesson->division->name : ''),
                        'lesson_title' => $prep ? ($prep->lesson_title ?: 'بدون عنوان') : 'غير محضر',
                        'status_code' => $statusCode,
                        'status' => $statusLabels[$statusCode] ?? $statusCode,
                        'created_at' => $prep && $prep->created_at ? $prep->created_at->format('H:i') : '-',
                    ];
                }
            }

            // Also check any standalone preparations not matched to timetables
            $unmatchedPreps = $preps->filter(function($p) use ($records) {
                return !collect($records)->pluck('id')->contains($p->id);
            });

            foreach ($unmatchedPreps as $p) {
                $prepDateStr = is_string($p->preparation_date) ? $p->preparation_date : $p->preparation_date->format('Y-m-d');
                $pDate = Carbon::parse($prepDateStr);
                $dayOfWeek = $pDate->format('l');
                $statusCode = $p->status === 'draft' ? 'draft' : 'published';
                if ($statusCode === 'published') {
                    $limitTime = Carbon::parse($prepDateStr . ' ' . $timeLimit);
                    if ($p->created_at && $p->created_at->gt($limitTime)) {
                        $statusCode = 'late';
                    }
                }

                if (!in_array($statusCode, $statusesList)) {
                    continue;
                }

                if ($statusCode === 'published') $publishedCount++;
                if ($statusCode === 'late') $lateCount++;
                if ($statusCode === 'draft') $draftCount++;

                $records[] = [
                    'id' => $p->id,
                    'date' => $prepDateStr,
                    'day' => $dayNames[$dayOfWeek] ?? $dayOfWeek,
                    'subject_name' => $p->subject->name ?? 'مادة',
                    'grade_name' => $p->grade->name ?? '',
                    'division_name' => $p->division->name ?? '',
                    'lesson_title' => $p->lesson_title ?: 'بدون عنوان',
                    'status_code' => $statusCode,
                    'status' => $statusLabels[$statusCode] ?? $statusCode,
                    'created_at' => $p->created_at ? $p->created_at->format('H:i') : '-',
                ];
            }

            $totalTeacherExpected = max($expectedLessonsCount, count($records));
            $teacherNegligence = $missingCount;

            if ($violatorsOnly && $teacherNegligence == 0 && $lateCount == 0) {
                continue;
            }

            if ($teacherNegligence > 0 || $lateCount > 0) {
                $violatorTeachersCount++;
            }

            $totalExpectedAll += $totalTeacherExpected;
            $totalPublishedAll += $publishedCount;
            $totalLateAll += $lateCount;
            $totalDraftAll += $draftCount;
            $totalNegligenceAll += $teacherNegligence;

            // Department aggregations
            if (!isset($deptStatsMap[$deptName])) {
                $deptStatsMap[$deptName] = [
                    'name' => $deptName,
                    'published' => 0,
                    'late' => 0,
                    'draft' => 0,
                    'missing' => 0,
                ];
            }
            $deptStatsMap[$deptName]['published'] += $publishedCount;
            $deptStatsMap[$deptName]['late'] += $lateCount;
            $deptStatsMap[$deptName]['draft'] += $draftCount;
            $deptStatsMap[$deptName]['missing'] += $teacherNegligence;

            $teachersData[] = [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'employee_name' => $teacher->name,
                'department' => $deptName,
                'total_weekly_lessons' => $totalTeacherExpected,
                'published_preparations' => $publishedCount,
                'draft_preparations' => $draftCount,
                'late_uploads' => $lateCount,
                'negligence' => $teacherNegligence,
                'records' => $records,
            ];
        }

        $departmentChartData = array_values($deptStatsMap);

        $kpis = [
            'total_expected' => $totalExpectedAll,
            'total_published' => $totalPublishedAll,
            'total_late' => $totalLateAll,
            'total_draft' => $totalDraftAll,
            'total_negligence' => $totalNegligenceAll,
            'unique_teachers' => $violatorTeachersCount,
            'compliance_rate' => $totalExpectedAll > 0 ? round(($totalPublishedAll / $totalExpectedAll) * 100) : 100,
        ];

        // All teachers list for filter dropdown
        $allTeachersList = User::whereHas('role', function ($query) {
                $query->where('name', 'like', '%معلم%')
                      ->orWhere('name', 'Teacher')
                      ->orWhere('name', 'مشرف تربوي');
            })
            ->when($branchId, fn($q) => $q->where(fn($sub) => $sub->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->select('id', 'name')
            ->get();

        return [
            'teachersData' => $teachersData,
            'kpis' => $kpis,
            'departmentChartData' => $departmentChartData,
            'departments' => $departments,
            'allTeachersList' => $allTeachersList,
            'timeLimit' => $timeLimit,
            'periodStart' => $startOfWeek->format('Y-m-d'),
            'periodEnd' => $endOfWeek->format('Y-m-d'),
        ];
    }

    public function index(Request $request)
    {
        $data = $this->getFilterData($request);

        return Inertia::render('Admin/FollowupBooks/Index', [
            'teachers' => $data['teachersData'],
            'kpis' => $data['kpis'],
            'departmentChartData' => $data['departmentChartData'],
            'departments' => $data['departments'],
            'allTeachers' => $data['allTeachersList'],
            'timeLimit' => $data['timeLimit'],
            'periodStart' => $data['periodStart'],
            'periodEnd' => $data['periodEnd'],
            'filters' => [
                'search' => $request->input('search', ''),
                'start_date' => $request->input('start_date', $data['periodStart']),
                'end_date' => $request->input('end_date', $data['periodEnd']),
                'department_id' => $request->input('department_id', ''),
                'employee_id' => $request->input('employee_id', ''),
                'statuses' => $request->input('statuses', ''),
                'violators_only' => filter_var($request->input('violators_only', false), FILTER_VALIDATE_BOOLEAN),
            ]
        ]);
    }

    public function report(Request $request)
    {
        $data = $this->getFilterData($request);

        return Inertia::render('HR/Reports/FollowupBooks', [
            'teachers' => $data['teachersData'],
            'kpis' => $data['kpis'],
            'departmentChartData' => $data['departmentChartData'],
            'departments' => $data['departments'],
            'allTeachers' => $data['allTeachersList'],
            'timeLimit' => $data['timeLimit'],
            'periodStart' => $data['periodStart'],
            'periodEnd' => $data['periodEnd'],
            'filters' => [
                'search' => $request->input('search', ''),
                'start_date' => $request->input('start_date', $data['periodStart']),
                'end_date' => $request->input('end_date', $data['periodEnd']),
                'department_id' => $request->input('department_id', ''),
                'employee_id' => $request->input('employee_id', ''),
                'statuses' => $request->input('statuses', ''),
                'violators_only' => filter_var($request->input('violators_only', false), FILTER_VALIDATE_BOOLEAN),
            ]
        ]);
    }

    public function export(Request $request)
    {
        $data = $this->getFilterData($request);
        $teachersData = $data['teachersData'];

        $fileName = 'teachers_preparations_report_' . date('Y-m-d') . '.csv';

        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = [
            'اسم المعلم',
            'إجمالي الحصص الأسبوعية',
            'التحضيرات المنشورة',
            'المسودات',
            'التحضير المتأخر',
            'الحصص غير المحضرة (التقصير)'
        ];

        $callback = function() use($teachersData, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            foreach ($teachersData as $row) {
                fputcsv($file, [
                    $row['name'],
                    $row['total_weekly_lessons'],
                    $row['published_preparations'],
                    $row['draft_preparations'],
                    $row['late_uploads'],
                    $row['negligence']
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function downloadPdf(Request $request)
    {
        $data = $this->getFilterData($request);
        
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

        $pdf = Pdf::view('pdf.hr.followup-books', $data)
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
            ->download('followup_books_report.pdf');
    }

    public function show(Request $request, User $teacher)
    {
        $timeLimit = Setting::where('key', 'preparation_upload_time_limit')->value('value')
            ?: Setting::where('key', 'followup_upload_time_limit')->value('value')
            ?: '14:00';
        
        $startDateInput = $request->query('start_date');
        $endDateInput = $request->query('end_date');

        if ($startDateInput && $endDateInput) {
            $start = Carbon::parse($startDateInput)->startOfDay();
            $end = Carbon::parse($endDateInput)->endOfDay();
        } else {
            $start = now()->startOfWeek(Carbon::SATURDAY)->startOfDay();
            $end = $start->copy()->addDays(6)->endOfDay();
        }

        $period = CarbonPeriod::create($start, $end);

        $timetable = MasterTimetable::with(['subject', 'division.grade'])
            ->where('teacher_id', $teacher->id)
            ->get();

        $preparations = LessonPreparation::with(['subject', 'grade', 'division'])
            ->where('teacher_id', $teacher->id)
            ->whereBetween('preparation_date', [$start->format('Y-m-d'), $end->format('Y-m-d')])
            ->get();

        $days = [];
        $dayNames = [
            'Saturday'  => 'السبت',
            'Sunday'    => 'الأحد',
            'Monday'    => 'الاثنين',
            'Tuesday'   => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday'  => 'الخميس',
            'Friday'    => 'الجمعة',
        ];

        $dayAliases = [
            'saturday'  => ['saturday', 'السبت', '6'],
            'sunday'    => ['sunday', 'الأحد', 'الاحد', '0'],
            'monday'    => ['monday', 'الاثنين', 'الإثنين', '1'],
            'tuesday'   => ['tuesday', 'الثلاثاء', '2'],
            'wednesday' => ['wednesday', 'الأربعاء', 'الاربعاء', '3'],
            'thursday'  => ['thursday', 'الخميس', '4'],
            'friday'    => ['friday', 'الجمعة', '5'],
        ];

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $dayOfWeek = $date->format('l');
            $lowerDay = strtolower($dayOfWeek);
            $validDayNames = $dayAliases[$lowerDay] ?? [$lowerDay];
            
            $lessonsForDay = $timetable->filter(function($item) use ($validDayNames) {
                $itemDay = strtolower(trim($item->day_of_week ?? ''));
                return in_array($itemDay, $validDayNames);
            });
            
            $dayData = [
                'date' => $dateStr,
                'day_name' => $dayNames[$dayOfWeek] ?? $dayOfWeek,
                'lessons' => []
            ];

            foreach ($lessonsForDay as $lesson) {
                // Find matching preparation for this subject, division, and date
                $prep = $preparations->first(function($p) use ($dateStr, $lesson) {
                    $prepDate = is_string($p->preparation_date) ? $p->preparation_date : $p->preparation_date->format('Y-m-d');
                    return $prepDate === $dateStr && $p->subject_id == $lesson->subject_id && ($p->division_id == $lesson->division_id || empty($p->division_id));
                });

                $status = 'missing'; // لم يتم التحضير
                if ($prep) {
                    if ($prep->status === 'draft') {
                        $status = 'draft';
                    } else {
                        $limitTime = Carbon::parse($dateStr . ' ' . $timeLimit);
                        if ($prep->created_at && $prep->created_at->gt($limitTime)) {
                            $status = 'late'; // تحضير متأخر
                        } else {
                            $status = 'on_time'; // تم التحضير في الوقت
                        }
                    }
                }

                $dayData['lessons'][] = [
                    'subject' => $lesson->subject->name ?? 'غير محدد',
                    'division' => ($lesson->division->grade->name ?? '') . ' - ' . ($lesson->division->name ?? ''),
                    'status' => $status,
                    'preparation' => $prep ? [
                        'id' => $prep->id,
                        'lesson_title' => $prep->lesson_title,
                        'topics_covered' => $prep->topics_covered,
                        'homework' => $prep->homework,
                        'status' => $prep->status,
                        'created_at' => $prep->created_at ? $prep->created_at->format('Y-m-d H:i') : null,
                    ] : null
                ];
            }
            
            if (count($dayData['lessons']) > 0) {
                $days[] = $dayData;
            }
        }

        return Inertia::render('Admin/FollowupBooks/Show', [
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
            ],
            'days' => $days,
            'timeLimit' => $timeLimit,
            'periodStart' => $start->format('Y-m-d'),
            'periodEnd' => $end->format('Y-m-d'),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'time_limit' => 'required|date_format:H:i'
        ]);

        Setting::updateOrCreate(
            ['key' => 'preparation_upload_time_limit'],
            ['value' => $request->time_limit, 'group' => 'general']
        );

        return back()->with('success', 'تم حفظ إعدادات مواعيد دفاتر التحضير بنجاح.');
    }
}
