<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\Employee;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveBalanceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $academicYearId = $request->get('academic_year_id');
        $academicYears = AcademicYear::latest()->get();
        if (!$academicYearId && $academicYears->count() > 0) {
            $academicYearId = $academicYears->first()->id;
        }

        $balances = LeaveBalance::with(['employee.user', 'leaveType'])
            ->whereHas('employee.user', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            })
            ->when($academicYearId, function($q) use ($academicYearId) {
                $q->where('academic_year_id', $academicYearId);
            })
            ->get();

        // format to send to frontend
        $formattedBalances = $balances->map(function ($b) {
            return [
                'id' => $b->id,
                'employee_id' => $b->employee_id,
                'leave_type_id' => $b->leave_type_id,
                'employee_name' => $b->employee->user->name ?? '',
                'employee_number' => $b->employee->national_id ?? '',
                'leave_type_name' => $b->leaveType->name ?? '',
                'total_days' => $b->total_days,
                'used_days' => $b->used_days, // from accessor
                'remaining_days' => max(0, $b->total_days - $b->used_days),
            ];
        });

        $leaveTypes = LeaveType::where('branch_id', $user->branch_id)->get();
        $employees = Employee::with('user:id,name')->whereHas('user', function($q) use ($user) {
            $q->where('branch_id', $user->branch_id);
        })->get()->map(function($e) {
            return ['id' => $e->id, 'name' => $e->user->name ?? ''];
        });

        return Inertia::render('HR/Leaves/Balances', [
            'balances' => $formattedBalances,
            'academicYears' => $academicYears,
            'currentAcademicYearId' => $academicYearId,
            'leaveTypes' => $leaveTypes,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id' => 'nullable|exists:leave_balances,id',
            'employee_id' => 'required|exists:employees,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'leave_type_id' => [
                'required',
                'exists:leave_types,id',
                \Illuminate\Validation\Rule::unique('leave_balances')->where(function ($query) use ($request) {
                    return $query->where('employee_id', $request->employee_id)
                                 ->where('academic_year_id', $request->academic_year_id);
                })->ignore($request->id),
            ],
            'total_days' => 'required|integer|min:0',
        ], [
            'leave_type_id.unique' => 'الموظف يمتلك رصيد مسجل مسبقاً لهذا النوع في هذه السنة الدراسية.',
        ]);

        if ($request->id) {
            $balance = LeaveBalance::findOrFail($request->id);
            $balance->update(['total_days' => $request->total_days]);
        } else {
            LeaveBalance::create([
                'employee_id' => $request->employee_id,
                'academic_year_id' => $request->academic_year_id,
                'leave_type_id' => $request->leave_type_id,
                'total_days' => $request->total_days
            ]);
        }

        return back()->with('success', 'تم حفظ الرصيد بنجاح.');
    }

    public function generate(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:employees,id',
            'leave_type_ids' => 'nullable|array',
            'leave_type_ids.*' => 'exists:leave_types,id',
        ]);

        $user = $request->user();

        $leaveTypesQuery = LeaveType::where('branch_id', $user->branch_id);
        if ($request->filled('leave_type_ids')) {
            $leaveTypesQuery->whereIn('id', $request->leave_type_ids);
        }
        $leaveTypes = $leaveTypesQuery->get();

        $employeesQuery = Employee::whereHas('user', function($q) use ($user) {
            $q->where('branch_id', $user->branch_id);
        });
        if ($request->filled('employee_ids')) {
            $employeesQuery->whereIn('id', $request->employee_ids);
        }
        $employees = $employeesQuery->get();

        $count = 0;
        foreach ($employees as $employee) {
            foreach ($leaveTypes as $type) {
                if ($type->default_days === null) continue;

                $exists = LeaveBalance::where('employee_id', $employee->id)
                    ->where('academic_year_id', $request->academic_year_id)
                    ->where('leave_type_id', $type->id)
                    ->exists();

                if (!$exists) {
                    LeaveBalance::create([
                        'employee_id' => $employee->id,
                        'academic_year_id' => $request->academic_year_id,
                        'leave_type_id' => $type->id,
                        'total_days' => $type->default_days
                    ]);
                    $count++;
                }
            }
        }

        return back()->with('success', "تم توليد {$count} رصيد جديد للموظفين بنجاح.");
    }
}
