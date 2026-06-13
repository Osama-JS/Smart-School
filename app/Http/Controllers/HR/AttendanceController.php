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
     * صفحة التقرير المتقدم للحضور والانصراف (شهري للموظف)
     */
    public function report(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';
        
        $employeesQuery = Employee::query();
        if (!$isAdmin) {
            $employeesQuery->whereHas('user', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }
        $employees = $employeesQuery->get(['id', 'first_name', 'last_name', 'employee_number']);

        return Inertia::render('HR/Attendance/Report', [
            'employees' => $employees,
            'isAdmin' => $isAdmin
        ]);
    }
    /**
     * عرض لوحة الحضور والانصراف اليومية
     */
    public function index(Request $request)
    {
        $startDate    = $request->get('start_date', $request->get('date', Carbon::today()->toDateString()));
        $endDate      = $request->get('end_date', $request->get('date', Carbon::today()->toDateString()));
        $branchId     = $request->get('branch_id');
        $shiftId      = $request->get('shift_id');
        $departmentId = $request->get('department_id');
        $status       = $request->get('status');
        $search       = $request->get('search');
        $sortBy       = $request->get('sort_by', 'created_at');
        $sortDir      = $request->get('sort_dir', 'desc');

        // جلب سجلات الحضور لنطاق التواريخ المحدد
        $query = Attendance::with(['employee.department', 'branch', 'shift'])
            ->whereBetween('date', [$startDate, $endDate]);

        if ($branchId) $query->where('branch_id', $branchId);
        if ($shiftId)  $query->where('shift_id', $shiftId);
        if ($status)   $query->where('status', $status);
        if ($departmentId) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $departmentId));
        }

        if ($search) {
            $query->whereHas('employee', fn($q) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('employee_number', 'like', "%{$search}%")
            );
        }

        // الترتيب والفرز
        if ($sortBy === 'name') {
            $query->join('employees', 'attendances.employee_id', '=', 'employees.id')
                  ->orderBy('employees.name', $sortDir)
                  ->select('attendances.*');
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $records = $query->paginate(20)->withQueryString();

        // جلب وتعبئة سجل حضور الـ 30 يوماً للموظفين المعروضين بالصفحة الحالية
        $employeeIds = $records->pluck('employee_id')->unique();
        $historyEndDate = Carbon::parse($endDate);
        $historyStartDate = $historyEndDate->copy()->subDays(29);

        $historyRaw = Attendance::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$historyStartDate->toDateString(), $historyEndDate->toDateString()])
            ->select('employee_id', 'date', 'status')
            ->get()
            ->groupBy('employee_id');

        $records->getCollection()->transform(function ($attendance) use ($historyRaw, $historyStartDate, $historyEndDate) {
            $empHistory = $historyRaw->get($attendance->employee_id, collect());
            
            $historyList = [];
            $start = $historyStartDate->copy();
            for ($i = 0; $i < 30; $i++) {
                $dayStr = $start->copy()->addDays($i)->toDateString();
                $dayRecord = $empHistory->firstWhere('date', $dayStr);
                $historyList[] = [
                    'date'   => $dayStr,
                    'status' => $dayRecord ? $dayRecord->status : 'none'
                ];
            }
            $attendance->employee_history = $historyList;
            return $attendance;
        });

        // إحصائيات نطاق التاريخ المختار
        $stats = Attendance::whereBetween('date', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($shiftId, fn($q) => $q->where('shift_id', $shiftId))
            ->when($departmentId, fn($q) => $q->whereHas('employee', fn($eq) => $eq->where('department_id', $departmentId)))
            ->selectRaw("
                COUNT(*) as total,
                SUM(status = 'present') as present,
                SUM(status = 'late') as late,
                SUM(status = 'absent') as absent,
                SUM(status = 'excused') as excused
            ")
            ->first();

        // اتجاهات الحضور لآخر 7 أيام لـ Sparklines (المنتهية في تاريخ النهاية المحدد)
        $trendEndDate = Carbon::parse($endDate);
        $trendStartDate = $trendEndDate->copy()->subDays(6);

        $trendRaw = Attendance::whereBetween('date', [$trendStartDate->toDateString(), $trendEndDate->toDateString()])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($shiftId, fn($q) => $q->where('shift_id', $shiftId))
            ->when($departmentId, fn($q) => $q->whereHas('employee', fn($eq) => $eq->where('department_id', $departmentId)))
            ->selectRaw("
                date,
                SUM(status = 'present') as present,
                SUM(status = 'late') as late,
                SUM(status = 'absent') as absent,
                SUM(status = 'excused') as excused
            ")
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $weeklyTrend = [];
        for ($i = 0; $i < 7; $i++) {
            $currentDay = $trendStartDate->copy()->addDays($i)->toDateString();
            if ($trendRaw->has($currentDay)) {
                $weeklyTrend[] = [
                    'date'    => $currentDay,
                    'present' => (int) $trendRaw[$currentDay]->present,
                    'late'    => (int) $trendRaw[$currentDay]->late,
                    'absent'  => (int) $trendRaw[$currentDay]->absent,
                    'excused' => (int) $trendRaw[$currentDay]->excused,
                ];
            } else {
                $weeklyTrend[] = [
                    'date'    => $currentDay,
                    'present' => 0,
                    'late'    => 0,
                    'absent'  => 0,
                    'excused' => 0,
                ];
            }
        }

        return Inertia::render('HR/Attendance/Index', [
            'records'      => $records,
            'stats'        => $stats,
            'weeklyTrend'  => $weeklyTrend,
            'branches'     => Branch::where('is_active', true)->select('id', 'name')->get(),
            'shifts'       => Shift::where('is_active', true)->select('id', 'name', 'start_time', 'end_time')->get(),
            'departments'  => \App\Models\Department::select('id', 'name')->get(),
            'filters'      => $request->only(['date', 'start_date', 'end_date', 'branch_id', 'shift_id', 'department_id', 'status', 'search', 'sort_by', 'sort_dir']),
            'today'        => Carbon::today()->toDateString(),
            'startDate'    => $startDate,
            'endDate'      => $endDate,
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
     * تعديل سجلات حضور متعددة دفعة واحدة
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids'          => 'required|array',
            'ids.*'        => 'required|exists:attendances,id',
            'status'       => 'required|in:present,absent,late,excused',
            'check_in'     => 'nullable|date_format:H:i',
            'check_out'    => 'nullable|date_format:H:i',
            'late_minutes' => 'nullable|integer|min:0',
        ]);

        $updateData = [
            'status' => $validated['status']
        ];

        if ($validated['status'] === 'present') {
            $updateData['check_in'] = $validated['check_in'] ?? null;
            $updateData['check_out'] = $validated['check_out'] ?? null;
            $updateData['late_minutes'] = 0;
        } elseif ($validated['status'] === 'late') {
            $updateData['check_in'] = $validated['check_in'] ?? null;
            $updateData['check_out'] = $validated['check_out'] ?? null;
            $updateData['late_minutes'] = $validated['late_minutes'] ?? 0;
        } else {
            // absent or excused
            $updateData['check_in'] = null;
            $updateData['check_out'] = null;
            $updateData['late_minutes'] = 0;
        }

        \App\Models\Attendance::whereIn('id', $validated['ids'])->update($updateData);

        return back()->with('success', 'تم تحديث سجلات الحضور المحددة بنجاح');
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
