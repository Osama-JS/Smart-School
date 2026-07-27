<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\DailyPeriod;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DailyPeriodController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الجداول الدراسية', only: ['index']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة جدول دراسي', only: ['store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل جدول دراسي', only: ['update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف جدول دراسي', only: ['destroy']),
        ];
    }
    public function index()
    {
        $branchId = auth()->user()->branch_id;
        
        $groups = \App\Models\TimetableGroup::with('grades.section')
            ->where('branch_id', $branchId)
            ->get();

        $periods = DailyPeriod::with('group.grades.section')
            ->where('branch_id', $branchId)
            ->orderBy('start_time')
            ->get();
            
        $sections = Section::with(['grades' => function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        }])->where('branch_id', $branchId)->get();

        return Inertia::render('Academic/Timetables/Periods', compact('groups', 'periods', 'sections'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'period_name'        => 'required|string|max:255',
            'start_time'         => 'required|date_format:H:i',
            'end_time'           => 'required|date_format:H:i|after:start_time',
            'timetable_group_id' => 'required|exists:timetable_groups,id',
            'is_break'           => 'boolean',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;

        $period = DailyPeriod::create($validated);

        return redirect()->back()->with('success', 'تم إضافة الحصة بنجاح.');
    }

    public function update(Request $request, DailyPeriod $period)
    {
        $validated = $request->validate([
            'period_name'        => 'required|string|max:255',
            'start_time'         => 'required|date_format:H:i',
            'end_time'           => 'required|date_format:H:i|after:start_time',
            'timetable_group_id' => 'required|exists:timetable_groups,id',
            'is_break'           => 'boolean',
        ]);

        $period->update($validated);

        return redirect()->back()->with('success', 'تم تحديث الحصة بنجاح.');
    }

    public function destroy(DailyPeriod $period)
    {
        $period->delete();
        return redirect()->back()->with('success', 'تم حذف الحصة بنجاح.');
    }
}
