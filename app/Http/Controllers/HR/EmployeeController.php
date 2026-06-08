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
        $query = Employee::query()
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->select('employees.*')
            ->with(['user', 'department', 'jobGrade']);

        // Check if not system admin, restrict to user's branch
        $user = auth()->user();
        if ($user && clone $user->loadMissing('role')) {
            $isAdmin = $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);
            if (!$isAdmin) {
                $query->where('users.branch_id', $user->branch_id);
            }
        }

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%$search%")
                  ->orWhere('users.username', 'like', "%$search%");
            });
        }

        if ($request->filled('department_id')) {
            $query->where('employees.department_id', $request->department_id);
        }

        if ($request->filled('job_grade_id')) {
            $query->where('employees.job_grade_id', $request->job_grade_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('users.is_active', $request->status === 'active' ? 1 : 0);
        }

        if ($request->filled('hire_date_start')) {
            $query->whereDate('employees.hire_date', '>=', $request->hire_date_start);
        }

        if ($request->filled('hire_date_end')) {
            $query->whereDate('employees.hire_date', '<=', $request->hire_date_end);
        }

        // Apply sorting
        $sortBy = $request->input('sort_by', 'hire_date');
        $sortDir = $request->input('sort_dir', 'desc');

        if (in_array($sortBy, ['name', 'username', 'is_active'])) {
            $query->orderBy('users.' . $sortBy, $sortDir);
        } elseif (in_array($sortBy, ['hire_date', 'department_id', 'job_grade_id'])) {
            $query->orderBy('employees.' . $sortBy, $sortDir);
        } else {
            $query->orderBy('employees.hire_date', 'desc');
        }

        $employees = $query->paginate(12)->withQueryString()->through(function ($emp) {
            return [
                'id'            => $emp->id,
                'user_id'       => $emp->user_id,
                'name'          => $emp->user->name ?? 'غير محدد',
                'username'      => $emp->user->username ?? '',
                'role'          => $emp->user->role->name ?? '—',
                'branch'        => $emp->user->branch->name ?? '—',
                'department'    => $emp->department->name ?? 'غير محدد',
                'department_id' => $emp->department_id,
                'job_grade_id'  => $emp->job_grade_id,
                'jobGrade'      => $emp->jobGrade->name ?? 'غير محدد',
                'hire_date'     => $emp->hire_date,
                'is_active'     => (bool)($emp->user->is_active ?? true),
                'avatar'        => 'https://ui-avatars.com/api/?name=' . urlencode($emp->user->name ?? 'U') . '&background=5b8a2d&color=fff&bold=true',
            ];
        });

        // Calculate Stats
        $baseStatQuery = Employee::query();
        if (isset($isAdmin) && !$isAdmin && isset($user)) {
            $baseStatQuery->whereHas('user', fn($q) => $q->where('branch_id', $user->branch_id));
        }

        $stats = [
            'total'    => (clone $baseStatQuery)->count(),
            'active'   => (clone $baseStatQuery)->whereHas('user', fn($q) => $q->where('is_active', 1))->count(),
            'inactive' => (clone $baseStatQuery)->whereHas('user', fn($q) => $q->where('is_active', 0))->count(),
            'new_hires'=> (clone $baseStatQuery)->where('hire_date', '>=', now()->subMonth())->count(),
        ];

        $departments = Department::select('id', 'name')->orderBy('name')->get();
        $jobGrades   = JobGrade::select('id', 'name', 'level')->orderBy('level', 'desc')->get();

        return Inertia::render('HR/Employees/Index', [
            'employees'   => $employees,
            'stats'       => $stats,
            'departments' => $departments,
            'jobGrades'   => $jobGrades,
            'filters'     => (object) $request->only(['search', 'department_id', 'job_grade_id', 'status', 'hire_date_start', 'hire_date_end', 'sort_by', 'sort_dir']),
        ]);
    }

    public function quickUpdate(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'is_active'     => ['nullable', 'boolean'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_grade_id'  => ['nullable', 'exists:job_grades,id'],
        ]);

        if ($request->has('is_active') && $employee->user) {
            $employee->user->update(['is_active' => (bool)$request->is_active]);
        }

        $employee->update(array_filter($request->only(['department_id', 'job_grade_id']), function ($value) {
            return $value !== null;
        }));

        return redirect()->back()->with('success', 'تم تحديث بيانات الموظف بنجاح');
    }
}
