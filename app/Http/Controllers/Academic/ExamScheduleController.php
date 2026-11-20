<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\ExamSchedule;
use App\Models\ExamScheduleItem;
use App\Models\ResultPeriod;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\Holiday;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ExamScheduleController extends Controller
{
    public function index()
    {
        $branchId = auth()->user()->branch_id;
        
        $schedulesQuery = ExamSchedule::with(['period.semester.academicYear', 'publisher:id,name'])
            ->withCount('items');
        
        if ($branchId) {
            $schedulesQuery->whereHas('period', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        
        $schedules = $schedulesQuery->latest()->get();
        
        $periodsQuery = ResultPeriod::with('semester.academicYear')
            ->where('period_type', 'exam');
        if ($branchId) {
            $periodsQuery->where('branch_id', $branchId);
        }
        $periods = $periodsQuery->get();

        return Inertia::render('Academic/ExamSchedules/Index', [
            'schedules' => $schedules,
            'periods' => $periods,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'period_id' => 'required|exists:result_periods,id',
            'title' => 'required|string|max:255',
            'details' => 'nullable|string',
        ]);

        $validated['status'] = 'draft';
        $schedule = ExamSchedule::create($validated);

        return redirect()->route('academic.exam-schedules.show', $schedule->id)->with('success', 'تم إنشاء جدول الاختبار كمسودة بنجاح. يمكنك الآن بناء الجدول.');
    }

    public function update(Request $request, ExamSchedule $examSchedule)
    {
        $validated = $request->validate([
            'period_id' => 'required|exists:result_periods,id',
            'title' => 'required|string|max:255',
            'details' => 'nullable|string',
        ]);

        $examSchedule->update($validated);

        return redirect()->back()->with('success', 'تم تحديث بيانات الجدول بنجاح.');
    }

    public function show(ExamSchedule $examSchedule)
    {
        $branchId = auth()->user()->branch_id;
        
        // Ensure user can access this schedule
        if ($branchId && $examSchedule->period && $examSchedule->period->branch_id !== $branchId) {
            abort(403);
        }

        $examSchedule->load(['period.semester.academicYear', 'items.division.grade', 'items.subject', 'items.proctors']);

        $gradesQuery = Grade::with(['divisions', 'subjects', 'section']);
        if ($branchId) {
            $gradesQuery->where('branch_id', $branchId);
        }
        $grades = $gradesQuery->get();

        $subjectsQuery = Subject::query();
        if ($branchId) {
            $subjectsQuery->where('branch_id', $branchId);
        }
        $subjects = $subjectsQuery->get(['id', 'name']);

        $holidaysQuery = Holiday::query();
        if ($branchId) {
            $holidaysQuery->where('branch_id', $branchId);
        }
        $holidays = $holidaysQuery->get(['id', 'name', 'start_date', 'end_date', 'notes']);

        $teachersQuery = User::whereHas('role', function($q) {
            $q->where('name', 'معلم');
        });
        if ($branchId) {
            $teachersQuery->where('branch_id', $branchId);
        }
        $teachers = $teachersQuery->get(['id', 'name']);

        $previousSchedulesQuery = ExamSchedule::with(['period.semester.academicYear', 'items.division.grade', 'items.subject', 'items.proctors'])
            ->where('id', '!=', $examSchedule->id)
            ->has('items')
            ->latest()
            ->limit(20);
        if ($branchId) {
            $previousSchedulesQuery->whereHas('period', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $previousSchedules = $previousSchedulesQuery->get();

        return Inertia::render('Academic/ExamSchedules/Builder', [
            'examSchedule' => $examSchedule,
            'grades' => $grades,
            'subjects' => $subjects,
            'holidays' => $holidays,
            'teachers' => $teachers,
            'previousSchedules' => $previousSchedules,
        ]);
    }

    public function updateItems(Request $request, ExamSchedule $examSchedule)
    {
        $branchId = auth()->user()->branch_id;
        if ($branchId && $examSchedule->period && $examSchedule->period->branch_id !== $branchId) {
            abort(403);
        }

        $validated = $this->validateItemsPayload($request, $branchId);

        $shouldPublish = $request->boolean('publish');
        if ($shouldPublish && empty($validated['items'])) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'items' => ['لا يمكن اعتماد ونشر جدول فارغ. يرجى إضافة اختبار واحد على الأقل أولاً.'],
            ]);
        }

        if (!empty($validated['items'])) {
            $this->checkForConflicts($validated['items'], $branchId, $examSchedule->id);
        }

        DB::transaction(function () use ($examSchedule, $validated, $shouldPublish) {
            $this->persistItems($examSchedule, $validated['items'] ?? []);

            if ($shouldPublish) {
                $examSchedule->update([
                    'status' => 'published',
                    'published_at' => now(),
                    'published_by' => auth()->id(),
                ]);
            }
        });

        if ($shouldPublish) {
            $counts = app(\App\Services\AutomaticNotificationService::class)
                ->notifyExamSchedulePublished($examSchedule->fresh(), auth()->id());

            return redirect()->back()->with(
                'success',
                "تم اعتماد ونشر الجدول بنجاح وإرسال إشعارات فورية لـ {$counts['students']} طالب و {$counts['parents']} ولي أمر و {$counts['teachers']} معلم."
            );
        }

        return redirect()->back()->with('success', 'تم حفظ الجدول بنجاح.');
    }

    public function importItems(Request $request, ExamSchedule $examSchedule)
    {
        $branchId = auth()->user()->branch_id;
        if ($branchId && $examSchedule->period && $examSchedule->period->branch_id !== $branchId) {
            abort(403);
        }

        $validated = $this->validateItemsPayload($request, $branchId, [
            'mode' => 'required|in:merge,replace',
            'items' => 'required|array|min:1',
        ]);

        $incomingItems = array_map(function ($itemData) {
            $itemData['exam_date'] = \Carbon\Carbon::parse($itemData['exam_date'])->format('Y-m-d');
            $itemData['start_time'] = !empty($itemData['start_time']) ? substr($itemData['start_time'], 0, 5) : null;
            $itemData['end_time'] = !empty($itemData['end_time']) ? substr($itemData['end_time'], 0, 5) : null;
            return $itemData;
        }, $validated['items']);

        if ($validated['mode'] === 'replace') {
            $finalItems = $incomingItems;
        } else {
            $mergedMap = [];
            $existingItems = $examSchedule->items()->with('proctors')->get();
            foreach ($existingItems as $existing) {
                $dateKey = $existing->exam_date ? $existing->exam_date->format('Y-m-d') : '';
                $key = "{$existing->division_id}_{$existing->subject_id}_{$dateKey}";
                $mergedMap[$key] = [
                    'division_id' => $existing->division_id,
                    'subject_id'  => $existing->subject_id,
                    'exam_date'   => $dateKey,
                    'start_time'  => $existing->start_time ? substr($existing->start_time, 0, 5) : null,
                    'end_time'    => $existing->end_time ? substr($existing->end_time, 0, 5) : null,
                    'room'        => $existing->room,
                    'syllabus'    => $existing->syllabus ?? '',
                    'proctor_ids' => $existing->proctors->pluck('id')->all(),
                ];
            }

            foreach ($incomingItems as $incoming) {
                $key = "{$incoming['division_id']}_{$incoming['subject_id']}_{$incoming['exam_date']}";
                $mergedMap[$key] = $incoming;
            }

            $finalItems = array_values($mergedMap);
        }

        if (!empty($finalItems)) {
            $this->checkForConflicts($finalItems, $branchId, $examSchedule->id);
        }

        DB::transaction(function () use ($examSchedule, $finalItems) {
            $this->persistItems($examSchedule, $finalItems);
        });

        return redirect()->back()->with(
            'success',
            'تم استيراد ' . count($validated['items']) . ' اختبار بنجاح وحفظ الجدول.'
        );
    }

    private function validateItemsPayload(Request $request, ?int $branchId, array $extraRules = []): array
    {
        $rules = array_merge([
            'items' => 'array',
            'items.*.division_id' => 'required|exists:divisions,id',
            'items.*.subject_id' => 'required|exists:subjects,id',
            'items.*.exam_date' => 'required|date',
            'items.*.start_time' => 'nullable|date_format:H:i',
            'items.*.end_time' => 'nullable|date_format:H:i|after:items.*.start_time',
            'items.*.room' => 'nullable|string|max:255',
            'items.*.syllabus' => 'nullable|string',
            'items.*.proctor_ids' => 'nullable|array',
            'items.*.proctor_ids.*' => [
                'required',
                \Illuminate\Validation\Rule::exists('users', 'id')->where(function ($query) use ($branchId) {
                    if ($branchId) {
                        $query->where('branch_id', $branchId);
                    }
                }),
            ],
        ], $extraRules);

        return $request->validate($rules);
    }

    private function persistItems(ExamSchedule $examSchedule, array $items): void
    {
        $examSchedule->items()->delete();

        foreach ($items as $itemData) {
            $item = ExamScheduleItem::create([
                'schedule_id' => $examSchedule->id,
                'division_id' => $itemData['division_id'],
                'subject_id'  => $itemData['subject_id'],
                'exam_date'   => $itemData['exam_date'],
                'start_time'  => $itemData['start_time'] ?? null,
                'end_time'    => $itemData['end_time'] ?? null,
                'room'        => $itemData['room'] ?? null,
                'syllabus'    => $itemData['syllabus'] ?? '',
            ]);

            if (!empty($itemData['proctor_ids'])) {
                $item->proctors()->attach($itemData['proctor_ids']);
            }
        }
    }

    public function publish(ExamSchedule $examSchedule)
    {
        $branchId = auth()->user()->branch_id;
        if ($branchId && $examSchedule->period && $examSchedule->period->branch_id !== $branchId) {
            abort(403);
        }

        if ($examSchedule->items()->count() === 0) {
            return redirect()->back()->with('error', 'لا يمكن اعتماد ونشر جدول فارغ. يرجى إضافة اختبار واحد على الأقل.');
        }

        $examSchedule->update([
            'status' => 'published',
            'published_at' => now(),
            'published_by' => auth()->id(),
        ]);

        $counts = app(\App\Services\AutomaticNotificationService::class)
            ->notifyExamSchedulePublished($examSchedule->fresh(), auth()->id());

        return redirect()->back()->with(
            'success',
            "تم اعتماد ونشر الجدول بنجاح وإرسال إشعارات فورية لـ {$counts['students']} طالب و {$counts['parents']} ولي أمر و {$counts['teachers']} معلم."
        );
    }

    public function updateStatus(Request $request, ExamSchedule $examSchedule)
    {
        $branchId = auth()->user()->branch_id;
        if ($branchId && $examSchedule->period && $examSchedule->period->branch_id !== $branchId) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:draft,published,archived',
        ]);

        if ($validated['status'] === 'published') {
            return $this->publish($examSchedule);
        }

        $examSchedule->update(['status' => $validated['status']]);

        $label = $validated['status'] === 'archived' ? 'أرشفة الجدول' : 'إعادة الجدول إلى مسودة';
        return redirect()->back()->with('success', "تم {$label} بنجاح.");
    }

    private function checkForConflicts(array $items, $branchId, $examScheduleId)
    {
        // 1. Check internally within the incoming items
        foreach ($items as $i => $item1) {
            $start1 = $item1['start_time'] ?? null;
            $end1 = $item1['end_time'] ?? null;
            $room1 = $item1['room'] ?? null;
            $proctors1 = $item1['proctor_ids'] ?? [];
            $date1 = $item1['exam_date'] ?? null;

            if (!$start1 || !$end1 || !$date1) continue;

            foreach ($items as $j => $item2) {
                if ($i >= $j) continue;

                $start2 = $item2['start_time'] ?? null;
                $end2 = $item2['end_time'] ?? null;
                $date2 = $item2['exam_date'] ?? null;
                
                if (!$start2 || !$end2 || $date1 !== $date2) continue;

                if ($start1 < $end2 && $start2 < $end1) {
                    $room2 = $item2['room'] ?? null;
                    
                    // We removed the strict 'same room' validation here 
                    // because schools often combine multiple classes in large halls.

                    $proctors2 = $item2['proctor_ids'] ?? [];
                    $sharedProctors = array_intersect($proctors1, $proctors2);
                    
                    // If they share a proctor, it's only an error if they are in DIFFERENT specified rooms.
                    // If they are in the SAME room, or room is not specified yet, we allow it.
                    if (count($sharedProctors) > 0 && $room1 && $room2 && $room1 !== $room2) {
                        $user = \App\Models\User::find(reset($sharedProctors));
                        $userName = $user ? $user->name : 'مراقب';
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'items' => ["المعلم ({$userName}) مكلف بمراقبة اختبارين في قاعتين مختلفتين ({$room1} و {$room2}) في نفس الوقت يوم {$date1}."]
                        ]);
                    }
                }
            }
        }

        // 2. Check externally with DB (other schedules in the same branch)
        $dates = array_unique(array_column($items, 'exam_date'));
        if (empty($dates)) return;
        
        $existingItems = ExamScheduleItem::whereIn('exam_date', $dates)
            ->where('schedule_id', '!=', $examScheduleId)
            ->whereHas('schedule.period', function ($q) use ($branchId) {
                if ($branchId) {
                    $q->where('branch_id', $branchId);
                }
            })
            ->with('proctors')
            ->get();

        if ($existingItems->isEmpty()) return;

        foreach ($items as $item1) {
            $start1 = $item1['start_time'] ?? null;
            $end1 = $item1['end_time'] ?? null;
            $date1 = $item1['exam_date'] ?? null;
            $room1 = $item1['room'] ?? null;
            $proctors1 = $item1['proctor_ids'] ?? [];

            if (!$start1 || !$end1 || !$date1) continue;

            foreach ($existingItems as $existingItem) {
                if ($existingItem->exam_date->format('Y-m-d') !== $date1) continue;

                $start2 = $existingItem->start_time;
                $end2 = $existingItem->end_time;
                
                if (!$start2 || !$end2) continue;

                $start2 = substr($start2, 0, 5);
                $end2 = substr($end2, 0, 5);

                if ($start1 < $end2 && $start2 < $end1) {
                    $room2 = $existingItem->room;
                    
                    // We removed the strict 'same room' validation here 
                    // because schools often combine multiple classes in large halls.

                    $existingProctorIds = $existingItem->proctors->pluck('id')->toArray();
                    $sharedProctors = array_intersect($proctors1, $existingProctorIds);
                    
                    // If they share a proctor, it's only an error if they are in DIFFERENT specified rooms.
                    // If they are in the SAME room, or room is not specified yet, we allow it.
                    if (count($sharedProctors) > 0 && $room1 && $room2 && $room1 !== $room2) {
                        $user = \App\Models\User::find(reset($sharedProctors));
                        $userName = $user ? $user->name : 'مراقب';
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'items' => ["المعلم ({$userName}) مكلف بمراقبة اختبار آخر في قاعة مختلفة ({$room2}) في نفس الوقت يوم {$date1} في جدول مختلف."]
                        ]);
                    }
                }
            }
        }
    }

    public function printSchedule(ExamSchedule $examSchedule)
    {
        $branchId = auth()->user()->branch_id;
        
        if ($branchId && $examSchedule->period && $examSchedule->period->branch_id !== $branchId) {
            abort(403);
        }

        $examSchedule->load(['period.semester.academicYear', 'items.division.grade', 'items.subject', 'items.proctors']);

        $gradesQuery = Grade::with(['divisions', 'section']);
        if ($branchId) {
            $gradesQuery->where('branch_id', $branchId);
        }
        if (request()->has('section_id')) {
            $gradesQuery->where('section_id', request('section_id'));
        }
        if (request()->has('stage') && request('stage') !== 'كل المراحل') {
            $gradesQuery->whereHas('section', function ($q) {
                $q->where('name', request('stage'));
            });
        }
        $grades = $gradesQuery->get();

        return Inertia::render('Academic/ExamSchedules/PrintSchedule', [
            'examSchedule' => $examSchedule,
            'grades' => $grades,
            'settings' => [
                'showProctors' => request('proctors', '1') === '1',
                'showRooms'    => request('rooms', '1') === '1',
                'showSyllabus' => request('syllabus', '0') === '1',
                'showTimes'    => request('times', '1') === '1',
            ],
        ]);
    }

    public function destroy(ExamSchedule $examSchedule)
    {
        $branchId = auth()->user()->branch_id;
        if ($branchId && $examSchedule->period && $examSchedule->period->branch_id !== $branchId) {
            abort(403);
        }

        $examSchedule->delete();

        return redirect()->route('academic.exam-schedules.index')->with('success', 'تم حذف الجدول بنجاح.');
    }
}
