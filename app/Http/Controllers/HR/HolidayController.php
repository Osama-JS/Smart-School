<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';
        
        $query = Holiday::with('branch');

        if (!$isAdmin) {
            $query->where(function($q) use ($user) {
                $q->whereNull('branch_id')->orWhere('branch_id', $user->branch_id);
            });
        }

        $holidays = $query->latest()->get();
        $branches = $isAdmin ? Branch::all() : [];

        return Inertia::render('HR/Holidays/Index', [
            'holidays' => $holidays,
            'branches' => $branches,
            'isAdmin' => $isAdmin
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'branch_id' => 'nullable|exists:branches,id',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';

        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        Holiday::create($validated);

        return redirect()->back()->with('success', 'تمت إضافة الإجازة الرسمية بنجاح.');
    }

    public function update(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'branch_id' => 'nullable|exists:branches,id',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';

        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        $holiday->update($validated);

        return redirect()->back()->with('success', 'تم تحديث الإجازة الرسمية بنجاح.');
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->delete();
        return redirect()->back()->with('success', 'تم حذف الإجازة الرسمية بنجاح.');
    }
}
