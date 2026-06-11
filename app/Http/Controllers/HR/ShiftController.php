<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::query()->with('branch')->withCount('employees');

        // Apply filters
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('min_grace')) {
            $query->where('grace_period_minutes', '>=', (int)$request->min_grace);
        }

        if ($request->filled('max_grace')) {
            $query->where('grace_period_minutes', '<=', (int)$request->max_grace);
        }

        // Apply sorting
        $sort = $request->input('sort', 'name_asc');
        switch ($sort) {
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'start_time_asc':
                $query->orderBy('start_time', 'asc');
                break;
            case 'start_time_desc':
                $query->orderBy('start_time', 'desc');
                break;
            case 'employees_count_asc':
                $query->orderBy('employees_count', 'asc');
                break;
            case 'employees_count_desc':
                $query->orderBy('employees_count', 'desc');
                break;
            case 'grace_period_asc':
                $query->orderBy('grace_period_minutes', 'asc');
                break;
            case 'grace_period_desc':
                $query->orderBy('grace_period_minutes', 'desc');
                break;
            case 'name_asc':
            default:
                $query->orderBy('name', 'asc');
                break;
        }

        $shifts = $query->paginate(12)->withQueryString();

        // Calculate Stats
        $total_shifts = Shift::count();
        $active_shifts = Shift::where('is_active', true)->count();
        $avg_grace = round(Shift::avg('grace_period_minutes') ?? 0, 1);
        
        // Count distinct employees assigned to any shift
        $total_assigned_employees = DB::table('branch_employee_shift')
            ->distinct()
            ->count('employee_id');

        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);
        $branches = $isAdmin ? \App\Models\Branch::select('id', 'name')->get() : [];

        return Inertia::render('HR/Shifts/Index', [
            'shifts'  => $shifts,
            'filters' => (object) $request->only(['search', 'status', 'branch_id', 'min_grace', 'max_grace', 'sort']),
            'stats'   => [
                'total_shifts' => $total_shifts,
                'active_shifts' => $active_shifts,
                'avg_grace' => $avg_grace,
                'total_assigned_employees' => $total_assigned_employees,
            ],
            'branches' => $branches,
            'isAdmin' => $isAdmin,
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
            'branch_id'            => 'nullable|exists:branches,id',
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
            'branch_id'            => 'nullable|exists:branches,id',
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
