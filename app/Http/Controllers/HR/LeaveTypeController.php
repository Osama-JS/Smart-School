<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveTypeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $types = LeaveType::where('branch_id', $user->branch_id)->latest()->get();
        
        return Inertia::render('HR/Leaves/Types', [
            'leaveTypes' => $types
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'default_days' => 'required|integer|min:0',
        ]);

        LeaveType::create([
            'branch_id' => $request->user()->branch_id,
            'name' => $request->name,
            'default_days' => $request->default_days,
        ]);

        return back()->with('success', 'تم إضافة نوع الإجازة بنجاح.');
    }

    public function update(Request $request, LeaveType $leave_type)
    {
        if ($leave_type->branch_id !== $request->user()->branch_id) abort(403);

        $request->validate([
            'name' => 'required|string|max:255',
            'default_days' => 'required|integer|min:0',
        ]);

        $leave_type->update($request->only(['name', 'default_days']));
        return back()->with('success', 'تم تعديل نوع الإجازة بنجاح.');
    }

    public function destroy(Request $request, LeaveType $leave_type)
    {
        if ($leave_type->branch_id !== $request->user()->branch_id) abort(403);
        $leave_type->delete();
        return back()->with('success', 'تم حذف نوع الإجازة بنجاح.');
    }
}
