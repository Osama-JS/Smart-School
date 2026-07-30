<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\AppraisalTemplate;
use App\Models\JobGrade;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppraisalTemplateController extends Controller
{
    public function index()
    {
        $templates = AppraisalTemplate::with(['jobGrade', 'kpis'])->withCount('kpis')->get();
        $jobGrades = JobGrade::all();

        return Inertia::render('HR/Appraisals/Templates/Index', [
            'templates' => $templates,
            'jobGrades' => $jobGrades
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'job_grade_id' => 'nullable|exists:job_grades,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'kpis' => 'required|array|min:1',
            'kpis.*.name' => 'required|string',
            'kpis.*.weight' => 'required|numeric|min:1',
        ]);

        $template = AppraisalTemplate::create([
            'title' => $validated['title'],
            'job_grade_id' => $validated['job_grade_id'] ?? null,
            'description' => $validated['description'] ?? '',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        foreach ($validated['kpis'] as $index => $kpi) {
            $template->kpis()->create([
                'name' => $kpi['name'],
                'weight' => $kpi['weight'],
                'order' => $index,
            ]);
        }

        return redirect()->back()->with('success', 'تم إنشاء قالب التقييم بنجاح.');
    }

    public function update(Request $request, AppraisalTemplate $template)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'job_grade_id' => 'nullable|exists:job_grades,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'kpis' => 'required|array|min:1',
        ]);

        $template->update([
            'title' => $validated['title'],
            'job_grade_id' => $validated['job_grade_id'] ?? null,
            'description' => $validated['description'] ?? '',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Delete existing kpis and recreate to keep it simple, or sync. Let's delete and recreate.
        $template->kpis()->delete();
        foreach ($validated['kpis'] as $index => $kpi) {
            $template->kpis()->create([
                'name' => $kpi['name'],
                'weight' => $kpi['weight'],
                'order' => $index,
            ]);
        }

        return redirect()->back()->with('success', 'تم تحديث قالب التقييم بنجاح.');
    }

    public function destroy(AppraisalTemplate $template)
    {
        $template->delete();
        return redirect()->back()->with('success', 'تم حذف قالب التقييم بنجاح.');
    }
}
