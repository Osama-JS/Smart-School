<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\DailyPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DailyPeriodController extends Controller
{
    public function index()
    {
        $branchId = auth()->user()->branch_id;
        $periods = DailyPeriod::where('branch_id', $branchId)->orderBy('start_time')->get();
        return Inertia::render('Academic/Timetables/Periods', compact('periods'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'period_name' => 'required|string|max:255',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;

        DailyPeriod::create($validated);

        return redirect()->back()->with('success', 'تم إضافة الحصة بنجاح.');
    }

    public function update(Request $request, DailyPeriod $period)
    {
        $validated = $request->validate([
            'period_name' => 'required|string|max:255',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
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
