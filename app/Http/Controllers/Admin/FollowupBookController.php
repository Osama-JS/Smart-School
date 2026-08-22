<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LessonPreparation;
use App\Models\MasterTimetable;
use App\Models\Setting;
use App\Models\Subject;
use App\Models\Grade;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FollowupBookController extends Controller
{
    private function getFilterData(Request $request)
    {
        $timeLimit = Setting::where('key', 'preparation_upload_time_limit')->value('value')
            ?: Setting::where('key', 'followup_upload_time_limit')->value('value')
            ?: '14:00';

        $search = $request->input('search');
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');

        // Determine Start and End Date (Default: Full Week from Saturday to Friday)
        if ($startDateInput && $endDateInput) {
            $startOfWeek = Carbon::parse($startDateInput)->startOfDay();
            $endOfWeek = Carbon::parse($endDateInput)->endOfDay();
        } else {
            $startOfWeek = now()->startOfWeek(Carbon::SATURDAY)->startOfDay();
            $endOfWeek = $startOfWeek->copy()->addDays(6)->endOfDay();
        }

        $period = CarbonPeriod::create($startOfWeek, $endOfWeek);

        // Get teachers of current branch
        $user = auth()->user();
        $branchId = $user->branch_id;

        $teachersQuery = User::whereHas('role', function ($query) {
                $query->where('name', 'معلم');
            })
            ->with(['employee']);

        if ($branchId) {
            $teachersQuery->where('branch_id', $branchId);
        }
            
        if ($search) {
            $teachersQuery->where('name', 'like', '%' . $search . '%');
        }
        
        $teachers = $teachersQuery->get();
        $teacherIds = $teachers->pluck('id')->toArray();

        // Eager load all lesson preparations for these teachers in the date range
        $allPreps = LessonPreparation::whereIn('teacher_id', $teacherIds)
            ->whereBetween('preparation_date', [$startOfWeek->format('Y-m-d'), $endOfWeek->format('Y-m-d')])
            ->get()
            ->groupBy('teacher_id');

        // Eager load timetable counts per teacher
        $timetableCounts = MasterTimetable::whereIn('teacher_id', $teacherIds)
            ->get()
            ->groupBy('teacher_id')
            ->map(fn($items) => $items->count());

        $teachersData = $teachers->map(function ($teacher) use ($timeLimit, $allPreps, $timetableCounts) {
            $preps = $allPreps->get($teacher->id, collect());
            $expectedLessons = $timetableCounts->get($teacher->id, 0);

            $publishedPreps = $preps->where('status', 'published');
            $draftPreps = $preps->where('status', 'draft');

            $lateUploads = $publishedPreps->filter(function ($p) use ($timeLimit) {
                $prepDateStr = is_string($p->preparation_date) ? $p->preparation_date : $p->preparation_date->format('Y-m-d');
                $limitTime = Carbon::parse($prepDateStr . ' ' . $timeLimit);
                return $p->created_at && $p->created_at->gt($limitTime);
            })->count();

            $negligence = max(0, $expectedLessons - $publishedPreps->count());

            return [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'total_weekly_lessons' => $expectedLessons,
                'published_preparations' => $publishedPreps->count(),
                'draft_preparations' => $draftPreps->count(),
                'late_uploads' => $lateUploads,
                'negligence' => $negligence,
            ];
        });

        return [
            'teachersData' => $teachersData,
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
            'timeLimit' => $data['timeLimit'],
            'periodStart' => $data['periodStart'],
            'periodEnd' => $data['periodEnd'],
            'filters' => [
                'search' => $request->input('search', ''),
                'start_date' => $request->input('start_date', $data['periodStart']),
                'end_date' => $request->input('end_date', $data['periodEnd']),
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
