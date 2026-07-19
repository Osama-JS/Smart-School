<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\MasterTimetable;
use App\Models\FollowupBook;
use App\Models\Subject;
use App\Models\Grade;
use App\Models\Division;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class FollowupBookController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = auth()->id();

        $startDateInput = $request->query('start_date');
        $endDateInput = $request->query('end_date');
        $weekOffset = (int) $request->query('week_offset', 0);
        
        if ($startDateInput && $endDateInput) {
            $startOfWeek = Carbon::parse($startDateInput)->startOfDay();
            $endOfWeek = Carbon::parse($endDateInput)->endOfDay();
        } else {
            // Calculate the target week's start and end dates (Sunday to Thursday)
            $startOfWeek = now()->addWeeks($weekOffset)->startOfWeek(Carbon::SUNDAY)->startOfDay();
            $endOfWeek = $startOfWeek->copy()->endOfWeek(Carbon::THURSDAY)->endOfDay();
        }
        
        $period = CarbonPeriod::create($startOfWeek, $endOfWeek);

        $timetable = MasterTimetable::with(['subject', 'division.grade'])
            ->where('teacher_id', $teacherId)
            ->get();

        // Fetch followups for this teacher in this week
        $followups = FollowupBook::where('teacher_id', $teacherId)
            ->whereBetween('date', [$startOfWeek, $endOfWeek])
            ->get()
            ->keyBy(function($item) {
                return $item->date->format('Y-m-d') . '_' . $item->division_id . '_' . $item->subject_id;
            });

        $dayNames = [
            'Saturday' => 'السبت',
            'Sunday' => 'الأحد',
            'Monday' => 'الاثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
        ];

        $days = [];

        foreach ($period as $date) {
            $dayOfWeek = $date->format('l');
            $lessonsForDay = $timetable->filter(function($item) use ($dayOfWeek) {
                return strtolower($item->day_of_week) === strtolower($dayOfWeek);
            })->unique(function ($item) {
                return $item->subject_id . '_' . $item->division_id;
            });

            $dayData = [
                'date' => $date->format('Y-m-d'),
                'day_name' => $dayNames[$dayOfWeek] ?? $dayOfWeek,
                'lessons' => []
            ];

            foreach ($lessonsForDay as $lesson) {
                $key = $date->format('Y-m-d') . '_' . $lesson->division_id . '_' . $lesson->subject_id;
                $followup = $followups->get($key);

                $dayData['lessons'][] = [
                    'subject' => $lesson->subject,
                    'division' => $lesson->division,
                    'has_followup' => $followup ? true : false,
                ];
            }

            // Show all working days (Sunday to Thursday) even if empty
            $days[] = $dayData;
        }

        return Inertia::render('Teacher/FollowupBooks/Index', [
            'days' => $days,
            'weekOffset' => $weekOffset,
            'periodStart' => $startOfWeek->format('Y-m-d'),
            'periodEnd' => $endOfWeek->format('Y-m-d'),
            'filters' => [
                'start_date' => $startDateInput,
                'end_date' => $endDateInput,
            ]
        ]);
    }

    public function show(Request $request)
    {
        $date = $request->query('date');
        $subjectId = $request->query('subject_id');
        $divisionId = $request->query('division_id');
        
        $teacherId = auth()->id();

        if (!$date || !$subjectId || !$divisionId) {
            return redirect()->route('teacher.followup-books.index')->with('error', 'بيانات مفقودة');
        }

        $subject = Subject::find($subjectId);
        $division = Division::with('grade')->find($divisionId);

        $followup = FollowupBook::where('teacher_id', $teacherId)
            ->where('subject_id', $subjectId)
            ->where('division_id', $divisionId)
            ->where('date', $date)
            ->first();

        return Inertia::render('Teacher/FollowupBooks/Details', [
            'date' => $date,
            'subject' => $subject,
            'division' => $division,
            'followup' => $followup
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'subject_id' => 'required|exists:subjects,id',
            'division_id' => 'required|exists:divisions,id',
            'lesson_title' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'page_number' => 'required|string|max:100',
            'homework' => 'required|string',
            'homework_page' => 'required|string|max:100',
        ]);

        $teacherId = auth()->id();

        FollowupBook::updateOrCreate(
            [
                'teacher_id' => $teacherId,
                'subject_id' => $request->subject_id,
                'division_id' => $request->division_id,
                'date' => $request->date,
            ],
            [
                'lesson_title' => $request->lesson_title,
                'notes' => $request->notes,
                'page_number' => $request->page_number,
                'homework' => $request->homework,
                'homework_page' => $request->homework_page,
                'upload_source' => 'dashboard',
                'uploaded_at' => now(), // Will update every time they edit, or we can use if missing
            ]
        );

        return back()->with('success', 'تم حفظ محتوى دفتر المتابعة بنجاح.');
    }
}
