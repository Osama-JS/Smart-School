<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\FollowupBook;
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
        $timeLimit = Setting::where('key', 'followup_upload_time_limit')->value('value') ?: '14:00';

        $search = $request->input('search');
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');

        // Determine Start and End Date
        if ($startDateInput && $endDateInput) {
            $startOfWeek = Carbon::parse($startDateInput)->startOfDay();
            $endOfWeek = Carbon::parse($endDateInput)->endOfDay();
        } else {
            // Default to current week
            $startOfWeek = now()->startOfWeek(Carbon::SUNDAY)->startOfDay();
            $endOfWeek = now()->endOfWeek(Carbon::THURSDAY)->endOfDay();
        }

        $period = CarbonPeriod::create($startOfWeek, $endOfWeek);

        // Get teachers
        $teachersQuery = User::whereHas('role', function ($query) {
                $query->where('name', 'معلم');
            })
            ->with(['employee']);
            
        if ($search) {
            $teachersQuery->where('name', 'like', '%' . $search . '%');
        }
        
        $teachers = $teachersQuery->get();

        $teacherIds = $teachers->pluck('id')->toArray();

        // Eager load all followups for these teachers
        $allFollowups = FollowupBook::whereIn('teacher_id', $teacherIds)
                            ->whereBetween('date', [$startOfWeek, $endOfWeek])
                            ->get()
                            ->groupBy('teacher_id');

        $teachersData = $teachers->map(function ($teacher) use ($timeLimit, $allFollowups) {
            // Get followups from collection
            $followups = $allFollowups->get($teacher->id, collect());
            
            $expectedLessons = $followups->count();
            $completedFollowups = $followups->whereNotNull('uploaded_at');

            $appUploads = $completedFollowups->where('upload_source', 'app')->count();
            $dashUploads = $completedFollowups->where('upload_source', 'dashboard')->count();
            
            $lateUploads = $completedFollowups->filter(function ($f) use ($timeLimit) {
                $limitTime = Carbon::parse($f->date->format('Y-m-d') . ' ' . $timeLimit);
                return $f->uploaded_at->gt($limitTime);
            })->count();

            $negligence = max(0, $expectedLessons - $completedFollowups->count());

            return [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'total_weekly_lessons' => $expectedLessons,
                'app_uploads' => $appUploads,
                'dashboard_uploads' => $dashUploads,
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

        $fileName = 'teachers_followup_report_' . date('Y-m-d') . '.csv';

        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = [
            'اسم المعلم',
            'إجمالي الحصص المتوقعة',
            'الرفع من التطبيق',
            'الرفع من النظام',
            'الرفع المتأخر',
            'التقصير'
        ];

        $callback = function() use($teachersData, $columns) {
            $file = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            foreach ($teachersData as $row) {
                fputcsv($file, [
                    $row['name'],
                    $row['total_weekly_lessons'],
                    $row['app_uploads'],
                    $row['dashboard_uploads'],
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
        $timeLimit = Setting::where('key', 'followup_upload_time_limit')->value('value') ?: '14:00';
        
        $startDateInput = $request->query('start_date');
        $endDateInput = $request->query('end_date');

        if ($startDateInput && $endDateInput) {
            $start = Carbon::parse($startDateInput)->startOfDay();
            $end = Carbon::parse($endDateInput)->endOfDay();
        } else {
            $start = now()->startOfWeek(Carbon::SUNDAY)->startOfDay();
            $end = now()->endOfWeek(Carbon::THURSDAY)->endOfDay();
        }

        $period = CarbonPeriod::create($start, $end);

        $followups = FollowupBook::with(['subject', 'division.grade'])
            ->where('teacher_id', $teacher->id)
            ->whereBetween('date', [$start, $end])
            ->get();

        $followupsByDate = $followups->groupBy(function($item) {
            return $item->date->format('Y-m-d');
        });

        $days = [];
        $dayNames = [
            'Saturday' => 'السبت',
            'Sunday' => 'الأحد',
            'Monday' => 'الاثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
        ];

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $dayOfWeek = $date->format('l');
            
            $lessonsForDay = $followupsByDate->get($dateStr, collect());
            
            $dayData = [
                'date' => $dateStr,
                'day_name' => $dayNames[$dayOfWeek] ?? $dayOfWeek,
                'lessons' => []
            ];

            foreach ($lessonsForDay as $followup) {
                $status = 'missing'; // مقصر
                if ($followup->uploaded_at) {
                    $limitTime = Carbon::parse($dateStr . ' ' . $timeLimit);
                    if ($followup->uploaded_at->gt($limitTime)) {
                        $status = 'late'; // متأخر
                    } else {
                        $status = 'on_time'; // تم الرفع في الوقت
                    }
                }

                $dayData['lessons'][] = [
                    'subject' => $followup->subject->name ?? 'غير محدد',
                    'division' => ($followup->division->grade->name ?? '') . ' - ' . ($followup->division->name ?? ''),
                    'status' => $status,
                    'followup' => $followup
                ];
            }
            
            // Only add days that have lessons
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
            'timeLimit' => $timeLimit
        ]);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'time_limit' => 'required|date_format:H:i'
        ]);

        Setting::updateOrCreate(
            ['key' => 'followup_upload_time_limit'],
            ['value' => $request->time_limit, 'group' => 'general']
        );

        return back()->with('success', 'تم حفظ إعدادات دفاتر المتابعة بنجاح.');
    }
}
