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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Spatie\LaravelPdf\Facades\Pdf;

class EmployeeController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الموظفين', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة موظف', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل موظف', only: ['edit', 'update', 'quickUpdate', 'resetPassword', 'bulkStatus', 'bulkAssign', 'bulkResetPassword', 'bulkWhatsApp', 'downloadCredentialsPdf']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف موظف', only: ['destroy', 'bulkDestroy']),
        ];
    }
    private function buildFilteredEmployeesQuery(Request $request)
    {
        $query = Employee::query()
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->select('employees.*')
            ->with(['user.role', 'user.branch', 'department', 'jobGrade']);

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

        return $query;
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        if ($user) {
            $user->loadMissing('role');
        }
        $isAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $query = $this->buildFilteredEmployeesQuery($request);

        $canViewCredentials = $user && $user->hasPermission('تعديل موظف');

        $employees = $query->paginate(12)->withQueryString()->through(function ($emp) use ($canViewCredentials) {
            return [
                'id' => $emp->id,
                'user_id' => $emp->user_id,
                'name' => $emp->user->name ?? 'غير محدد',
                'username' => $emp->user->username ?? '',
                'phone' => $emp->user->phone ?? '',
                'email' => $emp->user->email ?? '',
                'role' => $emp->user->role->name ?? '—',
                'branch' => $emp->user->branch->name ?? '—',
                'department' => $emp->department->name ?? 'غير محدد',
                'department_id' => $emp->department_id,
                'job_grade_id' => $emp->job_grade_id,
                'jobGrade' => $emp->jobGrade->name ?? 'غير محدد',
                'job_title' => $emp->job_title ?? '',
                'hire_date' => $emp->hire_date ? \Carbon\Carbon::parse($emp->hire_date)->format('Y-m-d') : '—',
                'is_active' => (bool) ($emp->user->is_active ?? true),
                'must_change_password' => (bool) ($emp->user->must_change_password ?? false),
                'login_password' => $canViewCredentials ? $emp->user?->getDecryptedVisiblePassword() : null,
                'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($emp->user->name ?? 'U') . '&background=5b8a2d&color=fff&bold=true',
            ];
        });

        // Calculate Stats
        $baseStatQuery = Employee::query();
        if (isset($isAdmin) && !$isAdmin && isset($user)) {
            $baseStatQuery->whereHas('user', fn($q) => $q->where('branch_id', $user->branch_id));
        }

        $stats = [
            'total' => (clone $baseStatQuery)->count(),
            'active' => (clone $baseStatQuery)->whereHas('user', fn($q) => $q->where('is_active', 1))->count(),
            'inactive' => (clone $baseStatQuery)->whereHas('user', fn($q) => $q->where('is_active', 0))->count(),
            'new_hires' => (clone $baseStatQuery)->where('hire_date', '>=', now()->subMonth())->count(),
        ];

        $departments = Department::select('id', 'name')->orderBy('name')->get();
        $jobGrades = JobGrade::select('id', 'name', 'level')->orderBy('level', 'desc')->get();

        return Inertia::render('HR/Employees/Index', [
            'employees' => $employees,
            'stats' => $stats,
            'departments' => $departments,
            'jobGrades' => $jobGrades,
            'canManageCredentials' => (bool) $canViewCredentials,
            'filters' => (object) $request->only(['search', 'department_id', 'job_grade_id', 'status', 'hire_date_start', 'hire_date_end', 'sort_by', 'sort_dir']),
        ]);
    }

    public function quickUpdate(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'is_active' => ['nullable', 'boolean'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_grade_id' => ['nullable', 'exists:job_grades,id'],
        ]);

        if ($request->has('is_active') && $employee->user) {
            $employee->user->update(['is_active' => (bool) $request->is_active]);
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
        $jobGrades = JobGrade::select('id', 'name', 'level')->orderBy('level', 'desc')->get();

        if (!$isAdmin) {
            $roles = Role::whereNotIn('name', ['مدير النظام', 'مدير الفرع', 'مدير فرع', 'طالب', 'ولي أمر', 'ولي امر'])->select('id', 'name')->get();
        } else {
            $roles = Role::whereNotIn('name', ['طالب', 'ولي أمر', 'ولي امر'])->select('id', 'name')->get();
        }

        $branches = $isAdmin ? Branch::select('id', 'name')->get() : [];

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

    /**
     * فحص هل الموظف مسجل مسبقاً في فرع آخر برقم الهوية أو الجوال أو البريد
     */
    public function checkExisting(Request $request)
    {
        $nationalId = $request->query('national_id');
        $phone = $request->query('phone');
        $email = $request->query('email');

        if (!$nationalId && !$phone && !$email) {
            return response()->json(['exists' => false]);
        }

        $query = Employee::with(['user.branch', 'user.role', 'department', 'jobGrade'])
            ->where(function ($q) use ($nationalId, $phone, $email) {
                if ($nationalId) {
                    $q->orWhere('national_id', $nationalId)
                        ->orWhereHas('user', fn($uq) => $uq->where('national_id', $nationalId));
                }
                if ($phone) {
                    $q->orWhereHas('user', fn($uq) => $uq->where('phone', $phone));
                }
                if ($email) {
                    $q->orWhereHas('user', fn($uq) => $uq->where('email', $email));
                }
            });

        $existingEmployee = $query->first();

        if ($existingEmployee && $existingEmployee->user) {
            return response()->json([
                'exists' => true,
                'data' => [
                    'id' => $existingEmployee->id,
                    'user_id' => $existingEmployee->user_id,
                    'name' => $existingEmployee->user->name ?? '',
                    'national_id' => $existingEmployee->national_id ?? $existingEmployee->user->national_id,
                    'phone' => $existingEmployee->user->phone ?? '',
                    'email' => $existingEmployee->user->email ?? '',
                    'specialization' => $existingEmployee->specialization ?? '',
                    'job_title' => $existingEmployee->job_title ?? '',
                    'address' => $existingEmployee->address ?? '',
                    'branch_id' => $existingEmployee->user->branch_id ?? null,
                    'branch_name' => $existingEmployee->user->branch->name ?? 'فرع آخر',
                    'role_name' => $existingEmployee->user->role->name ?? '',
                    'department_name' => $existingEmployee->department->name ?? '',
                ]
            ]);
        }

        return response()->json(['exists' => false]);
    }

    public function store(Request $request)
    {
        $isAdmin = auth()->user()->role && auth()->user()->role->name === 'مدير النظام';
        $autoGenerate = filter_var($request->input('auto_generate_credentials'), FILTER_VALIDATE_BOOLEAN);

        $rules = [
            // بيانات الحساب
            'name' => ['required', 'string', 'max:255'],
            'role_id' => ['required', 'exists:roles,id'],
            'branch_id' => [$isAdmin ? 'required' : 'nullable', $isAdmin ? 'exists:branches,id' : ''],
            'email' => ['nullable', 'email', 'unique:users'],
            'phone' => [$autoGenerate ? 'required' : 'nullable', 'string', 'max:50'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'is_active' => ['boolean'],

            // بيانات الموظف
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_grade_id' => ['nullable', 'exists:job_grades,id'],
            'manager_id' => ['nullable', 'exists:employees,id'],
            'hire_date' => ['nullable', 'date'],
            'national_id' => ['nullable', 'string', 'max:50'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'attachments.*' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],
            'attachment_names' => ['nullable', 'array'],
            'attachment_names.*' => ['nullable', 'string'],
            'employee_shifts' => ['nullable', 'array'],
            'employee_shifts.*.shift_id' => ['nullable', 'exists:shifts,id'],
            'employee_shifts.*.working_days' => ['nullable', 'array'],
        ];

        if (!$autoGenerate) {
            $rules['username'] = ['required', 'string', 'max:255', 'unique:users'];
            $rules['password'] = ['required', 'string', 'min:4', 'max:50'];
        }

        $validated = $request->validate($rules);

        // Check if phone is already used as a username if auto generating
        if ($autoGenerate) {
            $existingUser = User::where('username', $validated['phone'])->first();
            if ($existingUser) {
                return redirect()->back()->withErrors(['phone' => 'رقم الهاتف هذا مسجل كاسم مستخدم لموظف آخر. يرجى استخدام رقم هاتف مختلف أو إدخال بيانات الدخول يدوياً.'])->withInput();
            }
        }

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        // إعداد بيانات الدخول
        $username = $autoGenerate ? $validated['phone'] : $validated['username'];
        $plainPassword = $autoGenerate ? $this->generateSimplePassword('digits') : $validated['password'];

        // إنشاء المستخدم
        $user = User::create([
            'name' => $validated['name'],
            'username' => $username,
            'password' => Hash::make($plainPassword),
            'visible_password' => $plainPassword,
            'role_id' => $validated['role_id'],
            'branch_id' => $isAdmin ? $validated['branch_id'] : auth()->user()->branch_id,
            'is_active' => $validated['is_active'] ?? true,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'avatar' => $avatarPath,
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
            'user_id' => $user->id,
            'department_id' => $validated['department_id'] ?? null,
            'job_grade_id' => $validated['job_grade_id'] ?? null,
            'manager_id' => $validated['manager_id'] ?? null,
            'hire_date' => $validated['hire_date'] ?? null,
            'national_id' => $validated['national_id'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
            'job_title' => $validated['job_title'] ?? null,
            'address' => $validated['address'] ?? null,
            'attachments' => !empty($attachmentsPaths) ? $attachmentsPaths : null,
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

        if ($autoGenerate) {
            \Illuminate\Support\Facades\Session::flash(
                'generated_credentials',
                $this->buildCredentialsPayload($employee, $user, $plainPassword, 'create', false)
            );
        }

        return redirect()->route('hr.employees')->with('success', 'تم إنشاء ملف الموظف بنجاح');
    }

    public function resetPassword(Request $request, Employee $employee)
    {
        $employee->loadMissing(['user.role', 'user.branch', 'department', 'jobGrade']);
        $user = $employee->user;

        if (!$user) {
            return redirect()->back()->with('error', 'لا يوجد حساب مستخدم مرتبط بهذا الموظف.');
        }

        $authUser = auth()->user();
        $isAdmin = $authUser && $authUser->role && $authUser->role->name === 'مدير النظام';
        if (!$isAdmin && $user->branch_id !== $authUser->branch_id) {
            abort(403, 'لا يمكنك إعادة تعيين كلمة مرور موظف خارج فرعك');
        }

        $validated = $request->validate([
            'mode' => ['nullable', 'in:auto,manual'],
            'style' => ['nullable', 'in:digits,alnum'],
            'password' => ['required_if:mode,manual', 'nullable', 'string', 'min:4', 'max:50', 'confirmed'],
            'must_change_password' => ['nullable', 'boolean'],
            'revoke_tokens' => ['nullable', 'boolean'],
            'open_print_modal' => ['nullable', 'boolean'],
        ], [
            'password.required_if' => 'يرجى إدخال كلمة المرور الجديدة.',
            'password.min' => 'كلمة المرور يجب أن تكون 4 خانات على الأقل.',
            'password.max' => 'كلمة المرور يجب ألا تتجاوز 50 خانة.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
        ]);

        $mode = $validated['mode'] ?? 'auto';
        $style = $validated['style'] ?? 'digits';
        $plainPassword = $mode === 'manual' ? $validated['password'] : $this->generateSimplePassword($style);
        $mustChange = array_key_exists('must_change_password', $validated) ? (bool) $validated['must_change_password'] : false;
        $revokeTokens = (bool) ($validated['revoke_tokens'] ?? false);
        $openPrintModal = array_key_exists('open_print_modal', $validated) ? (bool) $validated['open_print_modal'] : true;

        $user->update([
            'password' => Hash::make($plainPassword),
            'visible_password' => $plainPassword,
            'must_change_password' => $mustChange,
        ]);

        if ($revokeTokens) {
            $user->tokens()->delete();
        }

        if ($openPrintModal) {
            \Illuminate\Support\Facades\Session::flash(
                'generated_credentials',
                $this->buildCredentialsPayload($employee, $user, $plainPassword, 'reset', $revokeTokens)
            );
        }

        return redirect()->back()->with('success', 'تم إعادة تعيين كلمة المرور بنجاح');
    }

    /**
     * توليد كلمة مرور سهلة القراءة والكتابة دون رموز معقدة
     */
    private function generateSimplePassword(string $style = 'digits'): string
    {
        if ($style === 'alnum') {
            $letters = 'abcdefghjkmnpqrstuvwxyz';
            $len = strlen($letters);
            $prefix = $letters[random_int(0, $len - 1)] . $letters[random_int(0, $len - 1)];
            return $prefix . random_int(1000, 9999);
        }

        return (string) random_int(100000, 999999);
    }

    /**
     * تجهيز بيانات الدخول الموحدة لعرضها وطباعتها في الواجهة
     */
    private function buildCredentialsPayload(
        Employee $employee,
        User $user,
        ?string $plainPassword,
        string $action = 'reset',
        bool $revokedTokens = false
    ): array {
        $employee->loadMissing(['department', 'jobGrade']);
        $user->loadMissing(['role', 'branch']);

        return [
            'action' => $action,
            'employee_id' => $employee->id,
            'name' => $user->name,
            'username' => $user->username,
            'password' => $plainPassword,
            'phone' => $user->phone ?? '',
            'branch' => $user->branch?->name ?? '—',
            'department' => $employee->department?->name ?? 'غير محدد',
            'jobGrade' => $employee->jobGrade?->name ?? 'غير محدد',
            'job_title' => $employee->job_title ?? '',
            'role' => $user->role?->name ?? '—',
            'must_change_password' => (bool) ($user->must_change_password ?? false),
            'revoked_tokens' => $revokedTokens,
            'issued_at' => now()->toIso8601String(),
        ];
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
            'file' => ['required', 'file', 'max:5120'],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        if (!in_array($extension, ['csv', 'txt', 'xlsx', 'xls'])) {
            return redirect()->back()->withErrors(['file' => 'يجب أن يكون الملف بصيغة csv, txt, xlsx, أو xls.']);
        }

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
            $content = file_get_contents($file->getRealPath());
            if (stripos($content, '<html') !== false && stripos($content, '<table') !== false) {
                // Parse HTML table
                $dom = new \DOMDocument();
                @$dom->loadHTML('<?xml encoding="UTF-8">' . $content);
                $tables = $dom->getElementsByTagName('table');
                if ($tables->length > 0) {
                    $table = $tables->item(0);
                    $trs = $table->getElementsByTagName('tr');
                    foreach ($trs as $tr) {
                        $rowData = [];
                        $tds = $tr->childNodes;
                        foreach ($tds as $td) {
                            if ($td->nodeName === 'td' || $td->nodeName === 'th') {
                                $rowData[] = trim($td->textContent);
                            }
                        }
                        if (!empty($rowData)) {
                            $rows[] = $rowData;
                        }
                    }
                }
            } else {
                // Handle XLSX using SimpleXLSX
                if ($xlsx = \Shuchkin\SimpleXLSX::parse($file->getRealPath())) {
                    $rows = $xlsx->rows();
                } else {
                    return redirect()->back()->withErrors(['file' => 'فشل في قراءة ملف الإكسل.']);
                }
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
        $departments = Department::pluck('id', 'name')->mapWithKeys(function ($id, $name) {
            return [trim(mb_strtolower($name)) => $id]; })->toArray();
        $jobGrades = JobGrade::pluck('id', 'name')->mapWithKeys(function ($id, $name) {
            return [trim(mb_strtolower($name)) => $id]; })->toArray();
        $roles = Role::pluck('id', 'name')->mapWithKeys(function ($id, $name) {
            return [trim(mb_strtolower($name)) => $id]; })->toArray();

        $userAuth = auth()->user();
        $isAdmin = $userAuth->role && $userAuth->role->name === 'مدير النظام';
        $branchId = $userAuth->branch_id; // Default branch for non-admins

        $successCount = 0;
        $errors = [];

        foreach ($dataRows as $index => $row) {
            // Skip empty rows
            if (empty(array_filter($row)))
                continue;

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
                    'name' => $name,
                    'username' => $username,
                    'password' => \Hash::make('1234567'), // Default password
                    'visible_password' => '1234567',
                    'role_id' => $roleId,
                    'branch_id' => $branchId,
                    'is_active' => true,
                    'email' => !empty($email) ? $email : null,
                    'phone' => !empty($phone) ? $phone : null,
                ]);

                Employee::create([
                    'user_id' => $user->id,
                    'department_id' => $departmentId,
                    'job_grade_id' => $jobGradeId,
                    'hire_date' => !empty($hireDate) ? date('Y-m-d', strtotime($hireDate)) : null,
                    'national_id' => !empty($nationalId) ? $nationalId : null,
                    'job_title' => !empty($jobTitle) ? $jobTitle : null,
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
        $jobGrades = JobGrade::select('id', 'name', 'level')->orderBy('level', 'desc')->get();

        if (!$isAdmin) {
            $roles = Role::whereNotIn('name', ['مدير النظام', 'مدير الفرع', 'مدير فرع', 'طالب', 'ولي أمر', 'ولي امر'])->select('id', 'name')->get();
        } else {
            $roles = Role::whereNotIn('name', ['طالب', 'ولي أمر', 'ولي امر'])->select('id', 'name')->get();
        }
        $branches = $isAdmin ? Branch::select('id', 'name')->get() : [];

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
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($employee->user_id)],
            'password' => ['nullable', 'string', 'min:4', 'max:50'],
            'role_id' => ['required', 'exists:roles,id'],
            'branch_id' => [$isAdmin ? 'required' : 'nullable', $isAdmin ? 'exists:branches,id' : ''],
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($employee->user_id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'is_active' => ['boolean'],

            // بيانات الموظف
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_grade_id' => ['nullable', 'exists:job_grades,id'],
            'manager_id' => ['nullable', 'exists:employees,id'],
            'hire_date' => ['nullable', 'date'],
            'national_id' => ['nullable', 'string', 'max:50'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'kept_attachments' => ['nullable', 'array'],
            'attachments.*' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],
            'attachment_names' => ['nullable', 'array'],
            'attachment_names.*' => ['nullable', 'string'],
            'employee_shifts' => ['nullable', 'array'],
            'employee_shifts.*.shift_id' => ['nullable', 'exists:shifts,id'],
            'employee_shifts.*.working_days' => ['nullable', 'array'],
        ]);

        $userData = [
            'name' => $validated['name'],
            'username' => $validated['username'],
            'role_id' => $validated['role_id'],
            'is_active' => $validated['is_active'] ?? $employee->user->is_active,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ];

        if ($isAdmin) {
            $userData['branch_id'] = $validated['branch_id'];
        }

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
            $userData['visible_password'] = $validated['password'];
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
        $oldPaths = array_map(function ($att) {
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
            'job_grade_id' => $validated['job_grade_id'] ?? null,
            'manager_id' => $validated['manager_id'] ?? null,
            'hire_date' => $validated['hire_date'] ?? null,
            'national_id' => $validated['national_id'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
            'job_title' => $validated['job_title'] ?? null,
            'address' => $validated['address'] ?? null,
            'attachments' => !empty($attachmentsPaths) ? $attachmentsPaths : null,
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
        if ($employee->user->avatar)
            Storage::disk('public')->delete($employee->user->avatar);
        if ($employee->attachments) {
            foreach ($employee->attachments as $att) {
                Storage::disk('public')->delete($att);
            }
        }

        $employee->user->delete();

        return redirect()->route('hr.employees')->with('success', 'تم حذف الموظف بنجاح');
    }

    public function bulkStatus(Request $request)
    {
        $validated = $request->validate([
            'employee_ids'   => ['required', 'array', 'min:1', 'max:500'],
            'employee_ids.*' => ['integer', 'exists:employees,id'],
            'is_active'      => ['required', 'boolean'],
        ]);

        $authUser = auth()->user();
        $employees = $this->resolveAuthorizedBulkEmployees($validated['employee_ids']);
        $isActive = (bool) $validated['is_active'];

        $updated = 0;
        $skippedSelf = false;

        DB::transaction(function () use ($employees, $isActive, $authUser, &$updated, &$skippedSelf) {
            foreach ($employees as $employee) {
                if (!$employee->user) {
                    continue;
                }
                if (!$isActive && $authUser && $employee->user_id === $authUser->id) {
                    $skippedSelf = true;
                    continue;
                }
                $employee->user->update(['is_active' => $isActive]);
                $updated++;
            }
        });

        $label = $isActive ? 'تفعيل' : 'تعطيل';
        $message = "تم {$label} {$updated} موظف بنجاح.";
        if ($skippedSelf) {
            $message .= ' (تم استثناء حسابك الشخصي).';
        }

        return redirect()->back()->with('success', $message);
    }

    public function bulkAssign(Request $request)
    {
        $validated = $request->validate([
            'employee_ids'   => ['required', 'array', 'min:1', 'max:500'],
            'employee_ids.*' => ['integer', 'exists:employees,id'],
            'department_id'  => ['nullable', 'exists:departments,id'],
            'job_grade_id'   => ['nullable', 'exists:job_grades,id'],
        ]);

        if (empty($validated['department_id']) && empty($validated['job_grade_id'])) {
            return redirect()->back()->with('error', 'يرجى اختيار القسم أو الدرجة الوظيفية على الأقل.');
        }

        $employees = $this->resolveAuthorizedBulkEmployees($validated['employee_ids']);
        $payload = array_filter([
            'department_id' => $validated['department_id'] ?? null,
            'job_grade_id'  => $validated['job_grade_id'] ?? null,
        ], fn ($val) => $val !== null && $val !== '');

        DB::transaction(function () use ($employees, $payload) {
            foreach ($employees as $employee) {
                $employee->update($payload);
            }
        });

        return redirect()->back()->with('success', 'تم تحديث القسم/الدرجة الوظيفية لـ ' . $employees->count() . ' موظف بنجاح.');
    }

    public function bulkResetPassword(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        if ($request->filled('target_scope')) {
            $validated = $request->validate([
                'target_scope'    => ['required', 'in:all_filtered,missing_only,selected_only'],
                'password_mode'   => ['nullable', 'in:digits_6,alnum_8,manual'],
                'manual_password' => ['required_if:password_mode,manual', 'nullable', 'string', 'min:4', 'max:50'],
                'employee_ids'    => ['required_if:target_scope,selected_only', 'nullable', 'array'],
                'employee_ids.*'  => ['integer', 'exists:employees,id'],
            ], [
                'manual_password.required_if' => 'يرجى إدخال كلمة المرور الموحدة.',
                'manual_password.min'         => 'كلمة المرور يجب أن تكون 4 خانات على الأقل.',
                'employee_ids.required_if'    => 'يرجى تحديد موظف واحد على الأقل.',
            ]);

            $targetScope = $validated['target_scope'];
            $passwordMode = $validated['password_mode'] ?? 'digits_6';
            $manualPassword = $validated['manual_password'] ?? null;

            if ($targetScope === 'selected_only' && !empty($validated['employee_ids'])) {
                $employees = $this->resolveAuthorizedBulkEmployees($validated['employee_ids']);
            } else {
                $employees = $this->buildFilteredEmployeesQuery($request)->get();
            }

            if ($targetScope === 'missing_only') {
                $employees = $employees->filter(function ($employee) {
                    return $employee->user && empty($employee->user->getDecryptedVisiblePassword());
                })->values();
            } else {
                $employees = $employees->filter(fn ($employee) => $employee->user !== null)->values();
            }

            if ($employees->isEmpty()) {
                return redirect()->back()->with('success', 'لا توجد حسابات موظفين تحتاج إلى إعادة تعيين كلمة المرور ضمن النطاق المحدد.');
            }

            $updatedCount = 0;
            $precomputedManualHash = $passwordMode === 'manual'
                ? Hash::make($manualPassword)
                : null;

            \App\Models\User::withoutEvents(function () use ($employees, $passwordMode, $manualPassword, $precomputedManualHash, &$updatedCount) {
                DB::transaction(function () use ($employees, $passwordMode, $manualPassword, $precomputedManualHash, &$updatedCount) {
                    foreach ($employees as $employee) {
                        $user = $employee->user;
                        if (!$user) {
                            continue;
                        }

                        if ($passwordMode === 'manual') {
                            $plainPassword = $manualPassword;
                            $hashedPassword = $precomputedManualHash;
                        } elseif ($passwordMode === 'alnum_8') {
                            $plainPassword = $this->generateSimplePassword('alnum');
                            $hashedPassword = password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 4]);
                        } else {
                            // digits_6 (default, e.g. 347559)
                            $plainPassword = $this->generateSimplePassword('digits');
                            $hashedPassword = password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 4]);
                        }

                        $user->update([
                            'password'         => $hashedPassword,
                            'visible_password' => $plainPassword,
                        ]);

                        $updatedCount++;
                    }
                });
            });

            return redirect()->back()->with('success', "تم إعادة تعيين وحفظ كلمة المرور لـ {$updatedCount} من الموظفين بنجاح. يمكنك الآن طباعة بطاقات الدخول PDF.");
        }

        $validated = $request->validate([
            'employee_ids'         => ['required', 'array', 'min:1', 'max:500'],
            'employee_ids.*'       => ['integer', 'exists:employees,id'],
            'mode'                 => ['nullable', 'in:auto,manual'],
            'style'                => ['nullable', 'in:digits,alnum'],
            'password'             => ['required_if:mode,manual', 'nullable', 'string', 'min:4', 'max:50', 'confirmed'],
            'must_change_password' => ['nullable', 'boolean'],
            'revoke_tokens'        => ['nullable', 'boolean'],
            'open_print_modal'     => ['nullable', 'boolean'],
        ], [
            'password.required_if' => 'يرجى إدخال كلمة المرور الجديدة.',
            'password.min'         => 'كلمة المرور يجب أن تكون 4 خانات على الأقل.',
            'password.max'         => 'كلمة المرور يجب ألا تتجاوز 50 خانة.',
            'password.confirmed'   => 'تأكيد كلمة المرور غير متطابق.',
        ]);

        $employees = $this->resolveAuthorizedBulkEmployees($validated['employee_ids']);
        $mode = $validated['mode'] ?? 'auto';
        $style = $validated['style'] ?? 'digits';
        $mustChange = (bool) ($validated['must_change_password'] ?? false);
        $revokeTokens = (bool) ($validated['revoke_tokens'] ?? false);
        $openPrintModal = array_key_exists('open_print_modal', $validated) ? (bool) $validated['open_print_modal'] : true;

        $credentialsList = [];

        DB::transaction(function () use (
            $employees,
            $mode,
            $style,
            $validated,
            $mustChange,
            $revokeTokens,
            &$credentialsList
        ) {
            foreach ($employees as $employee) {
                $user = $employee->user;
                if (!$user) {
                    continue;
                }

                $plainPassword = $mode === 'manual'
                    ? $validated['password']
                    : $this->generateSimplePassword($style);

                $user->update([
                    'password'             => Hash::make($plainPassword),
                    'visible_password'     => $plainPassword,
                    'must_change_password' => $mustChange,
                ]);

                if ($revokeTokens) {
                    $user->tokens()->delete();
                }

                $credentialsList[] = $this->buildCredentialsPayload($employee, $user, $plainPassword, 'reset', $revokeTokens);
            }
        });

        if ($openPrintModal && !empty($credentialsList)) {
            \Illuminate\Support\Facades\Session::flash('bulk_generated_credentials', [
                'issued_at' => now()->toIso8601String(),
                'items'     => $credentialsList,
            ]);
        }

        return redirect()->back()->with('success', 'تم إعادة تعيين كلمة المرور لـ ' . count($credentialsList) . ' موظف بنجاح.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'employee_ids'   => ['required', 'array', 'min:1', 'max:500'],
            'employee_ids.*' => ['integer', 'exists:employees,id'],
        ]);

        $authUser = auth()->user();
        $employees = $this->resolveAuthorizedBulkEmployees($validated['employee_ids']);

        $filesToDelete = [];
        $deleted = 0;
        $skippedSelf = false;

        DB::transaction(function () use ($employees, $authUser, &$filesToDelete, &$deleted, &$skippedSelf) {
            foreach ($employees as $employee) {
                if ($authUser && $employee->user_id === $authUser->id) {
                    $skippedSelf = true;
                    continue;
                }

                if ($employee->user?->avatar) {
                    $filesToDelete[] = $employee->user->avatar;
                }
                if ($employee->attachments) {
                    foreach ($employee->attachments as $att) {
                        $filesToDelete[] = $att;
                    }
                }

                if ($employee->user) {
                    $employee->user->delete();
                } else {
                    $employee->delete();
                }
                $deleted++;
            }
        });

        foreach ($filesToDelete as $filePath) {
            Storage::disk('public')->delete($filePath);
        }

        $message = "تم حذف {$deleted} موظف بنجاح.";
        if ($skippedSelf) {
            $message .= ' (تم استثناء حسابك الشخصي).';
        }

        return redirect()->back()->with('success', $message);
    }

    public function bulkWhatsApp(Request $request)
    {
        $validated = $request->validate([
            'employee_ids'   => ['required', 'array', 'min:1', 'max:500'],
            'employee_ids.*' => ['integer', 'exists:employees,id'],
            'message'        => ['required', 'string', 'max:2000'],
        ], [
            'message.required' => 'يرجى كتابة نص رسالة الواتساب.',
            'message.max'      => 'نص الرسالة يجب ألا يتجاوز 2000 حرف.',
        ]);

        $instanceId = config('services.ultramsg.instance_id');
        $token = config('services.ultramsg.token');

        if (!$instanceId || !$token) {
            return redirect()->back()->with('error', 'إعدادات خدمة الواتساب (UltraMsg) غير مكتملة في النظام. يمكنك استخدام الإرسال اليدوي عبر روابط wa.me.');
        }

        $employees = $this->resolveAuthorizedBulkEmployees($validated['employee_ids']);
        $apiUrl = "https://api.ultramsg.com/{$instanceId}/messages/chat";
        $loginUrl = url('/login');

        $sent = 0;
        $failed = 0;
        $noPhone = 0;

        foreach ($employees as $employee) {
            $user = $employee->user;
            if (!$user) {
                $noPhone++;
                continue;
            }

            $to = $user->routeNotificationForWhatsApp();
            if (!$to) {
                $noPhone++;
                continue;
            }

            $plainPassword = $user->getDecryptedVisiblePassword() ?? 'غير محفوظة';
            $body = strtr($validated['message'], [
                '{name}'       => $user->name ?? '',
                '{username}'   => $user->username ?? '',
                '{password}'   => $plainPassword,
                '{department}' => $employee->department?->name ?? 'غير محدد',
                '{job_grade}'  => $employee->jobGrade?->name ?? 'غير محدد',
                '{login_url}'  => $loginUrl,
            ]);

            try {
                $response = Http::timeout(10)->post($apiUrl, [
                    'token' => $token,
                    'to'    => $to,
                    'body'  => $body,
                ]);

                if ($response->successful()) {
                    $sent++;
                } else {
                    $failed++;
                    Log::error("Bulk WhatsApp failed for {$to}: " . $response->body());
                }
            } catch (\Throwable $e) {
                $failed++;
                Log::error('Bulk WhatsApp exception: ' . $e->getMessage());
            }
        }

        if ($sent === 0) {
            return redirect()->back()->with('error', "لم يتم إرسال أي رسالة (بدون رقم جوال: {$noPhone}، فشل: {$failed}).");
        }

        $summary = "تم إرسال {$sent} رسالة واتساب بنجاح";
        if ($noPhone > 0 || $failed > 0) {
            $summary .= " (بدون جوال: {$noPhone}، فشل: {$failed})";
        }

        return redirect()->back()->with('success', $summary . '.');
    }

    private function resolveAuthorizedBulkEmployees(array $employeeIds)
    {
        $authUser = auth()->user();
        $isAdmin = $authUser && $authUser->role && $authUser->role->name === 'مدير النظام';

        $employees = Employee::with(['user.role', 'user.branch', 'department', 'jobGrade'])
            ->whereIn('id', array_values(array_unique($employeeIds)))
            ->get();

        if (!$isAdmin && $authUser) {
            foreach ($employees as $employee) {
                if ($employee->user && $employee->user->branch_id !== $authUser->branch_id) {
                    abort(403, 'لا يمكنك تنفيذ إجراء على موظف خارج فرعك');
                }
            }
        }

        return $employees;
    }

    public function downloadCredentialsPdf(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $employeesList = $this->buildFilteredEmployeesQuery($request)
            ->get()
            ->map(function ($emp) {
                return [
                    'name' => $emp->user->name ?? 'غير محدد',
                    'phone' => $emp->user->phone ?? '',
                    'username' => $emp->user->username ?? '',
                    'password' => $emp->user?->getDecryptedVisiblePassword(),
                    'department' => $emp->department->name ?? 'غير محدد',
                    'jobGrade' => $emp->jobGrade->name ?? 'غير محدد',
                    'job_title' => $emp->job_title ?? '',
                    'role' => $emp->user->role->name ?? '—',
                    'branch_phone' => $emp->user->branch->phone ?? '774804804',
                    'is_active' => (bool) ($emp->user->is_active ?? true),
                ];
            });

        $brandColor = '#5b8a2d';
        $footerHtml = '
            <div style="width: 100%; padding: 0 30px 8px 30px; margin: 0; font-family: tahoma, arial, sans-serif; direction: rtl; box-sizing: border-box;">
                <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 9px; color: #64748b;">
                    <div style="width: 33%; text-align: right;">
                        <strong style="color: ' . $brandColor . ';">مدارس القيم الأهلية</strong> (Smart School)
                    </div>
                    <div style="width: 33%; text-align: center; color: #94a3b8;">
                        طُبع بتاريخ: ' . now()->format('Y-m-d H:i') . '
                    </div>
                    <div style="width: 33%; text-align: left;">
                        <span style="background-color: #f1f5f9; padding: 3px 10px; border-radius: 12px; font-weight: bold; color: #475569; display: inline-block;">
                            صفحة <span class="pageNumber"></span> / <span class="totalPages"></span>
                        </span>
                    </div>
                </div>
            </div>
        ';

        $googlePlayUrl = \App\Models\Setting::get('google_play_url', '');
        $appStoreUrl = \App\Models\Setting::get('app_store_url', '');
        $qrTargetUrl = $googlePlayUrl ?: ($appStoreUrl ?: url('/login'));

        $browserCandidates = [
            'C:\Program Files\Google\Chrome\Application\chrome.exe',
            'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
            'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
            'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        ];
        $chromePath = collect($browserCandidates)->first(fn ($path) => file_exists($path))
            ?? 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe';

        $fileName = 'employees_credentials.pdf';
        $tempPath = storage_path('app/temp-' . uniqid('employees-cred-', true) . '.pdf');

        Pdf::view('pdf.hr.employee-credentials', [
                'employeesList' => $employeesList,
                'brandColor' => $brandColor,
                'loginUrl' => $qrTargetUrl,
            ])
            ->format('A4')
            ->margins(10, 10, 18, 10)
            ->footerHtml($footerHtml)
            ->withBrowsershot(function ($browsershot) use ($chromePath) {
                $browsershot->setChromePath($chromePath)
                           ->setOption('args', ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'])
                           ->timeout(300)
                           ->protocolTimeout(300)
                           ->showBackground()
                           ->waitUntilNetworkIdle()
                           ->delay(1500);
            })
            ->save($tempPath);

        return response()->download($tempPath, $fileName)->deleteFileAfterSend(true);
    }
}
