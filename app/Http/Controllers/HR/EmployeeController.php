<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Department;
use App\Models\JobGrade;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with(['user', 'department', 'jobGrade']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', fn($q) => $q->where('name', 'like', "%$search%"));
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $employees = $query->paginate(10)->through(function ($emp) {
            return [
                'id'         => $emp->id,
                'name'       => $emp->user->name ?? 'غير محدد',
                'username'   => $emp->user->username ?? '',
                'department' => $emp->department->name ?? 'غير محدد',
                'department_id' => $emp->department_id,
                'jobGrade'   => $emp->jobGrade->name ?? 'غير محدد',
                'hire_date'  => $emp->hire_date,
                'status'     => 'نشط',
                'avatar'     => 'https://ui-avatars.com/api/?name=' . urlencode($emp->user->name ?? 'U') . '&background=6b9b37&color=fff&bold=true',
            ];
        });

        $stats = [
            'total'   => Employee::count(),
            'active'  => Employee::count(),
            'onLeave' => 0,
            'pending' => 0,
        ];

        $departments  = Department::select('id', 'name')->orderBy('name')->get();
        $jobGrades    = JobGrade::select('id', 'name', 'level')->orderBy('level', 'desc')->get();

        return Inertia::render('HR/Employees/Index', [
            'employees'   => $employees,
            'stats'       => $stats,
            'departments' => $departments,
            'jobGrades'   => $jobGrades,
            'filters'     => $request->only(['search', 'department_id']),
        ]);
    }
}
