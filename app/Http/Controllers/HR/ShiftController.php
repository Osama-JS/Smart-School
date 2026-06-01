<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::query();

        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $shifts = $query->paginate(10)->withQueryString();

        return Inertia::render('HR/Shifts/Index', [
            'shifts'  => $shifts,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'start_time'           => 'required',
            'end_time'             => 'required',
            'grace_period_minutes' => 'required|integer|min:0',
            'is_active'            => 'boolean',
        ]);

        Shift::create($validated);

        return redirect()->route('hr.shifts')->with('success', 'تمت إضافة الشفت بنجاح');
    }

    public function update(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'start_time'           => 'required',
            'end_time'             => 'required',
            'grace_period_minutes' => 'required|integer|min:0',
            'is_active'            => 'boolean',
        ]);

        $shift->update($validated);

        return redirect()->route('hr.shifts')->with('success', 'تم تعديل الشفت بنجاح');
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();
        return redirect()->route('hr.shifts')->with('success', 'تم حذف الشفت بنجاح');
    }
}
