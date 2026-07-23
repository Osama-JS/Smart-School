<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudyPlanTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudyPlanTemplateController extends Controller
{
    public function index()
    {
        $branchId = \Illuminate\Support\Facades\Auth::user()->branch_id ?? null;

        $academicYears = \App\Models\AcademicYear::with('semesters')->where('is_active', true)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get(['id', 'name']);

        $templates = StudyPlanTemplate::with(['academicYear', 'semester'])
        ->when($branchId, function ($query, $branchId) {
            return $query->where('branch_id', $branchId)->orWhereNull('branch_id');
        })
        ->latest()
        ->paginate(15);

        return Inertia::render('Academic/StudyPlanTemplates/Index', [
            'templates' => $templates,
            'academicYears' => $academicYears
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'month' => 'required|string|max:100',
            'academic_year_id' => 'required|exists:academic_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'columns' => 'required|array|min:1',
            'columns.*.id' => 'required|string',
            'columns.*.label' => 'required|string',
            'columns.*.type' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $branchId = \Illuminate\Support\Facades\Auth::user()->branch_id ?? null;

        StudyPlanTemplate::create([
            'branch_id' => $branchId,
            'academic_year_id' => $validated['academic_year_id'],
            'semester_id' => $validated['semester_id'] ?? null,
            'name' => $validated['name'],
            'month' => $validated['month'],
            'columns' => $validated['columns'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->back()->with('success', 'تم إنشاء قالب الخطة الدراسية بنجاح.');
    }

    public function update(Request $request, StudyPlanTemplate $studyPlanTemplate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'month' => 'required|string|max:100',
            'academic_year_id' => 'required|exists:academic_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'columns' => 'required|array|min:1',
            'columns.*.id' => 'required|string',
            'columns.*.label' => 'required|string',
            'columns.*.type' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $studyPlanTemplate->update([
            'name' => $validated['name'],
            'month' => $validated['month'],
            'academic_year_id' => $validated['academic_year_id'],
            'semester_id' => $validated['semester_id'] ?? null,
            'columns' => $validated['columns'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->back()->with('success', 'تم تحديث قالب الخطة الدراسية بنجاح.');
    }

    public function destroy(StudyPlanTemplate $studyPlanTemplate)
    {
        if ($studyPlanTemplate->studyPlans()->exists()) {
            return redirect()->back()->withErrors(['error' => 'لا يمكن حذف القالب لارتباطه بخطط دراسية موجودة. يمكن تعطيله بدلاً من ذلك.']);
        }

        $studyPlanTemplate->delete();

        return redirect()->back()->with('success', 'تم حذف قالب الخطة الدراسية بنجاح.');
    }
}
