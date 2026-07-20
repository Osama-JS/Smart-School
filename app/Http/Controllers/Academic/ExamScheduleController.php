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
        
        $schedulesQuery = ExamSchedule::with(['period.semester.academicYear']);
        
        if ($branchId) {
            $schedulesQuery->whereHas('period', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        
        $schedules = $schedulesQuery->latest()->get();
        
        $periodsQuery = ResultPeriod::with('semester.academicYear');
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

        $schedule = ExamSchedule::create($validated);

        return redirect()->route('academic.exam-schedules.show', $schedule->id)->with('success', 'تم إنشاء جدول الاختبار بنجاح. يمكنك الآن بناء الجدول.');
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

        return Inertia::render('Academic/ExamSchedules/Builder', [
            'examSchedule' => $examSchedule,
            'grades' => $grades,
            'subjects' => $subjects,
            'holidays' => $holidays,
            'teachers' => $teachers,
        ]);
    }

    public function updateItems(Request $request, ExamSchedule $examSchedule)
    {
        $branchId = auth()->user()->branch_id;
        if ($branchId && $examSchedule->period && $examSchedule->period->branch_id !== $branchId) {
            abort(403);
        }

        $validated = $request->validate([
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
                })
            ],
        ]);

        if (!empty($validated['items'])) {
            $this->checkForConflicts($validated['items'], $branchId, $examSchedule->id);
        }

        DB::transaction(function () use ($examSchedule, $validated) {
            $examSchedule->items()->delete();

            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $itemData) {
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
        });

        return redirect()->back()->with('success', 'تم حفظ الجدول بنجاح.');
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
                    if ($room1 && $room2 && $room1 === $room2) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'items' => ["القاعة ({$room1}) محجوزة لاختبارين متداخلين في نفس الوقت يوم {$date1}."]
                        ]);
                    }

                    $proctors2 = $item2['proctor_ids'] ?? [];
                    $sharedProctors = array_intersect($proctors1, $proctors2);
                    if (count($sharedProctors) > 0) {
                        $user = \App\Models\User::find(reset($sharedProctors));
                        $userName = $user ? $user->name : 'مراقب';
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'items' => ["المعلم ({$userName}) مكلف بمراقبة اختبارين متداخلين في نفس الوقت يوم {$date1}."]
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
                    if ($room1 && $room2 && $room1 === $room2) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'items' => ["القاعة ({$room1}) محجوزة لاختبار آخر متداخل في نفس الوقت يوم {$date1} في جدول مختلف."]
                        ]);
                    }

                    $existingProctorIds = $existingItem->proctors->pluck('id')->toArray();
                    $sharedProctors = array_intersect($proctors1, $existingProctorIds);
                    if (count($sharedProctors) > 0) {
                        $user = \App\Models\User::find(reset($sharedProctors));
                        $userName = $user ? $user->name : 'مراقب';
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'items' => ["المعلم ({$userName}) مكلف بمراقبة اختبار آخر متداخل في نفس الوقت يوم {$date1} في جدول مختلف."]
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
