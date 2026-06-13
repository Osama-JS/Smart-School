<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';
        
        $query = Leave::with('employee');

        if (!$isAdmin) {
            $query->whereHas('employee.user', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }

        $leaves = $query->latest()->get();
        
        $employeesQuery = Employee::query();
        if (!$isAdmin) {
            $employeesQuery->whereHas('user', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }
        $employees = $employeesQuery->get(['id', 'first_name', 'last_name']);

        return Inertia::render('HR/Leaves/Index', [
            'leaves' => $leaves,
            'employees' => $employees,
            'isAdmin' => $isAdmin
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'type' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:pending,approved,rejected',
            'reason' => 'nullable|string',
        ]);

        Leave::create($validated);

        return redirect()->back()->with('success', 'تمت إضافة إجازة الموظف بنجاح.');
    }

    public function update(Request $request, Leave $leave)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'type' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:pending,approved,rejected',
            'reason' => 'nullable|string',
        ]);

        $leave->update($validated);

        return redirect()->back()->with('success', 'تم تحديث إجازة الموظف بنجاح.');
    }

    public function destroy(Leave $leave)
    {
        $leave->delete();
        return redirect()->back()->with('success', 'تم حذف إجازة الموظف بنجاح.');
    }
}
