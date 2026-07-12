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

class EmployeeController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الموظفين', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة موظف', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل موظف', only: ['edit', 'update', 'quickUpdate']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف موظف', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $query = Employee::query()
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->select('employees.*')
            ->with(['user', 'department', 'jobGrade']);

        // Check if not system admin, restrict to user's branch
        $user = auth()->user();
        if ($user && clone $user->loadMissing('role')) {
            $isAdmin = $user->role && $user->role->name === 'مدير النظام';
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
                'hire_date'     => $emp->hire_date ? \Carbon\Carbon::parse($emp->hire_date)->format('Y-m-d') : '—',
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
        $isAdmin = $userAuth && $userAuth->role && $userAuth->role->name === 'مدير النظام';
        
        $departments = Department::select('id', 'name')->orderBy('name')->get();
        $jobGrades   = JobGrade::select('id', 'name', 'level')->orderBy('level', 'desc')->get();
        
        if (!$isAdmin) {
            $roles = Role::whereNotIn('name', ['مدير النظام', 'مدير الفرع', 'مدير فرع', 'طالب', 'ولي أمر', 'ولي امر'])->select('id', 'name')->get();
        } else {
            $roles = Role::whereNotIn('name', ['طالب', 'ولي أمر', 'ولي امر'])->select('id', 'name')->get();
        }
        
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
        $isAdmin = auth()->user()->role && auth()->user()->role->name === 'مدير النظام';
        
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
            'attachment_names' => ['nullable', 'array'],
            'attachment_names.*' => ['nullable', 'string'],
            'employee_shifts' => ['nullable', 'array'],
            'employee_shifts.*.shift_id' => ['nullable', 'exists:shifts,id'],
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
            $names = $request->input('attachment_names', []);
            foreach ($request->file('attachments') as $index => $file) {
                $name = $names[$index] ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $path = $file->store('employee_attachments', 'public');
                $attachmentsPaths[] = ['name' => $name, 'path' => $path];
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

    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="نموذج_استيراد_الموظفين.xls"',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        $callback = function () {
            // Excel HTML output with styles
            echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            echo '<head>';
            echo '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
            echo '<style>';
            echo 'table { border-collapse: collapse; direction: rtl; font-family: "Segoe UI", Arial, sans-serif; }';
            echo 'th { background-color: #2e5c31; color: white; font-weight: bold; padding: 10px; border: 1px solid #dddddd; text-align: center; }';
            echo 'td { padding: 8px; border: 1px solid #dddddd; text-align: center; }';
            echo '.instructions { background-color: #fff3cd; color: #856404; font-weight: bold; padding: 15px; border: 2px solid #ffeeba; text-align: center; font-size: 14px; }';
            echo '</style>';
            echo '</head>';
            echo '<body>';
            
            echo '<table>';
            
            // Row 1: Instructions
            echo '<tr><td colspan="10" class="instructions">تعليمات هامة: يرجى عدم تغيير أسماء الأعمدة. يجب كتابة (اسم القسم، اسم الدرجة الوظيفية، الصلاحية) مطابقة تماماً لما هو موجود في النظام. كلمة المرور الافتراضية ستكون 1234567 ما لم يتم تعديلها بعد الاستيراد.</td></tr>';
            echo '<tr><td colspan="10"></td></tr>';
            
            // Header Row
            echo '<tr>';
            echo '<th width="150">الاسم الرباعي</th>';
            echo '<th width="120">اسم المستخدم</th>';
            echo '<th width="180">البريد الإلكتروني</th>';
            echo '<th width="120">رقم الهاتف</th>';
            echo '<th width="120">الصلاحية (Role)</th>';
            echo '<th width="150">اسم القسم (Department)</th>';
            echo '<th width="150">الدرجة الوظيفية (Job Grade)</th>';
            echo '<th width="150">المسمى الوظيفي</th>';
            echo '<th width="180">تاريخ التعيين (YYYY-MM-DD)</th>';
            echo '<th width="120">رقم الهوية</th>';
            echo '</tr>';

            // Example Row 1
            echo '<tr>';
            echo '<td>أحمد محمد علي</td>';
            echo '<td>ahmed.m</td>';
            echo '<td>ahmed@example.com</td>';
            echo '<td style="mso-number-format:\'@\';">0501234567</td>';
            echo '<td>موظف</td>';
            echo '<td>الموارد البشرية</td>';
            echo '<td>الدرجة الأولى</td>';
            echo '<td>أخصائي موارد بشرية</td>';
            echo '<td>2024-01-15</td>';
            echo '<td style="mso-number-format:\'@\';">1012345678</td>';
            echo '</tr>';

            // Example Row 2
            echo '<tr>';
            echo '<td>سارة خالد عبدالله</td>';
            echo '<td>sara.k</td>';
            echo '<td>sara@example.com</td>';
            echo '<td style="mso-number-format:\'@\';">0507654321</td>';
            echo '<td>موظف</td>';
            echo '<td>تقنية المعلومات</td>';
            echo '<td>الدرجة الثانية</td>';
            echo '<td>مطور برمجيات</td>';
            echo '<td>2024-02-01</td>';
            echo '<td style="mso-number-format:\'@\';">1087654321</td>';
            echo '</tr>';

            echo '</table>';
            echo '</body>';
            echo '</html>';
        };

        return response()->stream($callback, 200, $headers);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:5120'],
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();

        $rows = [];
        
        // Handle CSV
        if (in_array($extension, ['csv', 'txt'])) {
            if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
                // Remove BOM if present
                $firstLine = fgets($handle);
                $bom = "\xef\xbb\xbf";
                if (strncmp($firstLine, $bom, 3) === 0) {
                    $firstLine = substr($firstLine, 3);
                }
                $rows[] = str_getcsv($firstLine);
                while (($data = fgetcsv($handle, 1000, ",")) !== false) {
                    $rows[] = $data;
                }
                fclose($handle);
            }
        } else {
            // Handle XLSX using SimpleXLSX (already installed)
            if ($xlsx = \Shuchkin\SimpleXLSX::parse($file->getRealPath())) {
                $rows = $xlsx->rows();
            } else {
                return redirect()->back()->withErrors(['file' => 'فشل في قراءة ملف الإكسل.']);
            }
        }

        // Clean up empty rows and find header index (row that contains 'الاسم الرباعي')
        $headerIndex = -1;
        foreach ($rows as $index => $row) {
            if (isset($row[0]) && str_contains($row[0], 'الاسم الرباعي')) {
                $headerIndex = $index;
                break;
            }
        }

        if ($headerIndex === -1) {
            return redirect()->back()->withErrors(['file' => 'لم يتم العثور على ترويسة الأعمدة الصحيحة. يرجى استخدام النموذج المعتمد.']);
        }

        $dataRows = array_slice($rows, $headerIndex + 1);

        // Pre-fetch related data mapping (to avoid N+1 queries)
        $departments = Department::pluck('id', 'name')->mapWithKeys(function ($id, $name) { return [trim(mb_strtolower($name)) => $id]; })->toArray();
        $jobGrades = JobGrade::pluck('id', 'name')->mapWithKeys(function ($id, $name) { return [trim(mb_strtolower($name)) => $id]; })->toArray();
        $roles = Role::pluck('id', 'name')->mapWithKeys(function ($id, $name) { return [trim(mb_strtolower($name)) => $id]; })->toArray();
        
        $userAuth = auth()->user();
        $isAdmin = $userAuth->role && $userAuth->role->name === 'مدير النظام';
        $branchId = $userAuth->branch_id; // Default branch for non-admins

        $successCount = 0;
        $errors = [];

        foreach ($dataRows as $index => $row) {
            // Skip empty rows
            if (empty(array_filter($row))) continue;
            
            // Expected columns matching the template:
            // 0: الاسم, 1: اسم المستخدم, 2: البريد, 3: الهاتف, 4: الصلاحية, 5: القسم, 6: الدرجة, 7: المسمى الوظيفي, 8: تاريخ التعيين, 9: الهوية
            $name = trim($row[0] ?? '');
            $username = trim($row[1] ?? '');
            $email = trim($row[2] ?? '');
            $phone = trim($row[3] ?? '');
            $roleName = trim($row[4] ?? '');
            $departmentName = trim($row[5] ?? '');
            $jobGradeName = trim($row[6] ?? '');
            $jobTitle = trim($row[7] ?? '');
            $hireDate = trim($row[8] ?? '');
            $nationalId = trim($row[9] ?? '');

            $rowNumber = $headerIndex + 2 + $index; // +2 because index is 0-based and header is 1 row

            if (empty($name) || empty($username)) {
                $errors[] = "الصف رقم $rowNumber: الاسم واسم المستخدم مطلوبان.";
                continue;
            }

            // Check if username exists
            if (User::where('username', $username)->exists()) {
                $errors[] = "الصف رقم $rowNumber: اسم المستخدم ($username) مستخدم مسبقاً.";
                continue;
            }

            // Map IDs
            $roleId = $roles[mb_strtolower($roleName)] ?? null;
            if (!$roleId) {
                // Fallback to a default role if not found and not empty, or require it
                $fallbackRole = Role::where('name', 'موظف')->first();
                $roleId = $fallbackRole ? $fallbackRole->id : null;
                if (!$roleId) {
                    $errors[] = "الصف رقم $rowNumber: الصلاحية ($roleName) غير موجودة.";
                    continue;
                }
            }

            $departmentId = $departmentName ? ($departments[mb_strtolower($departmentName)] ?? null) : null;
            $jobGradeId = $jobGradeName ? ($jobGrades[mb_strtolower($jobGradeName)] ?? null) : null;

            if ($departmentName && !$departmentId) {
                $errors[] = "الصف رقم $rowNumber: القسم ($departmentName) غير موجود في النظام.";
                continue;
            }

            try {
                \DB::beginTransaction();

                $user = User::create([
                    'name'      => $name,
                    'username'  => $username,
                    'password'  => \Hash::make('1234567'), // Default password
                    'role_id'   => $roleId,
                    'branch_id' => $branchId,
                    'is_active' => true,
                    'email'     => !empty($email) ? $email : null,
                    'phone'     => !empty($phone) ? $phone : null,
                ]);

                Employee::create([
                    'user_id'       => $user->id,
                    'department_id' => $departmentId,
                    'job_grade_id'  => $jobGradeId,
                    'hire_date'     => !empty($hireDate) ? date('Y-m-d', strtotime($hireDate)) : null,
                    'national_id'   => !empty($nationalId) ? $nationalId : null,
                    'job_title'     => !empty($jobTitle) ? $jobTitle : null,
                ]);

                \DB::commit();
                $successCount++;
            } catch (\Exception $e) {
                \DB::rollBack();
                $errors[] = "الصف رقم $rowNumber: خطأ تقني أثناء الحفظ (" . $e->getMessage() . ").";
            }
        }

        $message = "تم استيراد $successCount موظف بنجاح.";
        if (count($errors) > 0) {
            return redirect()->back()->with('success', $message)->with('import_errors', $errors);
        }

        return redirect()->back()->with('success', $message);
    }

    public function edit(Employee $employee)

    {
        $employee->load(['user', 'shifts']);
        
        $userAuth = auth()->user();
        $isAdmin = $userAuth && $userAuth->role && $userAuth->role->name === 'مدير النظام';
        
        if (!$isAdmin && $employee->user->branch_id !== $userAuth->branch_id) {
            abort(403, 'لا يمكنك تعديل موظف خارج فرعك');
        }

        $departments = Department::select('id', 'name')->orderBy('name')->get();
        $jobGrades   = JobGrade::select('id', 'name', 'level')->orderBy('level', 'desc')->get();
        
        if (!$isAdmin) {
            $roles = Role::whereNotIn('name', ['مدير النظام', 'مدير الفرع', 'مدير فرع', 'طالب', 'ولي أمر', 'ولي امر'])->select('id', 'name')->get();
        } else {
            $roles = Role::whereNotIn('name', ['طالب', 'ولي أمر', 'ولي امر'])->select('id', 'name')->get();
        }
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
        $isAdmin = $userAuth && $userAuth->role && $userAuth->role->name === 'مدير النظام';
        
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
            'kept_attachments' => ['nullable', 'array'],
            'attachments.*' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],
            'attachment_names' => ['nullable', 'array'],
            'attachment_names.*' => ['nullable', 'string'],
            'employee_shifts' => ['nullable', 'array'],
            'employee_shifts.*.shift_id' => ['nullable', 'exists:shifts,id'],
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

        $validatedKept = $validated['kept_attachments'] ?? [];
        $attachmentsPaths = [];
        $keptPaths = [];
        foreach ($validatedKept as $kept) {
            if (is_array($kept) && isset($kept['path'])) {
                $attachmentsPaths[] = $kept;
                $keptPaths[] = $kept['path'];
            } elseif (is_string($kept)) {
                $attachmentsPaths[] = ['name' => 'مرفق', 'path' => $kept];
                $keptPaths[] = $kept;
            }
        }

        $oldAttachments = $employee->attachments ?? [];
        $oldPaths = array_map(function($att) {
            return is_array($att) ? ($att['path'] ?? null) : (is_string($att) ? $att : null);
        }, $oldAttachments);
        $oldPaths = array_filter($oldPaths);

        $deletedPaths = array_diff($oldPaths, $keptPaths);
        foreach ($deletedPaths as $deletedPath) {
            Storage::disk('public')->delete($deletedPath);
        }

        if ($request->hasFile('attachments')) {
            $names = $request->input('attachment_names', []);
            foreach ($request->file('attachments') as $index => $file) {
                $name = $names[$index] ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $path = $file->store('employee_attachments', 'public');
                $attachmentsPaths[] = ['name' => $name, 'path' => $path];
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
        $isAdmin = $userAuth->role && $userAuth->role->name === 'مدير النظام';
        
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
