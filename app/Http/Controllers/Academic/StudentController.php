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
        $query = Student::with(['user', 'currentEnrollment.division.grade.section', 'currentEnrollment.academicYear'])
                        ->whereHas('user');

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
        
        $branchId = (auth()->user()->role && auth()->user()->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id')) 
            ? session('active_branch_id') 
            : auth()->user()->branch_id;
            
        $sections = Section::forBranch($branchId)->get();

        return Inertia::render('Academic/Students/Index', compact('students', 'academicYears', 'sections'));
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
            echo '<td>ابتدائي</td>';
            echo '<td>الصف الأول</td>';
            echo '<td>الشعبة أ</td>';
            echo '</tr>';
            
            echo '</table></body></html>';
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

        if (in_array($extension, ['csv', 'txt'])) {
            if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
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
                if ($xlsx = \Shuchkin\SimpleXLSX::parse($file->getRealPath())) {
                    $rows = $xlsx->rows();
                } else {
                    return redirect()->back()->withErrors(['file' => 'فشل في قراءة ملف الإكسل. يرجى التأكد من الصيغة.']);
                }
            }
            
            if (empty($rows)) {
                 return redirect()->back()->withErrors(['file' => 'الملف فارغ أو لا يمكن قراءة محتواه.']);
            }
        }

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

        $activeYear = AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            return redirect()->back()->withErrors(['file' => 'لا توجد سنة دراسية مفعلة حالياً في النظام.']);
        }

        $branchId = (auth()->user()->role && auth()->user()->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id')) 
            ? session('active_branch_id') 
            : auth()->user()->branch_id;

        $divisions = \App\Models\Division::with(['grade.section'])
            ->where('branch_id', $branchId)
            ->where('academic_year_id', $activeYear->id)
            ->get();

        $divisionMap = [];
        foreach ($divisions as $div) {
            $key = mb_strtolower(trim($div->grade->section->name ?? '') . '|' . trim($div->grade->name ?? '') . '|' . trim($div->name ?? ''));
            $divisionMap[$key] = $div->id;
        }

        $studentRole = Role::where('name', 'طالب')->first();
        if (!$studentRole) {
            return redirect()->back()->withErrors(['file' => 'لم يتم العثور على صلاحية (طالب) في النظام.']);
        }

        $successCount = 0;
        $errors = [];
        $importedCredentials = [];

        foreach ($dataRows as $index => $row) {
            if (empty(array_filter($row))) continue;
            
            $name = trim($row[0] ?? '');
            $nationalId = trim($row[1] ?? '');
            $phone = trim($row[2] ?? '');
            $email = trim($row[3] ?? '');
            $sectionName = trim($row[4] ?? '');
            $gradeName = trim($row[5] ?? '');
            $divisionName = trim($row[6] ?? '');

            $rowNumber = $headerIndex + 2 + $index;

            if (empty($name) || empty($sectionName) || empty($gradeName) || empty($divisionName)) {
                $errors[] = "الصف رقم $rowNumber: الاسم، المرحلة، الصف، والشعبة بيانات مطلوبة.";
                continue;
            }

            $divKey = mb_strtolower($sectionName . '|' . $gradeName . '|' . $divisionName);
            $divisionId = $divisionMap[$divKey] ?? null;

            if (!$divisionId) {
                $errors[] = "الصف رقم $rowNumber: الشعبة ($divisionName) في ($gradeName - $sectionName) غير موجودة.";
                continue;
            }

            try {
                DB::beginTransaction();

                do {
                    $username = date('Y') . mt_rand(1000, 9999);
                } while (User::where('username', $username)->exists());
                
                $password = \Illuminate\Support\Str::random(8);

                $user = User::create([
                    'name'        => $name,
                    'username'    => $username,
                    'password'    => Hash::make($password),
                    'email'       => !empty($email) ? $email : null,
                    'phone'       => !empty($phone) ? $phone : null,
                    'national_id' => !empty($nationalId) ? $nationalId : null,
                    'role_id'     => $studentRole->id,
                    'branch_id'   => $branchId,
                    'is_active'   => true,
                ]);

                $student = Student::create([
                    'user_id' => $user->id,
                    'transport_subscription' => 0,
                ]);

                Enrollment::create([
                    'student_id'       => $student->id,
                    'division_id'      => $divisionId,
                    'academic_year_id' => $activeYear->id,
                    'status'           => 'active',
                ]);

                DB::commit();
                $successCount++;
                
                $importedCredentials[] = [
                    'name'     => $name,
                    'username' => $username,
                    'password' => $password
                ];

            } catch (\Exception $e) {
                DB::rollBack();
                $errors[] = "الصف رقم $rowNumber: خطأ تقني (" . $e->getMessage() . ").";
            }
        }

        $message = "تم استيراد $successCount طالب بنجاح.";
        
        $redirect = redirect()->back()->with('success', $message);
        
        if (count($importedCredentials) > 0) {
            $redirect->with('imported_credentials', $importedCredentials);
        }
        
        if (count($errors) > 0) {
            $redirect->with('import_errors', $errors);
        }

        return $redirect;
    }
}
