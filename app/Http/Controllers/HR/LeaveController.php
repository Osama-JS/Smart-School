<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\AcademicYear;
use App\Models\Leave;
use App\Models\LeaveType;
use App\Models\LeaveBalance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
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
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير النظام', 'Admin']);
        
        $query = Leave::with(['employee', 'leaveType']);

        if (!$isAdmin) {
            $query->whereHas('employee.user', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $leaves = $query->latest()->get();

        $leaveTypes = LeaveType::where('branch_id', $user->branch_id)->get();
        
        $employeesQuery = Employee::query();
        if (!$isAdmin) {
            $employeesQuery->whereHas('user', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }
        $employees = $employeesQuery->with('user:id,name')->get()->map(function($emp) {
            $parts = explode(' ', $emp->user->name ?? '', 2);
            return [
                'id' => $emp->id,
                'first_name' => $parts[0] ?? 'مجهول',
                'last_name' => $parts[1] ?? '',
            ];
        });

        $academicYears = AcademicYear::with('semesters')->get();

        return Inertia::render('HR/Leaves/Index', [
            'leaves' => $leaves,
            'employees' => $employees,
            'academicYears' => $academicYears,
            'leaveTypes' => $leaveTypes,
            'isAdmin' => $isAdmin,
            'filters' => $request->only(['status', 'employee_id'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:pending,approved,rejected',
            'reason' => 'nullable|string',
        ]);

        $requestedDays = Carbon::parse($request->start_date)->diffInDays(Carbon::parse($request->end_date)) + 1;
        $balance = LeaveBalance::where('employee_id', $request->employee_id)
            ->where('academic_year_id', $request->academic_year_id)
            ->where('leave_type_id', $request->leave_type_id)
            ->first();

        if (!$balance) {
            return back()->withErrors(['leave_type_id' => 'لا يوجد رصيد متاح للموظف من هذا النوع في السنة المحددة.']);
        }

        $remaining = max(0, $balance->total_days - $balance->used_days);
        if ($requestedDays > $remaining) {
            return back()->withErrors(['end_date' => "الرصيد غير كافٍ. المتبقي: $remaining يوم، والمطلوب: $requestedDays يوم."]);
        }

        Leave::create($validated);

        // إذا تمت الموافقة على الإجازة، تحديث سجلات الحضور
        if ($validated['status'] === 'approved') {
            $this->updateAttendanceForLeave($validated['employee_id'], $validated['start_date'], $validated['end_date']);
        }

        return redirect()->back()->with('success', 'تمت إضافة إجازة الموظف بنجاح.');
    }

    public function update(Request $request, Leave $leave)
    {
        if ($leave->status === 'approved') {
            return back()->with('error', 'لا يمكن تعديل إجازة تم اعتمادها مسبقاً.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:pending,approved,rejected',
            'reason' => 'nullable|string',
        ]);

        $requestedDays = Carbon::parse($request->start_date)->diffInDays(Carbon::parse($request->end_date)) + 1;
        $balance = LeaveBalance::where('employee_id', $request->employee_id)
            ->where('academic_year_id', $request->academic_year_id)
            ->where('leave_type_id', $request->leave_type_id)
            ->first();

        if ($balance) {
            $usedDaysWithoutCurrent = $balance->used_days;
            if ($leave->status === 'approved' && $leave->academic_year_id == $request->academic_year_id && $leave->leave_type_id == $request->leave_type_id) {
                $currentDays = Carbon::parse($leave->start_date)->diffInDays(Carbon::parse($leave->end_date)) + 1;
                $usedDaysWithoutCurrent -= $currentDays;
            }
            $remaining = max(0, $balance->total_days - $usedDaysWithoutCurrent);
            if ($requestedDays > $remaining) {
                return back()->withErrors(['end_date' => "الرصيد غير كافٍ. المتبقي: $remaining يوم، والمطلوب: $requestedDays يوم."]);
            }
        } else {
             return back()->withErrors(['leave_type_id' => 'لا يوجد رصيد متاح للموظف من هذا النوع في السنة المحددة.']);
        }

        $oldStatus = $leave->status;
        $oldStart = $leave->start_date;
        $oldEnd = $leave->end_date;
        $oldLeaveTypeId = $leave->leave_type_id;
        $oldAcademicYearId = $leave->academic_year_id;

        $leave->update($validated);

        // الرصيد (used_days) يتم حسابه تلقائياً عبر accessor في المودل فلا حاجة لتحديثه هنا

        // تحديث سجلات الحضور إذا تمت الموافقة
        if ($validated['status'] === 'approved') {
            $this->updateAttendanceForLeave($validated['employee_id'], $validated['start_date'], $validated['end_date']);
        }

        return redirect()->back()->with('success', 'تم تحديث إجازة الموظف بنجاح.');
    }

    public function destroy(Leave $leave)
    {
        if ($leave->status === 'approved') {
            return back()->with('error', 'لا يمكن حذف إجازة تم اعتمادها مسبقاً.');
        }

        $leave->delete();
        return redirect()->back()->with('success', 'تم حذف إجازة الموظف بنجاح.');
    }

    /**
     * تحديث سجلات الحضور لفترة الإجازة المعتمدة
     * يُحوّل سجلات "غائب" أو "weekend" الموجودة إلى "leave"
     * والسجلات غير الموجودة يتركها للتوليد التلقائي عند تحميل الصفحة
     */
    private function updateAttendanceForLeave(int $employeeId, string $startDate, string $endDate): void
    {
        \App\Models\Attendance::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate, $endDate])
            ->whereIn('status', ['absent', 'weekend', 'excused'])
            ->update(['status' => 'leave']);
    }
}

