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
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الطلاب', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة طالب', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل طالب', only: ['edit', 'update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف طالب', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $query = Student::with(['user', 'currentEnrollment.division.grade.section', 'currentEnrollment.academicYear']);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('national_id', 'like', '%' . $search . '%');
            });
        }

        // فلترة حسب القسم الأكاديمي أو السنة
        if ($request->has('academic_year_id') && $request->academic_year_id != '') {
            $query->whereHas('currentEnrollment', function ($q) use ($request) {
                $q->where('academic_year_id', $request->academic_year_id);
            });
        }

        if ($request->has('section_id') && $request->section_id != '') {
            $query->whereHas('currentEnrollment.division.grade.section', function ($q) use ($request) {
                $q->where('id', $request->section_id);
            });
        }

        $students = $query->paginate(15)->withQueryString();
        
        $academicYears = AcademicYear::latest()->get();
        $sections = Section::all();

        return Inertia::render('Academic/Students/Index', compact('students', 'academicYears', 'sections'));
    }

    public function create()
    {
        $parents = User::whereHas('role', fn($q) => $q->where('name', 'ولي أمر'))->select('id', 'name', 'national_id')->get();
        $academicYears = AcademicYear::latest()->get();
        $sections = Section::with('grades.divisions')->get();

        return Inertia::render('Academic/Students/Create', compact('parents', 'academicYears', 'sections'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // بيانات حساب الطالب
            'name'        => 'required|string|max:255',
            'username'    => 'required|string|max:255|unique:users',
            'password'    => 'required|string|min:8',
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
        ]);

        DB::beginTransaction();
        try {
            $studentRole = Role::where('name', 'طالب')->firstOrFail();
            $activeYear = AcademicYear::where('is_active', true)->first();
            
            if (!$activeYear) {
                return back()->withInput()->with('error', 'لا توجد سنة دراسية مفعلة حالياً في النظام.');
            }

            // 1. إنشاء حساب المستخدم
            $user = User::create([
                'name'        => $validated['name'],
                'username'    => $validated['username'],
                'password'    => Hash::make($validated['password']),
                'email'       => $validated['email'] ?? null,
                'phone'       => $validated['phone'] ?? null,
                'national_id' => $validated['national_id'] ?? null,
                'address'     => $validated['address'] ?? null,
                'role_id'     => $studentRole->id,
                'branch_id'   => auth()->user()->branch_id,
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
            return redirect()->route('academic.students')->with('success', 'تم تسجيل الطالب بنجاح.');
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
        $sections = Section::with('grades.divisions')->get();

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
        $user = $student->user;
        $student->delete();
        $user->delete();

        return redirect()->route('academic.students')->with('success', 'تم حذف الطالب بنجاح.');
    }
}
