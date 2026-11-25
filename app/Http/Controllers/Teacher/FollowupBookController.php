<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\DailyPeriod;
use App\Models\Division;
use App\Models\FollowupBook;
use App\Models\LessonPreparation;
use App\Models\MasterTimetable;
use App\Models\Semester;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class FollowupBookController extends Controller
{
    private function findSuggestedPreparation(
        \Illuminate\Support\Collection $preps,
        int $subjectId,
        ?int $divisionId,
        ?int $gradeId,
        ?int $periodId,
        string $dateStr
    ): ?array {
        $candidates = $preps->filter(function (LessonPreparation $prep) use ($subjectId, $divisionId, $gradeId, $dateStr) {
            $prepDate = $prep->preparation_date instanceof Carbon
                ? $prep->preparation_date->format('Y-m-d')
                : substr((string) $prep->preparation_date, 0, 10);

            if ($prepDate !== $dateStr || (int) $prep->subject_id !== $subjectId) {
                return false;
            }

            if ($divisionId && $prep->division_id) {
                return (int) $prep->division_id === $divisionId;
            }

            return !$gradeId || (int) $prep->grade_id === $gradeId;
        });

        $match = $periodId
            ? ($candidates->first(fn (LessonPreparation $p) => (int) $p->period_id === $periodId) ?? $candidates->first())
            : $candidates->first();

        if (!$match) {
            return null;
        }

        return [
            'id' => $match->id,
            'lesson_title' => $match->lesson_title ?: '',
            'page_numbers' => $match->page_numbers ?: '',
            'homework' => $match->homework ?: '',
            'notes' => $match->notes ?: '',
        ];
    }

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
        $activeSemester = Semester::where('is_active', true)->first();

        $timetable = MasterTimetable::with(['subject', 'division.grade', 'period'])
            ->where('teacher_id', $teacherId)
            ->when($activeSemester, fn ($q) => $q->where('semester_id', $activeSemester->id))
            ->get();

        // Fetch followups and lesson preparations (for prefill suggestions) in this week
        $followups = FollowupBook::with(['reviewer:id,name', 'period:id,period_name'])
            ->where('teacher_id', $teacherId)
            ->whereBetween('date', [$startOfWeek->format('Y-m-d'), $endOfWeek->format('Y-m-d')])
            ->get();

        $preps = LessonPreparation::where('teacher_id', $teacherId)
            ->whereBetween('preparation_date', [$startOfWeek->format('Y-m-d'), $endOfWeek->format('Y-m-d')])
            ->orderByDesc('id')
            ->get();

        $days = [];
        $matchedFollowupIds = [];

        foreach ($period as $date) {
            $dayOfWeek = $date->format('l');
            $dateStr = $date->format('Y-m-d');
            $lessonsForDay = $timetable->filter(function ($item) use ($dayOfWeek) {
                return FollowupBook::matchesDayOfWeek($item->day_of_week, $dayOfWeek);
            })->unique(function ($item) {
                return $item->subject_id . '_' . $item->division_id . '_' . ($item->period_id ?? 0);
            })->sortBy(fn ($item) => $item->period?->start_time ?? '00:00');

            $dayData = [
                'date' => $dateStr,
                'day_name' => FollowupBook::arabicDayName($dayOfWeek),
                'lessons' => []
            ];

            foreach ($lessonsForDay as $lesson) {
                $followup = FollowupBook::findMatchingForLesson(
                    $followups,
                    (int) $lesson->subject_id,
                    (int) $lesson->division_id,
                    $dateStr,
                    $lesson->period_id ? (int) $lesson->period_id : null,
                    $matchedFollowupIds
                );
                if ($followup) {
                    $matchedFollowupIds[$followup->id] = true;
                }

                $hasFollowup = (bool) ($followup && $followup->uploaded_at);
                $suggestedPrep = $this->findSuggestedPreparation(
                    $preps,
                    (int) $lesson->subject_id,
                    (int) $lesson->division_id,
                    $lesson->division?->grade_id ? (int) $lesson->division->grade_id : null,
                    $lesson->period_id ? (int) $lesson->period_id : null,
                    $dateStr
                );

                $dayData['lessons'][] = [
                    'subject' => $lesson->subject,
                    'division' => $lesson->division,
                    'period' => $lesson->period ? [
                        'id' => $lesson->period->id,
                        'period_name' => $lesson->period->period_name,
                        'start_time' => $lesson->period->start_time,
                        'end_time' => $lesson->period->end_time,
                    ] : null,
                    'has_followup' => $hasFollowup,
                    'suggested_prep' => $suggestedPrep,
                    'followup' => $followup ? [
                        'id' => $followup->id,
                        'period_id' => $followup->period_id,
                        'lesson_title' => $followup->lesson_title,
                        'page_number' => $followup->page_number,
                        'homework' => $followup->homework,
                        'homework_page' => $followup->homework_page,
                        'notes' => $followup->notes,
                        'attachments' => $followup->formattedAttachments(),
                        'supervisor_rating' => $followup->supervisor_rating,
                        'supervisor_notes' => $followup->supervisor_notes,
                        'reviewer_name' => $followup->reviewer?->name,
                        'reviewed_at' => $followup->reviewed_at ? $followup->reviewed_at->format('Y-m-d H:i') : null,
                        'upload_source' => $followup->upload_source,
                        'uploaded_at' => $followup->uploaded_at ? $followup->uploaded_at->format('Y-m-d H:i') : null,
                    ] : null,
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
        $periodId = $request->query('period_id');

        $teacherId = auth()->id();

        if (!$date || !$subjectId || !$divisionId) {
            return redirect()->route('teacher.followup-books.index')->with('error', 'بيانات مفقودة');
        }

        $subject = Subject::find($subjectId);
        $division = Division::with('grade')->find($divisionId);
        $period = $periodId ? DailyPeriod::find($periodId) : null;

        $candidates = FollowupBook::with(['reviewer:id,name', 'period:id,period_name'])
            ->where('teacher_id', $teacherId)
            ->where('subject_id', $subjectId)
            ->where('division_id', $divisionId)
            ->whereDate('date', $date)
            ->get();

        $followup = FollowupBook::findMatchingForLesson(
            $candidates,
            (int) $subjectId,
            (int) $divisionId,
            substr((string) $date, 0, 10),
            $periodId ? (int) $periodId : null
        );

        $preps = LessonPreparation::where('teacher_id', $teacherId)
            ->where('subject_id', $subjectId)
            ->whereDate('preparation_date', $date)
            ->orderByDesc('id')
            ->get();

        $suggestedPrep = $this->findSuggestedPreparation(
            $preps,
            (int) $subjectId,
            (int) $divisionId,
            $division?->grade_id ? (int) $division->grade_id : null,
            $periodId ? (int) $periodId : null,
            substr((string) $date, 0, 10)
        );

        $followupPayload = $followup ? [
            'id' => $followup->id,
            'period_id' => $followup->period_id,
            'lesson_title' => $followup->lesson_title,
            'page_number' => $followup->page_number,
            'homework' => $followup->homework,
            'homework_page' => $followup->homework_page,
            'notes' => $followup->notes,
            'attachments' => $followup->formattedAttachments(),
            'supervisor_rating' => $followup->supervisor_rating,
            'supervisor_notes' => $followup->supervisor_notes,
            'reviewer_name' => $followup->reviewer?->name,
            'reviewed_at' => $followup->reviewed_at ? $followup->reviewed_at->format('Y-m-d H:i') : null,
            'uploaded_at' => $followup->uploaded_at ? $followup->uploaded_at->format('Y-m-d H:i') : null,
        ] : null;

        return Inertia::render('Teacher/FollowupBooks/Details', [
            'date' => $date,
            'subject' => $subject,
            'division' => $division,
            'period' => $period ? [
                'id' => $period->id,
                'period_name' => $period->period_name,
                'start_time' => $period->start_time,
                'end_time' => $period->end_time,
            ] : null,
            'followup' => $followupPayload,
            'suggestedPrep' => $suggestedPrep,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'subject_id' => 'required|exists:subjects,id',
            'division_id' => 'required|exists:divisions,id',
            'period_id' => 'nullable|exists:daily_periods,id',
            'lesson_title' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'page_number' => 'required|string|max:100',
            'homework' => 'required|string',
            'homework_page' => 'required|string|max:100',
            'existing_attachments' => 'nullable|array',
            'new_attachments' => 'nullable|array',
            'new_attachments.*' => 'file|max:20480|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,webp,zip',
        ]);

        $user = auth()->user();
        $teacherId = $user->id;
        $activeYearId = AcademicYear::where('is_active', true)->value('id');
        $periodId = !empty($validated['period_id']) ? (int) $validated['period_id'] : null;

        $existing = FollowupBook::where('teacher_id', $teacherId)
            ->where('subject_id', $validated['subject_id'])
            ->where('division_id', $validated['division_id'])
            ->whereDate('date', $validated['date'])
            ->when($periodId, fn ($q) => $q->where(fn ($sub) => $sub->where('period_id', $periodId)->orWhereNull('period_id')))
            ->first();

        $followup = $existing ?? new FollowupBook([
            'teacher_id' => $teacherId,
            'subject_id' => $validated['subject_id'],
            'division_id' => $validated['division_id'],
            'date' => $validated['date'],
        ]);

        $followup->fill([
            'branch_id' => $user->branch_id,
            'academic_year_id' => $activeYearId,
            'period_id' => $periodId ?? $followup->period_id,
            'lesson_title' => $validated['lesson_title'],
            'notes' => $validated['notes'] ?? null,
            'page_number' => $validated['page_number'],
            'homework' => $validated['homework'],
            'homework_page' => $validated['homework_page'],
            'upload_source' => 'dashboard',
            'uploaded_at' => $existing?->uploaded_at ?? now(),
        ]);

        $followup->attachments = $followup->syncAttachmentsFromRequest($request, (bool) $existing);
        $followup->save();

        if (!empty($followup->homework)) {
            app(\App\Services\AutomaticNotificationService::class)->notifyFollowupHomeworkPublished($followup);
        }

        return back()->with('success', 'تم حفظ محتوى دفتر المتابعة بنجاح.');
    }
}
