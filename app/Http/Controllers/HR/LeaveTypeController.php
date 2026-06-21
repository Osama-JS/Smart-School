<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveTypeController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الإجازات والعطلات', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة إجازة أو عطلة', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل إجازة أو عطلة', only: ['edit', 'update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف إجازة أو عطلة', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $user = $request->user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $branchId = $user->branch_id ?? session('branch_id');

        if ($isSystemAdmin && $request->filled('branch_id')) {
            $branchId = $request->branch_id;
        }

        $query = LeaveType::query()->with('branch');
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $types = $query->latest()->get();
        
        return Inertia::render('HR/Leaves/Types', [
            'leaveTypes' => $types,
            'isSystemAdmin' => $isSystemAdmin,
            'branches' => $isSystemAdmin ? \App\Models\Branch::where('is_active', true)->select('id', 'name')->get() : [],
            'filters' => $request->only(['branch_id']),
            'currentBranchId' => $branchId
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';

        $request->validate([
            'name' => 'required|string|max:255',
            'default_days' => 'required|integer|min:0',
            'branch_id' => $isSystemAdmin ? 'nullable|exists:branches,id' : 'nullable'
        ]);

        $branchId = $user->branch_id ?? session('branch_id');
        if ($isSystemAdmin && $request->filled('branch_id')) {
            $branchId = $request->branch_id;
        }

        LeaveType::create([
            'branch_id' => $branchId,
            'name' => $request->name,
            'default_days' => $request->default_days,
        ]);

        return back()->with('success', 'تم إضافة نوع الإجازة بنجاح.');
    }

    public function update(Request $request, LeaveType $leave_type)
    {
        $user = $request->user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $userBranchId = $user->branch_id ?? session('branch_id');

        if (!$isSystemAdmin && $leave_type->branch_id !== $userBranchId) abort(403);

        $request->validate([
            'name' => 'required|string|max:255',
            'default_days' => 'required|integer|min:0',
        ]);

        $leave_type->update($request->only(['name', 'default_days']));
        return back()->with('success', 'تم تعديل نوع الإجازة بنجاح.');
    }

    public function destroy(Request $request, LeaveType $leave_type)
    {
        $user = $request->user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $userBranchId = $user->branch_id ?? session('branch_id');

        if (!$isSystemAdmin && $leave_type->branch_id !== $userBranchId) abort(403);

        $hasLeaves = \App\Models\Leave::where('leave_type_id', $leave_type->id)->exists();
        $hasBalances = \App\Models\LeaveBalance::where('leave_type_id', $leave_type->id)->exists();

        if ($hasLeaves || $hasBalances) {
            return back()->with('error', 'لا يمكن حذف هذا النوع من الإجازات لارتباطه بسجلات إجازات أو أرصدة لموظفين.');
        }

        $leave_type->delete();
        return back()->with('success', 'تم حذف نوع الإجازة بنجاح.');
    }
}
