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

class ClassroomVisitController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('عرض الزيارات الصفية');

        $query = ClassroomVisit::with(['teacher', 'supervisor', 'grade', 'division'])
            ->latest('visit_date');

        if ($request->has('teacher_id') && $request->teacher_id) {
            $query->where('teacher_id', $request->teacher_id);
        }
        
        if ($request->has('grade_id') && $request->grade_id) {
            $query->where('grade_id', $request->grade_id);
        }

        $visits = $query->paginate(15)->withQueryString();
        
        // جلب المعلمين فقط
        $teachers = User::whereHas('roles', function($q) {
            $q->where('name', 'teacher');
        })->get(['id', 'name']);

        $grades = Grade::with('divisions')->get();

        return Inertia::render('Academic/ClassroomVisits/Index', [
            'visits' => $visits,
            'teachers' => $teachers,
            'grades' => $grades,
            'filters' => $request->only(['teacher_id', 'grade_id'])
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('إضافة زيارة صفية');

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
        $this->authorize('تعديل زيارة صفية');

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
        $this->authorize('حذف زيارة صفية');

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

    public function approve(ClassroomVisit $classroomVisit)
    {
        $this->authorize('اعتماد زيارة صفية');

        $classroomVisit->is_approved = true;
        $classroomVisit->save();

        return back()->with('success', 'تم اعتماد الزيارة الصفية بنجاح. لا يمكن تعديلها بعد الآن.');
    }
}
