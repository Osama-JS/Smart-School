<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\Branch;
use App\Models\AcademicYear;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير النظام', 'Admin']);
        
        $query = Holiday::with(['branch', 'academicYear', 'semester']);

        $userBranchId = session('branch_id') ?? ($user ? $user->branch_id : null);

        if (!$isAdmin) {
            $query->where(function($q) use ($userBranchId) {
                $q->whereNull('branch_id')->orWhere('branch_id', $userBranchId);
            });
        } elseif ($userBranchId) {
            $query->where(function($q) use ($userBranchId) {
                $q->whereNull('branch_id')->orWhere('branch_id', $userBranchId);
            });
        }

        $filters = $request->only(['search', 'academic_year_id']);

        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }
        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        $holidays = $query->latest()->get();
        $branches = $isAdmin ? Branch::where('is_active', true)->get() : [];
        $academicYears = AcademicYear::with('semesters')
            ->when($userBranchId, function($q) use ($userBranchId) {
                $q->where('branch_id', $userBranchId);
            })
            ->get();

        return Inertia::render('HR/Holidays/Index', [
            'holidays' => $holidays,
            'branches' => $branches,
            'academicYears' => $academicYears,
            'isAdmin' => $isAdmin,
            'filters' => $filters
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'branch_id' => 'nullable|exists:branches,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير النظام', 'Admin']);

        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        $holiday = Holiday::create($validated);

        // Sync existing attendance records for these dates
        Attendance::whereBetween('date', [$holiday->start_date, $holiday->end_date])
            ->when($holiday->branch_id, fn($q) => $q->where('branch_id', $holiday->branch_id))
            ->where('status', 'absent')
            ->update(['status' => 'holiday']);

        return redirect()->back()->with('success', 'تمت إضافة الإجازة الرسمية بنجاح.');
    }

    public function update(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'branch_id' => 'nullable|exists:branches,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير النظام', 'Admin']);

        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        // Restore old holiday dates to absent before updating
        Attendance::whereBetween('date', [$holiday->start_date, $holiday->end_date])
            ->when($holiday->branch_id, fn($q) => $q->where('branch_id', $holiday->branch_id))
            ->where('status', 'holiday')
            ->update(['status' => 'absent']);

        $holiday->update($validated);

        // Apply new holiday dates
        Attendance::whereBetween('date', [$holiday->start_date, $holiday->end_date])
            ->when($holiday->branch_id, fn($q) => $q->where('branch_id', $holiday->branch_id))
            ->where('status', 'absent')
            ->update(['status' => 'holiday']);

        return redirect()->back()->with('success', 'تم تحديث الإجازة الرسمية بنجاح.');
    }

    public function destroy(Holiday $holiday)
    {
        // Restore holiday dates to absent before deleting
        Attendance::whereBetween('date', [$holiday->start_date, $holiday->end_date])
            ->when($holiday->branch_id, fn($q) => $q->where('branch_id', $holiday->branch_id))
            ->where('status', 'holiday')
            ->update(['status' => 'absent']);

        $holiday->delete();
        return redirect()->back()->with('success', 'تم حذف الإجازة الرسمية بنجاح.');
    }
}
