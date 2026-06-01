<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * عرض لوحة الحضور والانصراف اليومية
     */
    public function index(Request $request)
    {
        $date     = $request->get('date', Carbon::today()->toDateString());
        $branchId = $request->get('branch_id');
        $shiftId  = $request->get('shift_id');
        $search   = $request->get('search');

        // جلب سجلات الحضور للتاريخ المحدد
        $query = Attendance::with(['employee.department', 'branch', 'shift'])
            ->where('date', $date);

        if ($branchId) $query->where('branch_id', $branchId);
        if ($shiftId)  $query->where('shift_id', $shiftId);
        if ($search) {
            $query->whereHas('employee', fn($q) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('employee_number', 'like', "%{$search}%")
            );
        }

        $records = $query->paginate(20)->withQueryString();

        // إحصائيات اليوم
        $stats = Attendance::where('date', $date)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->selectRaw("
                COUNT(*) as total,
                SUM(status = 'present') as present,
                SUM(status = 'late') as late,
                SUM(status = 'absent') as absent,
                SUM(status = 'excused') as excused
            ")
            ->first();

        return Inertia::render('HR/Attendance/Index', [
            'records'   => $records,
            'stats'     => $stats,
            'branches'  => Branch::where('is_active', true)->select('id', 'name')->get(),
            'shifts'    => Shift::where('is_active', true)->select('id', 'name', 'start_time', 'end_time')->get(),
            'filters'   => $request->only(['date', 'branch_id', 'shift_id', 'search']),
            'today'     => $date,
        ]);
    }

    /**
     * تعديل سجل حضور يدوياً (للإدارة)
     */
    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'check_in'    => 'nullable|date_format:H:i',
            'check_out'   => 'nullable|date_format:H:i',
            'status'      => 'required|in:present,absent,late,excused',
            'late_minutes'=> 'nullable|integer|min:0',
        ]);

        $attendance->update($validated);

        return back()->with('success', 'تم تعديل سجل الحضور بنجاح');
    }

    /**
     * إضافة سجل حضور يدوياً
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'branch_id'   => 'nullable|exists:branches,id',
            'shift_id'    => 'nullable|exists:shifts,id',
            'date'        => 'required|date',
            'check_in'    => 'nullable|date_format:H:i',
            'check_out'   => 'nullable|date_format:H:i',
            'status'      => 'required|in:present,absent,late,excused',
            'late_minutes'=> 'nullable|integer|min:0',
        ]);

        Attendance::updateOrCreate(
            ['employee_id' => $validated['employee_id'], 'date' => $validated['date']],
            $validated
        );

        return back()->with('success', 'تم حفظ سجل الحضور بنجاح');
    }
}
