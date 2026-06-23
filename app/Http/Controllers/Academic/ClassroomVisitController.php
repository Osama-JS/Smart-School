<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\ClassroomVisit;
use App\Models\User;
use App\Models\Grade;
use App\Models\Division;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class ClassroomVisitController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الزيارات الصفية', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة زيارة صفية', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل زيارة صفية', only: ['edit', 'update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف زيارة صفية', only: ['destroy']),
            new \Illuminate\Routing\Controllers\Middleware('permission:اعتماد زيارة صفية', only: ['approve']),
        ];
    }

    public function index(Request $request)
    {
        $userBranchId = auth()->user()->branch_id;

        $query = ClassroomVisit::with(['teacher', 'supervisor', 'grade', 'division'])
            ->whereHas('grade', function ($q) use ($userBranchId) {
                if ($userBranchId) {
                    $q->where('branch_id', $userBranchId);
                }
            })
            ->latest('visit_date');

        if ($request->has('teacher_id') && $request->teacher_id) {
            $query->where('teacher_id', $request->teacher_id);
        }
        
        if ($request->has('supervisor_id') && $request->supervisor_id) {
            $query->where('supervisor_id', $request->supervisor_id);
        }

        if ($request->has('grade_id') && $request->grade_id) {
            $query->where('grade_id', $request->grade_id);
        }

        if ($request->has('date_range') && $request->date_range) {
            $dates = explode(' to ', $request->date_range);
            if (count($dates) == 2) {
                $query->whereDate('visit_date', '>=', trim($dates[0]))
                      ->whereDate('visit_date', '<=', trim($dates[1]));
            } else {
                $query->whereDate('visit_date', trim($dates[0]));
            }
        }

        $visits = $query->paginate(15)->withQueryString();
        
        // جلب المعلمين فقط في نفس الفرع
        $teachersQuery = User::whereHas('role', function($q) {
            $q->where('name', 'معلم');
        });
        if ($userBranchId) {
            $teachersQuery->where('branch_id', $userBranchId);
        }
        $teachers = $teachersQuery->get(['id', 'name']);

        // جلب الصفوف في نفس الفرع
        $gradesQuery = Grade::with('divisions');
        if ($userBranchId) {
            $gradesQuery->where('branch_id', $userBranchId);
        }
        $grades = $gradesQuery->get();

        // جلب المشرفين في نفس الفرع
        $supervisorsQuery = User::whereHas('role', function($q) {
            $q->where('name', '!=', 'طالب')->where('name', '!=', 'ولي أمر');
        });
        if ($userBranchId) {
            $supervisorsQuery->where('branch_id', $userBranchId);
        }
        $supervisors = $supervisorsQuery->get(['id', 'name']);

        return Inertia::render('Academic/ClassroomVisits/Index', [
            'visits' => $visits,
            'teachers' => $teachers,
            'supervisors' => $supervisors,
            'grades' => $grades,
            'filters' => $request->only(['teacher_id', 'supervisor_id', 'grade_id', 'date_range'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'grade_id' => 'required|exists:grades,id',
            'division_id' => 'required|exists:divisions,id',
            'visit_date' => 'required|date',
            'visit_type' => 'required|string',
            'discussed_points' => 'nullable|string',
            'notes' => 'nullable|string',
            'supervisor_signature' => 'nullable|string', // Base64
        ]);

        $activeYear = AcademicYear::where('is_active', true)->first();
        
        $visit = new ClassroomVisit($validated);
        $visit->supervisor_id = Auth::id();
        $visit->academic_year_id = $activeYear ? $activeYear->id : null;
        $visit->score = $request->input('score', 0);
        
        if ($request->filled('supervisor_signature')) {
            $imageParts = explode(";base64,", $request->supervisor_signature);
            if (count($imageParts) == 2) {
                $imageTypeAux = explode("image/", $imageParts[0]);
                $imageType = $imageTypeAux[1];
                $imageBase64 = base64_decode($imageParts[1]);
                $fileName = 'signatures/visits_supervisor_' . time() . '_' . uniqid() . '.' . $imageType;
                Storage::disk('public')->put($fileName, $imageBase64);
                $visit->supervisor_signature = $fileName;
            }
        }

        $visit->save();

        return back()->with('success', 'تم تسجيل الزيارة الصفية بنجاح.');
    }

    public function update(Request $request, ClassroomVisit $classroomVisit)
    {
        if ($classroomVisit->is_approved) {
            return back()->with('error', 'لا يمكن تعديل زيارة معتمدة.');
        }

        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'grade_id' => 'required|exists:grades,id',
            'division_id' => 'required|exists:divisions,id',
            'visit_date' => 'required|date',
            'visit_type' => 'required|string',
            'discussed_points' => 'nullable|string',
            'notes' => 'nullable|string',
            'supervisor_signature' => 'nullable|string', 
        ]);

        $classroomVisit->fill($request->except('supervisor_signature'));

        if ($request->filled('supervisor_signature') && str_starts_with($request->supervisor_signature, 'data:image')) {
            if ($classroomVisit->supervisor_signature) {
                Storage::disk('public')->delete($classroomVisit->supervisor_signature);
            }
            $imageParts = explode(";base64,", $request->supervisor_signature);
            if (count($imageParts) == 2) {
                $imageTypeAux = explode("image/", $imageParts[0]);
                $imageType = $imageTypeAux[1];
                $imageBase64 = base64_decode($imageParts[1]);
                $fileName = 'signatures/visits_supervisor_' . time() . '_' . uniqid() . '.' . $imageType;
                Storage::disk('public')->put($fileName, $imageBase64);
                $classroomVisit->supervisor_signature = $fileName;
            }
        }

        $classroomVisit->save();

        return back()->with('success', 'تم تعديل الزيارة الصفية بنجاح.');
    }

    public function destroy(ClassroomVisit $classroomVisit)
    {
        if ($classroomVisit->is_approved) {
            return back()->with('error', 'لا يمكن حذف زيارة معتمدة.');
        }

        if ($classroomVisit->supervisor_signature) {
            Storage::disk('public')->delete($classroomVisit->supervisor_signature);
        }
        if ($classroomVisit->teacher_signature) {
            Storage::disk('public')->delete($classroomVisit->teacher_signature);
        }

        $classroomVisit->delete();

        return back()->with('success', 'تم حذف الزيارة الصفية.');
    }

    public function approve(Request $request, ClassroomVisit $classroomVisit)
    {
        if (!$classroomVisit->teacher_signature) {
            return back()->with('error', 'لا يمكن اعتماد الزيارة قبل أن يقوم المعلم بالتوقيع.');
        }

        $request->validate([
            'score' => 'required|numeric|min:0|max:100',
        ]);

        $classroomVisit->score = $request->score;
        $classroomVisit->is_approved = true;
        $classroomVisit->save();

        return back()->with('success', 'تم اعتماد الزيارة وتقييم المعلم بنجاح. لا يمكن تعديلها بعد الآن.');
    }

    public function teacherSign(Request $request, ClassroomVisit $classroomVisit)
    {
        if ($classroomVisit->is_approved) {
            return back()->with('error', 'الزيارة معتمدة مسبقاً ولا يمكن تعديل توقيع المعلم.');
        }

        $request->validate([
            'teacher_signature' => 'required|string',
        ]);

        if (str_starts_with($request->teacher_signature, 'data:image')) {
            if ($classroomVisit->teacher_signature) {
                Storage::disk('public')->delete($classroomVisit->teacher_signature);
            }
            $imageParts = explode(";base64,", $request->teacher_signature);
            if (count($imageParts) == 2) {
                $imageTypeAux = explode("image/", $imageParts[0]);
                $imageType = $imageTypeAux[1];
                $imageBase64 = base64_decode($imageParts[1]);
                $fileName = 'signatures/visits_teacher_' . time() . '_' . uniqid() . '.' . $imageType;
                Storage::disk('public')->put($fileName, $imageBase64);
                $classroomVisit->teacher_signature = $fileName;
                $classroomVisit->save();

                return back()->with('success', 'تم حفظ توقيع المعلم بنجاح.');
            }
        }

        return back()->with('error', 'حدث خطأ أثناء حفظ التوقيع.');
    }
}
