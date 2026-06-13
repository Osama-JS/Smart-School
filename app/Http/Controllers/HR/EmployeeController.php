<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Department;
use App\Models\JobGrade;
use App\Models\User;
use App\Models\Role;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
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
            $isAdmin = $user->role && $user->role->name === 'مدير الفرع';
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

    public function create()
    {
        $userAuth = auth()->user();
        $isAdmin = $userAuth && $userAuth->role && $userAuth->role->name === 'مدير الفرع';
        
        $departments = Department::select('id', 'name')->orderBy('name')->get();
        $jobGrades   = JobGrade::select('id', 'name', 'level')->orderBy('level', 'desc')->get();
        $roles       = Role::select('id', 'name')->get();
        $branches    = $isAdmin ? Branch::select('id', 'name')->get() : [];

        $managerCandidates = Employee::with(['user:id,name', 'jobGrade:id,name,level'])
            ->whereHas('user', fn($q) => $q->where('is_active', 1))
            ->when(!$isAdmin, fn($q) => $q->whereHas('user', fn($q2) => $q2->where('branch_id', auth()->user()->branch_id)))
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->user->name ?? 'غير محدد',
                    'job_grade_id' => $emp->job_grade_id,
                    'level' => $emp->jobGrade->level ?? 99,
                ];
            });

        $shifts = \App\Models\Shift::select('id', 'name', 'start_time', 'end_time')->where('is_active', 1)->get();

        return Inertia::render('HR/Employees/Create', compact('departments', 'jobGrades', 'roles', 'branches', 'isAdmin', 'managerCandidates', 'shifts'));
    }

    public function store(Request $request)
    {
        $isAdmin = auth()->user()->role && auth()->user()->role->name === 'مدير الفرع';
        
        $validated = $request->validate([
            // بيانات الحساب
            'name'      => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:255', 'unique:users'],
            'password'  => ['required', 'string', 'min:8'],
            'role_id'   => ['required', 'exists:roles,id'],
            'branch_id' => [$isAdmin ? 'required' : 'nullable', $isAdmin ? 'exists:branches,id' : ''],
            'email'     => ['nullable', 'email', 'unique:users'],
            'phone'     => ['nullable', 'string', 'max:50'],
            'avatar'    => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'is_active' => ['boolean'],

            // بيانات الموظف
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_grade_id'  => ['nullable', 'exists:job_grades,id'],
            'manager_id'    => ['nullable', 'exists:employees,id'],
            'hire_date'     => ['nullable', 'date'],
            'national_id'   => ['nullable', 'string', 'max:50'],
            'specialization'=> ['nullable', 'string', 'max:255'],
            'job_title'     => ['nullable', 'string', 'max:255'],
            'address'       => ['nullable', 'string'],
            'address'       => ['nullable', 'string'],
            'attachments.*' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],
            'employee_shifts' => ['nullable', 'array'],
            'employee_shifts.*.shift_id' => ['required', 'exists:shifts,id'],
            'employee_shifts.*.working_days' => ['nullable', 'array'],
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        // إنشاء المستخدم
        $user = User::create([
            'name'      => $validated['name'],
            'username'  => $validated['username'],
            'password'  => Hash::make($validated['password']),
            'role_id'   => $validated['role_id'],
            'branch_id' => $isAdmin ? $validated['branch_id'] : auth()->user()->branch_id,
            'is_active' => $validated['is_active'] ?? true,
            'email'     => $validated['email'] ?? null,
            'phone'     => $validated['phone'] ?? null,
            'avatar'    => $avatarPath,
        ]);

        $attachmentsPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $attachmentsPaths[] = $file->store('employee_attachments', 'public');
            }
        }

        // إنشاء الموظف المرتبط
        $employee = Employee::create([
            'user_id'       => $user->id,
            'department_id' => $validated['department_id'] ?? null,
            'job_grade_id'  => $validated['job_grade_id'] ?? null,
            'manager_id'    => $validated['manager_id'] ?? null,
            'hire_date'     => $validated['hire_date'] ?? null,
            'national_id'   => $validated['national_id'] ?? null,
            'specialization'=> $validated['specialization'] ?? null,
            'job_title'     => $validated['job_title'] ?? null,
            'address'       => $validated['address'] ?? null,
            'attachments'   => !empty($attachmentsPaths) ? $attachmentsPaths : null,
        ]);

        if (!empty($validated['employee_shifts'])) {
            $syncData = [];
            foreach ($validated['employee_shifts'] as $shiftData) {
                if (!empty($shiftData['shift_id'])) {
                    $workingDays = !empty($shiftData['working_days']) ? json_encode($shiftData['working_days']) : json_encode([0, 1, 2, 3, 4]);
                    $syncData[$shiftData['shift_id']] = [
                        'branch_id' => $user->branch_id,
                        'working_days' => $workingDays,
                    ];
                }
            }
            $employee->shifts()->sync($syncData);
        }

        return redirect()->route('hr.employees')->with('success', 'تم إنشاء ملف الموظف بنجاح');
    }

    public function edit(Employee $employee)
    {
        $employee->load(['user', 'shifts']);
        
        $userAuth = auth()->user();
        $isAdmin = $userAuth && $userAuth->role && $userAuth->role->name === 'مدير الفرع';
        
        if (!$isAdmin && $employee->user->branch_id !== $userAuth->branch_id) {
            abort(403, 'لا يمكنك تعديل موظف خارج فرعك');
        }

        $departments = Department::select('id', 'name')->orderBy('name')->get();
        $jobGrades   = JobGrade::select('id', 'name', 'level')->orderBy('level', 'desc')->get();
        $roles       = Role::select('id', 'name')->get();
        $branches    = $isAdmin ? Branch::select('id', 'name')->get() : [];

        $managerCandidates = Employee::with(['user:id,name', 'jobGrade:id,name,level'])
            ->where('id', '!=', $employee->id) // لا يمكن للموظف أن يكون مديراً لنفسه
            ->whereHas('user', fn($q) => $q->where('is_active', 1))
            ->when(!$isAdmin, fn($q) => $q->whereHas('user', fn($q2) => $q2->where('branch_id', auth()->user()->branch_id)))
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->user->name ?? 'غير محدد',
                    'job_grade_id' => $emp->job_grade_id,
                    'level' => $emp->jobGrade->level ?? 99,
                ];
            });

        $shifts = \App\Models\Shift::select('id', 'name', 'start_time', 'end_time')->where('is_active', 1)->get();

        return Inertia::render('HR/Employees/Edit', compact('employee', 'departments', 'jobGrades', 'roles', 'branches', 'isAdmin', 'managerCandidates', 'shifts'));
    }

    public function update(Request $request, Employee $employee)
    {
        $userAuth = auth()->user();
        $isAdmin = $userAuth && $userAuth->role && $userAuth->role->name === 'مدير الفرع';
        
        if (!$isAdmin && $employee->user->branch_id !== $userAuth->branch_id) {
            abort(403, 'لا يمكنك تعديل موظف خارج فرعك');
        }

        $validated = $request->validate([
            // بيانات الحساب
            'name'      => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:255', Rule::unique('users')->ignore($employee->user_id)],
            'password'  => ['nullable', 'string', 'min:8'],
            'role_id'   => ['required', 'exists:roles,id'],
            'branch_id' => [$isAdmin ? 'required' : 'nullable', $isAdmin ? 'exists:branches,id' : ''],
            'email'     => ['nullable', 'email', Rule::unique('users')->ignore($employee->user_id)],
            'phone'     => ['nullable', 'string', 'max:50'],
            'avatar'    => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'is_active' => ['boolean'],

            // بيانات الموظف
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_grade_id'  => ['nullable', 'exists:job_grades,id'],
            'manager_id'    => ['nullable', 'exists:employees,id'],
            'hire_date'     => ['nullable', 'date'],
            'national_id'   => ['nullable', 'string', 'max:50'],
            'specialization'=> ['nullable', 'string', 'max:255'],
            'job_title'     => ['nullable', 'string', 'max:255'],
            'address'       => ['nullable', 'string'],
            'attachments.*' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],
            'employee_shifts' => ['nullable', 'array'],
            'employee_shifts.*.shift_id' => ['required', 'exists:shifts,id'],
            'employee_shifts.*.working_days' => ['nullable', 'array'],
        ]);

        $userData = [
            'name'      => $validated['name'],
            'username'  => $validated['username'],
            'role_id'   => $validated['role_id'],
            'is_active' => $validated['is_active'] ?? $employee->user->is_active,
            'email'     => $validated['email'] ?? null,
            'phone'     => $validated['phone'] ?? null,
        ];

        if ($isAdmin) {
            $userData['branch_id'] = $validated['branch_id'];
        }

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        if ($request->hasFile('avatar')) {
            if ($employee->user->avatar) {
                Storage::disk('public')->delete($employee->user->avatar);
            }
            $userData['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $employee->user->update($userData);

        $attachmentsPaths = $employee->attachments ?? [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $attachmentsPaths[] = $file->store('employee_attachments', 'public');
            }
        }

        $employee->update([
            'department_id' => $validated['department_id'] ?? null,
            'job_grade_id'  => $validated['job_grade_id'] ?? null,
            'manager_id'    => $validated['manager_id'] ?? null,
            'hire_date'     => $validated['hire_date'] ?? null,
            'national_id'   => $validated['national_id'] ?? null,
            'specialization'=> $validated['specialization'] ?? null,
            'job_title'     => $validated['job_title'] ?? null,
            'address'       => $validated['address'] ?? null,
            'attachments'   => !empty($attachmentsPaths) ? $attachmentsPaths : null,
        ]);

        if (array_key_exists('employee_shifts', $validated)) {
            if (empty($validated['employee_shifts'])) {
                $employee->shifts()->detach();
            } else {
                $syncData = [];
                foreach ($validated['employee_shifts'] as $shiftData) {
                    if (!empty($shiftData['shift_id'])) {
                        $workingDays = !empty($shiftData['working_days']) ? json_encode($shiftData['working_days']) : json_encode([0, 1, 2, 3, 4]);
                        $syncData[$shiftData['shift_id']] = [
                            'branch_id' => $employee->user->branch_id,
                            'working_days' => $workingDays,
                        ];
                    }
                }
                $employee->shifts()->sync($syncData);
            }
        }

        return redirect()->route('hr.employees')->with('success', 'تم تحديث بيانات الموظف بنجاح');
    }

    public function destroy(Employee $employee)
    {
        $userAuth = auth()->user();
        $isAdmin = $userAuth->role && $userAuth->role->name === 'مدير الفرع';
        
        if (!$isAdmin && $employee->user->branch_id !== $userAuth->branch_id) {
            abort(403, 'لا يمكنك حذف موظف خارج فرعك');
        }
        
        if ($employee->user_id === $userAuth->id) {
            abort(403, 'لا يمكنك حذف حسابك الشخصي');
        }

        // Delete user (cascade will delete employee)
        if ($employee->user->avatar) Storage::disk('public')->delete($employee->user->avatar);
        if ($employee->attachments) {
            foreach ($employee->attachments as $att) {
                Storage::disk('public')->delete($att);
            }
        }
        
        $employee->user->delete();

        return redirect()->route('hr.employees')->with('success', 'تم حذف الموظف بنجاح');
    }
}
