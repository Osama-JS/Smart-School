<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Student;
use App\Models\AcademicYear;
use App\Models\Section;
use App\Models\Grade;
use App\Models\Division;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StudentController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الطلاب', only: ['index', 'show', 'export', 'batchCredentials']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة طالب', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل طالب', only: ['edit', 'update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف طالب', only: ['destroy']),
        ];
    }

    /**
     * بناء استعلام فلترة الطلاب الموحد لكافة العمليات (العرض، التصدير، الطباعة المجمعة)
     */
    private function getFilteredStudentsQuery(Request $request)
    {
        $query = Student::with([
            'user',
            'currentEnrollment.division.grade.section',
            'currentEnrollment.academicYear',
            'parents:id,name,phone',
            'medicalRecord'
        ])->whereHas('user');

        // 1. البحث الذكي متعدد الحقول (الاسم، الهوية، اسم المستخدم، هاتف الطالب أو ولي الأمر)
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                      ->orWhere('national_id', 'like', "%{$search}%")
                      ->orWhere('username', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                })->orWhereHas('parents', function ($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            });
        }

        // 2. الفلترة الهرمية (السنة الدراسية -> القسم -> الصف -> الشعبة)
        if ($request->filled('academic_year_id')) {
            $query->whereHas('currentEnrollment', function ($q) use ($request) {
                $q->where('academic_year_id', $request->academic_year_id);
            });
        }

        if ($request->filled('section_id')) {
            $query->whereHas('currentEnrollment.division.grade.section', function ($q) use ($request) {
                $q->where('id', $request->section_id);
            });
        }

        if ($request->filled('grade_id')) {
            $query->whereHas('currentEnrollment.division.grade', function ($q) use ($request) {
                $q->where('id', $request->grade_id);
            });
        }

        if ($request->filled('division_id')) {
            $query->whereHas('currentEnrollment', function ($q) use ($request) {
                $q->where('division_id', $request->division_id);
            });
        }

        // 3. التبويبات السريعة لحالة القيد
        $statusTab = $request->input('status_tab', 'all');
        if ($statusTab === 'active') {
            $query->whereHas('currentEnrollment', function ($q) {
                $q->where('status', 'active');
            });
        } elseif ($statusTab === 'unregistered') {
            $query->whereDoesntHave('currentEnrollment');
        } elseif ($statusTab === 'transferred') {
            $query->whereHas('currentEnrollment', function ($q) {
                $q->whereIn('status', ['transferred', 'withdrawn', 'graduated']);
            });
        } elseif ($statusTab === 'blocked') {
            $query->whereHas('currentEnrollment', function ($q) {
                $q->where('is_result_blocked', true);
            });
        }

        // 4. الفلاتر المتقدمة
        if ($request->filled('transport')) {
            $query->where('transport_subscription', $request->transport === '1' || $request->transport === 'true');
        }

        if ($request->filled('account_status')) {
            if ($request->account_status === 'active') {
                $query->whereHas('user', fn($uq) => $uq->where('is_active', true));
            } elseif ($request->account_status === 'inactive') {
                $query->whereHas('user', fn($uq) => $uq->where('is_active', false));
            } elseif ($request->account_status === 'must_change_password') {
                $query->whereHas('user', fn($uq) => $uq->where('must_change_password', true));
            }
        }

        if ($request->filled('medical')) {
            if ($request->medical === 'has_record') {
                $query->whereHas('medicalRecord');
            } elseif ($request->medical === 'no_record') {
                $query->whereDoesntHave('medicalRecord');
            }
        }

        return $query;
    }

    public function index(Request $request)
    {
        $query = $this->getFilteredStudentsQuery($request);

        $perPage = in_array((int)$request->per_page, [15, 30, 50, 100]) ? (int)$request->per_page : 15;
        $students = $query->paginate($perPage)->withQueryString();
        
        $academicYears = AcademicYear::latest()->get();
        
        $branchId = (auth()->user()->role && auth()->user()->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id')) 
            ? session('active_branch_id') 
            : auth()->user()->branch_id;
            
        // جلب الأقسام محملة بالصفوف والشعب للربط الهرمي الفوري
        $sections = Section::forBranch($branchId)->with('grades.divisions')->get();

        // حساب أعداد الطلاب لكل تبويب حالة
        $baseStatusQuery = Student::whereHas('user');
        $statusCounts = [
            'all' => (clone $baseStatusQuery)->count(),
            'active' => (clone $baseStatusQuery)->whereHas('currentEnrollment', fn($q) => $q->where('status', 'active'))->count(),
            'unregistered' => (clone $baseStatusQuery)->whereDoesntHave('currentEnrollment')->count(),
            'transferred' => (clone $baseStatusQuery)->whereHas('currentEnrollment', fn($q) => $q->whereIn('status', ['transferred', 'withdrawn', 'graduated']))->count(),
            'blocked' => (clone $baseStatusQuery)->whereHas('currentEnrollment', fn($q) => $q->where('is_result_blocked', true))->count(),
        ];

        $filters = [
            'search' => $request->search ?? '',
            'academic_year_id' => $request->academic_year_id ?? '',
            'section_id' => $request->section_id ?? '',
            'grade_id' => $request->grade_id ?? '',
            'division_id' => $request->division_id ?? '',
            'status_tab' => $request->input('status_tab', 'all'),
            'transport' => $request->transport ?? '',
            'account_status' => $request->account_status ?? '',
            'medical' => $request->medical ?? '',
            'per_page' => $perPage,
        ];

        return Inertia::render('Academic/Students/Index', compact('students', 'academicYears', 'sections', 'filters', 'statusCounts'));
    }

    /**
     * تصدير النتائج المفلترة الحالية إلى ملف إكسل بتنسيق مهني مجهز
     */
    public function export(Request $request)
    {
        $students = $this->getFilteredStudentsQuery($request)
                         ->latest('id')
                         ->get();

        if ($request->format === 'json' || $request->wantsJson()) {
            $mapped = $students->map(function ($student) {
                $enroll = $student->currentEnrollment;
                $parent = $student->parents->first();

                $statusLabel = 'غير مسجل';
                $statusKey = 'unregistered';
                if ($enroll) {
                    if ($enroll->is_result_blocked) {
                        $statusLabel = 'محجوب النتيجة';
                        $statusKey = 'blocked';
                    } elseif ($enroll->status === 'active') {
                        $statusLabel = 'نشط';
                        $statusKey = 'active';
                    } elseif ($enroll->status === 'transferred') {
                        $statusLabel = 'منقول';
                        $statusKey = 'transferred';
                    } else {
                        $statusLabel = 'مسحوب/خريج';
                        $statusKey = 'transferred';
                    }
                }

                return [
                    'id' => $student->id,
                    'code' => $student->user->username ?? (string)$student->id,
                    'name' => $student->user->name ?? 'غير محدد',
                    'national_id' => $student->user->national_id ?? '-',
                    'phone' => $student->user->phone ?? '-',
                    'section' => $enroll?->division?->grade?->section?->name ?? '-',
                    'grade' => $enroll?->division?->grade?->name ?? '-',
                    'division' => $enroll?->division?->name ?? '-',
                    'status' => $statusLabel,
                    'status_key' => $statusKey,
                    'parent_name' => $parent->name ?? '-',
                    'parent_phone' => $parent->phone ?? '-',
                ];
            });

            return response()->json([
                'success' => true,
                'total' => $mapped->count(),
                'students' => $mapped,
            ]);
        }

        $filename = 'قائمة_الطلاب_المفلترة_' . date('Y-m-d_H-i') . '.xls';

        $headers = [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        return response()->streamDownload(function () use ($students) {
            echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            echo '<head>';
            echo '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
            echo '<style>';
            echo 'body { font-family: "Segoe UI", Arial, Tahoma, sans-serif; direction: rtl; }';
            echo 'table { border-collapse: collapse; direction: rtl; width: 100%; }';
            echo 'th { background-color: #0f172a; color: #ffffff; font-weight: bold; padding: 12px 10px; border: 1px solid #cbd5e1; text-align: center; font-size: 13px; }';
            echo 'td { padding: 9px 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 12px; }';
            echo '.text-right { text-align: right; }';
            echo '.badge { padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; }';
            echo '.badge-active { background-color: #dcfce7; color: #15803d; }';
            echo '.badge-blocked { background-color: #fee2e2; color: #b91c1c; }';
            echo '.badge-transferred { background-color: #fef3c7; color: #b45309; }';
            echo '.badge-unregistered { background-color: #f1f5f9; color: #64748b; }';
            echo '.title-header { background-color: #1e293b; color: white; font-size: 16px; font-weight: bold; padding: 14px; text-align: center; }';
            echo '.meta-header { background-color: #f8fafc; color: #475569; font-size: 12px; padding: 8px; text-align: center; }';
            echo '</style>';
            echo '</head>';
            echo '<body>';
            echo '<table>';

            // Report Header
            echo '<tr><th colspan="11" class="title-header">سجل الطلاب المفلتر - نظام القيم الأكاديمي</th></tr>';
            echo '<tr><td colspan="11" class="meta-header">تاريخ استخراج التقرير: ' . now()->format('Y-m-d H:i') . ' • إجمالي النتائج: ' . $students->count() . ' طالب</td></tr>';
            echo '<tr><td colspan="11"></td></tr>';

            // Columns
            echo '<tr>';
            echo '<th width="40">#</th>';
            echo '<th width="120">كود الطالب</th>';
            echo '<th width="220" class="text-right">اسم الطالب</th>';
            echo '<th width="120">رقم الهوية</th>';
            echo '<th width="110">رقم الهاتف</th>';
            echo '<th width="130">المرحلة / القسم</th>';
            echo '<th width="120">الصف</th>';
            echo '<th width="80">الشعبة</th>';
            echo '<th width="100">حالة القيد</th>';
            echo '<th width="140">ولي الأمر</th>';
            echo '<th width="110">هاتف ولي الأمر</th>';
            echo '</tr>';

            $index = 1;
            foreach ($students as $student) {
                $enroll = $student->currentEnrollment;
                $parent = $student->parents->first();

                $statusLabel = 'غير مسجل';
                $statusClass = 'badge-unregistered';
                if ($enroll) {
                    if ($enroll->is_result_blocked) {
                        $statusLabel = 'محجوب النتيجة';
                        $statusClass = 'badge-blocked';
                    } elseif ($enroll->status === 'active') {
                        $statusLabel = 'نشط';
                        $statusClass = 'badge-active';
                    } elseif ($enroll->status === 'transferred') {
                        $statusLabel = 'منقول';
                        $statusClass = 'badge-transferred';
                    } else {
                        $statusLabel = 'مسحوب/خريج';
                        $statusClass = 'badge-transferred';
                    }
                }

                echo '<tr>';
                echo '<td>' . $index++ . '</td>';
                echo '<td style="mso-number-format:\'@\';">' . htmlspecialchars($student->user->username ?? $student->id) . '</td>';
                echo '<td class="text-right"><b>' . htmlspecialchars($student->user->name ?? '-') . '</b></td>';
                echo '<td style="mso-number-format:\'@\';">' . htmlspecialchars($student->user->national_id ?? '-') . '</td>';
                echo '<td style="mso-number-format:\'@\';">' . htmlspecialchars($student->user->phone ?? '-') . '</td>';
                echo '<td>' . htmlspecialchars($enroll?->division?->grade?->section?->name ?? '-') . '</td>';
                echo '<td>' . htmlspecialchars($enroll?->division?->grade?->name ?? '-') . '</td>';
                echo '<td>' . htmlspecialchars($enroll?->division?->name ?? '-') . '</td>';
                echo '<td><span class="badge ' . $statusClass . '">' . $statusLabel . '</span></td>';
                echo '<td>' . htmlspecialchars($parent->name ?? '-') . '</td>';
                echo '<td style="mso-number-format:\'@\';">' . htmlspecialchars($parent->phone ?? '-') . '</td>';
                echo '</tr>';
            }

            echo '</table>';
            echo '</body>';
            echo '</html>';
        }, $filename, $headers);
    }

    /**
     * جلب بيانات الدخول لطباعة البطاقات المجمعة للطلاب المفلترين أو المحددين
     */
    public function batchCredentials(Request $request)
    {
        $query = $this->getFilteredStudentsQuery($request);

        if ($request->filled('student_ids')) {
            $ids = is_array($request->student_ids) ? $request->student_ids : explode(',', $request->student_ids);
            $query->whereIn('id', $ids);
        }

        $students = $query->limit(500)->get();

        $credentials = $students->map(function ($student) {
            return [
                'id' => $student->id,
                'name' => $student->user?->name ?? 'طالب',
                'username' => $student->user?->username ?? (string)$student->id,
                'password' => null,
            ];
        });

        return response()->json([
            'success' => true,
            'total' => $credentials->count(),
            'credentials' => $credentials,
        ]);
    }

    public function create()
    {
        $parents = User::whereHas('role', fn($q) => $q->where('name', 'ولي أمر'))->select('id', 'name', 'national_id')->get();
        $academicYears = AcademicYear::latest()->get();
        
        $branchId = (auth()->user()->role && auth()->user()->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id')) 
            ? session('active_branch_id') 
            : auth()->user()->branch_id;
            
        $sections = Section::forBranch($branchId)->with('grades.divisions')->get();

        return Inertia::render('Academic/Students/Create', compact('parents', 'academicYears', 'sections'));
    }

    public function store(Request $request)
    {
        $isAutoGenerate = filter_var($request->input('auto_generate_credentials'), FILTER_VALIDATE_BOOLEAN);

        $rules = [
            // بيانات حساب الطالب
            'name'        => 'required|string|max:255',
            'email'       => 'nullable|email|unique:users',
            'phone'       => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:50',
            'address'     => 'nullable|string',
            'is_active'   => 'boolean',
            
            // بيانات الطالب
            'transport_subscription' => 'boolean',
            'parent_id'              => 'nullable|exists:users,id',
            'relationship_type'      => 'nullable|string|max:50',

            // بيانات التسجيل الأكاديمي
            'division_id'      => 'required|exists:divisions,id',
        ];

        if (!$isAutoGenerate) {
            $rules['username'] = 'required|string|max:255|unique:users';
            $rules['password'] = 'required|string|min:8';
        }

        $validated = $request->validate($rules);

        DB::beginTransaction();
        try {
            $studentRole = Role::where('name', 'طالب')->firstOrFail();
            $activeYear = AcademicYear::where('is_active', true)->first();
            
            if (!$activeYear) {
                return back()->withInput()->with('error', 'لا توجد سنة دراسية مفعلة حالياً في النظام.');
            }

            $username = '';
            $password = '';
            
            if ($isAutoGenerate) {
                // Generate unique academic ID for username
                do {
                    $username = date('Y') . mt_rand(1000, 9999);
                } while (User::where('username', $username)->exists());
                
                $password = \Illuminate\Support\Str::random(8);
            } else {
                $username = $request->input('username');
                $password = $request->input('password');
            }

            $branchId = (auth()->user()->role && auth()->user()->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id')) 
                ? session('active_branch_id') 
                : auth()->user()->branch_id;

            // 1. إنشاء حساب المستخدم
            $user = User::create([
                'name'        => $validated['name'],
                'username'    => $username,
                'password'    => Hash::make($password),
                'email'       => $validated['email'] ?? null,
                'phone'       => $validated['phone'] ?? null,
                'national_id' => $validated['national_id'] ?? null,
                'address'     => $validated['address'] ?? null,
                'role_id'     => $studentRole->id,
                'branch_id'   => $branchId,
                'is_active'   => $validated['is_active'] ?? 1,
            ]);

            // 2. إنشاء ملف الطالب
            $student = Student::create([
                'user_id' => $user->id,
                'transport_subscription' => $validated['transport_subscription'] ?? 0,
            ]);

            // 3. ربط ولي الأمر إن وجد
            if (!empty($validated['parent_id'])) {
                $student->parents()->attach($validated['parent_id'], [
                    'relationship_type' => $validated['relationship_type'] ?? 'أب'
                ]);
            }

            // 4. إنشاء التسجيل الأكاديمي (Enrollment) للسنة المحددة
            Enrollment::create([
                'student_id'       => $student->id,
                'division_id'      => $validated['division_id'],
                'academic_year_id' => $activeYear->id,
                'status'           => 'active',
            ]);

            DB::commit();
            
            $redirect = redirect()->route('academic.students')->with('success', 'تم تسجيل الطالب بنجاح.');
            
            if ($isAutoGenerate) {
                $redirect->with('generated_credentials', [
                    'name'     => $user->name,
                    'username' => $username,
                    'password' => $password,
                ]);
            }
            
            return $redirect;
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء التسجيل: ' . $e->getMessage());
        }
    }

    public function edit(Student $student)
    {
        $student->load(['user', 'parents', 'enrollments.division.grade.section', 'enrollments.academicYear']);
        
        $parents = User::whereHas('role', fn($q) => $q->where('name', 'ولي أمر'))->select('id', 'name', 'national_id')->get();
        $academicYears = AcademicYear::latest()->get();
        
        $branchId = (auth()->user()->role && auth()->user()->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id')) 
            ? session('active_branch_id') 
            : auth()->user()->branch_id;
            
        $sections = Section::forBranch($branchId)->with('grades.divisions')->get();

        return Inertia::render('Academic/Students/Edit', compact('student', 'parents', 'academicYears', 'sections'));
    }

    public function update(Request $request, Student $student)
    {
        $user = $student->user;

        $validated = $request->validate([
            // بيانات حساب الطالب
            'name'        => 'required|string|max:255',
            'username'    => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password'    => 'nullable|string|min:8',
            'email'       => ['nullable', 'email', Rule::unique('users')->ignore($user->id)],
            'phone'       => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:50',
            'address'     => 'nullable|string',
            'is_active'   => 'boolean',
            
            // بيانات الطالب
            'transport_subscription' => 'boolean',
            'parent_id'              => 'nullable|exists:users,id',
            'relationship_type'      => 'nullable|string|max:50',

            // بيانات التسجيل الأكاديمي
            'division_id'      => 'required|exists:divisions,id',
            'enrollment_status'=> 'required|in:active,transferred,withdrawn,graduated',
        ]);

        DB::beginTransaction();
        try {
            $activeYear = AcademicYear::where('is_active', true)->first();
            
            if (!$activeYear) {
                return back()->withInput()->with('error', 'لا توجد سنة دراسية مفعلة حالياً في النظام.');
            }

            // 1. تحديث الحساب
            $user->update([
                'name'        => $validated['name'],
                'username'    => $validated['username'],
                'email'       => $validated['email'] ?? null,
                'phone'       => $validated['phone'] ?? null,
                'national_id' => $validated['national_id'] ?? null,
                'address'     => $validated['address'] ?? null,
                'is_active'   => $validated['is_active'] ?? 1,
            ]);

            if (!empty($validated['password'])) {
                $user->update(['password' => Hash::make($validated['password'])]);
            }

            // 2. تحديث ملف الطالب
            $student->update([
                'transport_subscription' => $validated['transport_subscription'] ?? 0,
            ]);

            // 3. تحديث ولي الأمر
            if (!empty($validated['parent_id'])) {
                $student->parents()->sync([
                    $validated['parent_id'] => ['relationship_type' => $validated['relationship_type'] ?? 'أب']
                ]);
            } else {
                $student->parents()->detach();
            }

            // 4. تحديث أو إضافة التسجيل الأكاديمي (Enrollment)
            // إذا كان هناك تسجيل مسبق لنفس السنة يتم تحديثه، وإلا يتم إنشاء تسجيل جديد لهذه السنة
            $enrollment = Enrollment::where('student_id', $student->id)
                                    ->where('academic_year_id', $activeYear->id)
                                    ->first();

            if ($enrollment) {
                $enrollment->update([
                    'division_id' => $validated['division_id'],
                    'status'      => $validated['enrollment_status'],
                ]);
            } else {
                Enrollment::create([
                    'student_id'       => $student->id,
                    'division_id'      => $validated['division_id'],
                    'academic_year_id' => $activeYear->id,
                    'status'           => $validated['enrollment_status'],
                ]);
            }

            DB::commit();
            return redirect()->route('academic.students')->with('success', 'تم تحديث بيانات الطالب بنجاح.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'حدث خطأ أثناء التحديث: ' . $e->getMessage());
        }
    }

    public function destroy(Student $student)
    {
        $user = clone $student->user;
        $student->delete();
        if ($user) {
            $user->delete();
        }

        return redirect()->route('academic.students')->with('success', 'تم حذف الطالب بنجاح.');
    }

    public function resetPassword(Student $student)
    {
        try {
            $user = $student->user;
            
            if (!$user) {
                return back()->with('error', 'لا يوجد حساب مستخدم مرتبط بهذا الطالب.');
            }

            $newPassword = \Illuminate\Support\Str::random(8);
            
            $user->update([
                'password' => \Illuminate\Support\Facades\Hash::make($newPassword)
            ]);

            return back()->with('success', 'تم إعادة تعيين كلمة المرور بنجاح.')->with('generated_credentials', [
                'name'     => $user->name,
                'username' => $user->username,
                'password' => $newPassword,
            ]);

        } catch (\Exception $e) {
            return back()->with('error', 'حدث خطأ أثناء إعادة تعيين كلمة المرور: ' . $e->getMessage());
        }
    }

    public function template()
    {
        $filename = "students_template_" . date('Y-m-d') . ".xls";
        $headers = [
            "Content-type"        => "application/vnd.ms-excel; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function () {
            echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            echo '<head>';
            echo '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
            echo '</head>';
            echo '<body dir="rtl">';
            echo '<table border="1">';
            echo '<tr>';
            echo '<th style="background-color:#6b9b37;color:white;font-weight:bold;">الاسم الرباعي</th>';
            echo '<th style="background-color:#6b9b37;color:white;font-weight:bold;">الهوية الوطنية</th>';
            echo '<th style="background-color:#6b9b37;color:white;font-weight:bold;">الجوال</th>';
            echo '<th style="background-color:#6b9b37;color:white;font-weight:bold;">البريد الإلكتروني</th>';
            echo '<th style="background-color:#6b9b37;color:white;font-weight:bold;">المرحلة الدراسية</th>';
            echo '<th style="background-color:#6b9b37;color:white;font-weight:bold;">الصف الدراسي</th>';
            echo '<th style="background-color:#6b9b37;color:white;font-weight:bold;">الشعبة</th>';
            echo '</tr>';
            
            // صف تجريبي
            echo '<tr>';
            echo '<td>أحمد محمد صالح</td>';
            echo '<td style="mso-number-format:\'@\';">1000000000</td>';
            echo '<td style="mso-number-format:\'@\';">0500000000</td>';
            echo '<td>ahmed@example.com</td>';
            echo '<td>المرحلة الابتدائية</td>';
            echo '<td>الصف الأول الابتدائي</td>';
            echo '<td>أ</td>';
            echo '</tr>';
            
            echo '</table></body></html>';
        };

        return response()->stream($callback, 200, $headers);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($extension, ['csv', 'txt', 'xlsx', 'xls'])) {
            return redirect()->back()->withErrors(['file' => 'يجب أن يكون الملف بصيغة csv, txt, xlsx, أو xls.']);
        }

        $activeYear = AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            return redirect()->back()->withErrors(['file' => 'لا توجد سنة دراسية مفعلة حالياً في النظام.']);
        }

        $branchId = (auth()->user()->role && auth()->user()->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id')) 
            ? session('active_branch_id') 
            : auth()->user()->branch_id;

        $batchId = 'batch_' . time() . '_' . \Illuminate\Support\Str::random(6);
        $storedPath = $file->storeAs('imports', "students_{$batchId}.{$extension}", 'local');

        // تنفيذ الاستيراد فوراً وبسرعة فائقة (يستغرق ثانية إلى ثانيتين بفضل التشفير المسبق)
        \App\Jobs\ImportStudentsJob::dispatchSync(
            $storedPath,
            auth()->id(),
            $branchId,
            $activeYear->id,
            $batchId
        );

        $status = \Illuminate\Support\Facades\Cache::get("import_status_{$batchId}");
        $credentials = [];
        $credPath = "imports/credentials_{$batchId}.json";
        if (\Illuminate\Support\Facades\Storage::disk('local')->exists($credPath)) {
            $credentials = json_decode(\Illuminate\Support\Facades\Storage::disk('local')->get($credPath), true) ?: [];
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success'     => true,
                'batch_id'    => $batchId,
                'status'      => $status['status'] ?? 'completed',
                'total'       => $status['total'] ?? 0,
                'count'       => $status['success'] ?? 0,
                'errors'      => $status['errors'] ?? [],
                'credentials' => $credentials,
            ]);
        }

        return redirect()->back()
            ->with('import_batch_id', $batchId)
            ->with('info', 'بدأت معالجة ملف استيراد الطلاب بنجاح في الخلفية.');
    }

    public function importStatus(Request $request, $batchId)
    {
        $status = \Illuminate\Support\Facades\Cache::get("import_status_{$batchId}");

        if (!$status) {
            return response()->json([
                'status'   => 'not_found',
                'progress' => 0,
                'total'    => 0,
                'success'  => 0,
                'errors'   => [],
            ]);
        }

        return response()->json($status);
    }

    public function getBatchCredentials($batchId)
    {
        $path = "imports/credentials_{$batchId}.json";
        if (!\Illuminate\Support\Facades\Storage::disk('local')->exists($path)) {
            return response()->json(['credentials' => []]);
        }

        $content = \Illuminate\Support\Facades\Storage::disk('local')->get($path);
        $credentials = json_decode($content, true) ?: [];

        return response()->json(['credentials' => $credentials]);
    }
}
