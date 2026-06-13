<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Grade;
use App\Models\Division;
use App\Models\AcademicYear;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AcademicStructureController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';
        
        // --- 1. Load Academic Years ---
        $academicYearsQuery = AcademicYear::query();
        if (!$isAdmin) {
            $academicYearsQuery->where(function($q) use ($user) {
                $q->where('branch_id', $user->branch_id)->orWhereNull('branch_id');
            });
        }
        $academicYears = $academicYearsQuery->orderBy('start_date', 'desc')->get();

        // Determine selected academic year (default to active)
        $selectedYearId = $request->input('academic_year_id');
        if (!$selectedYearId) {
            $activeYear = $academicYears->where('is_active', true)->first();
            $selectedYearId = $activeYear ? $activeYear->id : ($academicYears->first()?->id);
        }

        // --- 2. Load Sections and Grades ---
        $sectionsQuery = Section::with('grades');
        if (!$isAdmin) {
            $sectionsQuery->where('branch_id', $user->branch_id);
        }
        $sections = $sectionsQuery->get();

        // --- 3. Load Divisions for the selected Academic Year ---
        $divisions = [];
        if ($selectedYearId) {
            $divQuery = Division::with(['grade.section', 'homeroomTeacher:id,name'])
                ->where('academic_year_id', $selectedYearId);
            
            if (!$isAdmin) {
                $divQuery->where('branch_id', $user->branch_id);
            }
            $divisions = $divQuery->get()->groupBy('grade_id');
        }

        // --- 4. Load Teachers for homeroom_teacher selection ---
        // Load all active users who can be teachers
        $teachersQuery = User::whereHas('role', function($q) {
            $q->where('name', '!=', 'طالب')->where('name', '!=', 'ولي أمر');
        });

        if (!$isAdmin) {
            $teachersQuery->where('branch_id', $user->branch_id);
        }
        
        $teachers = $teachersQuery->select('id', 'name', 'branch_id')->get();

        return Inertia::render('Academic/Structure/Index', [
            'academicYears' => $academicYears,
            'selectedYearId' => $selectedYearId ? (int)$selectedYearId : null,
            'sections' => $sections,
            'divisions' => $divisions,
            'teachers' => $teachers,
            'isAdmin' => $isAdmin,
        ]);
    }

    // --- Section Methods ---
    public function storeSection(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';
        
        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        Section::create($validated);
        return redirect()->back()->with('success', 'تم إضافة المرحلة بنجاح');
    }

    public function updateSection(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $section->update($validated);
        return redirect()->back()->with('success', 'تم تعديل المرحلة بنجاح');
    }

    public function destroySection(Section $section)
    {
        $section->delete();
        return redirect()->back()->with('success', 'تم حذف المرحلة بنجاح');
    }

    // --- Grade Methods ---
    public function storeGrade(Request $request)
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'name' => 'required|string|max:255',
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';
        
        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        Grade::create($validated);
        return redirect()->back()->with('success', 'تم إضافة الصف بنجاح');
    }

    public function updateGrade(Request $request, Grade $grade)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'section_id' => 'required|exists:sections,id',
        ]);

        $grade->update($validated);
        return redirect()->back()->with('success', 'تم تعديل الصف بنجاح');
    }

    public function destroyGrade(Grade $grade)
    {
        $grade->delete();
        return redirect()->back()->with('success', 'تم حذف الصف بنجاح');
    }

    // --- Division Methods ---
    public function storeDivision(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'grade_id' => 'required|exists:grades,id',
            'name' => 'required|string|max:255',
            'max_students' => 'required|integer|min:1|max:100',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';
        
        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        Division::create($validated);
        return redirect()->back()->with('success', 'تم إضافة الشعبة بنجاح');
    }

    public function updateDivision(Request $request, Division $division)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'max_students' => 'required|integer|min:1|max:100',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
        ]);

        $division->update($validated);
        return redirect()->back()->with('success', 'تم تعديل الشعبة بنجاح');
    }

    public function destroyDivision(Division $division)
    {
        $division->delete();
        return redirect()->back()->with('success', 'تم حذف الشعبة بنجاح');
    }

    public function copyDivisions(Request $request)
    {
        $request->validate([
            'from_academic_year_id' => 'required|exists:academic_years,id',
            'to_academic_year_id' => 'required|exists:academic_years,id|different:from_academic_year_id',
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';

        $fromYearId = $request->from_academic_year_id;
        $toYearId = $request->to_academic_year_id;

        $divQuery = Division::where('academic_year_id', $fromYearId);
        if (!$isAdmin) {
            $divQuery->where('branch_id', $user->branch_id);
        }

        $oldDivisions = $divQuery->get();

        if ($oldDivisions->isEmpty()) {
            return redirect()->back()->with('error', 'لا توجد شعب في السنة المصدر لنسخها.');
        }

        DB::beginTransaction();
        try {
            $count = 0;
            foreach ($oldDivisions as $oldDiv) {
                // Check if division with same name and grade already exists in target year
                $exists = Division::where('academic_year_id', $toYearId)
                    ->where('grade_id', $oldDiv->grade_id)
                    ->where('name', $oldDiv->name)
                    ->where('branch_id', $oldDiv->branch_id)
                    ->exists();

                if (!$exists) {
                    $newDiv = $oldDiv->replicate();
                    $newDiv->academic_year_id = $toYearId;
                    // homeroom_teacher_id is copied too, as per user request.
                    $newDiv->save();
                    $count++;
                }
            }

            DB::commit();
            return redirect()->back()->with('success', "تم نسخ {$count} شعبة بنجاح إلى السنة المستهدفة.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء نسخ الشعب: ' . $e->getMessage());
        }
    }
}
