<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\AppraisalTemplate;
use App\Models\EmployeeAppraisal;
use App\Models\JobGrade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $validated = $this->validateTemplate($request);

        DB::transaction(function () use ($validated) {
            $template = AppraisalTemplate::create([
                'title' => $validated['title'],
                'job_grade_id' => $validated['job_grade_id'] ?? null,
                'description' => $validated['description'] ?? '',
                'is_active' => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['kpis'] as $index => $kpi) {
                $roles = $kpi['evaluator_roles'] ?? null;
                if (is_array($roles) && (empty($roles) || in_array('all', $roles, true))) {
                    $roles = null;
                }
                $template->kpis()->create([
                    'name' => $kpi['name'],
                    'category' => $kpi['category'] ?? null,
                    'evaluator_roles' => $roles,
                    'description' => $kpi['description'] ?? null,
                    'weight' => $kpi['weight'],
                    'order' => $index,
                ]);
            }
        });

        return redirect()->back()->with('success', 'تم إنشاء قالب التقييم بنجاح.');
    }

    public function update(Request $request, AppraisalTemplate $template)
    {
        $validated = $this->validateTemplate($request);

        DB::transaction(function () use ($validated, $template) {
            $template->update([
                'title' => $validated['title'],
                'job_grade_id' => $validated['job_grade_id'] ?? null,
                'description' => $validated['description'] ?? '',
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $keptIds = collect($validated['kpis'])
                ->pluck('id')
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->all();

            if (!empty($keptIds)) {
                $template->kpis()->whereNotIn('id', $keptIds)->delete();
            } else {
                $template->kpis()->delete();
            }

            $newKpiIds = [];
            foreach ($validated['kpis'] as $index => $kpiData) {
                $roles = $kpiData['evaluator_roles'] ?? null;
                if (is_array($roles) && (empty($roles) || in_array('all', $roles, true))) {
                    $roles = null;
                }
                $attributes = [
                    'name' => $kpiData['name'],
                    'category' => $kpiData['category'] ?? null,
                    'evaluator_roles' => $roles,
                    'description' => $kpiData['description'] ?? null,
                    'weight' => $kpiData['weight'],
                    'order' => $index,
                ];

                $existing = !empty($kpiData['id']) ? $template->kpis()->find($kpiData['id']) : null;
                if ($existing) {
                    $existing->update($attributes);
                } else {
                    $created = $template->kpis()->create($attributes);
                    $newKpiIds[] = $created->id;
                }
            }

            if (!empty($newKpiIds)) {
                $activeAppraisals = EmployeeAppraisal::where('template_id', $template->id)
                    ->where('status', '!=', 'completed')
                    ->get();

                foreach ($activeAppraisals as $appraisal) {
                    foreach ($newKpiIds as $kpiId) {
                        $appraisal->scores()->firstOrCreate(['kpi_id' => $kpiId]);
                    }
                }
            }
        });

        return redirect()->back()->with('success', 'تم تحديث قالب التقييم بنجاح دون التأثير على تقييمات الموظفين السابقة.');
    }

    private function validateTemplate(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'job_grade_id' => 'nullable|exists:job_grades,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'kpis' => 'required|array|min:1',
            'kpis.*.id' => 'nullable|integer',
            'kpis.*.name' => 'required|string|max:255',
            'kpis.*.category' => 'nullable|string|max:100',
            'kpis.*.evaluator_roles' => 'nullable|array',
            'kpis.*.evaluator_roles.*' => 'nullable|string|max:255',
            'kpis.*.description' => 'nullable|string|max:1000',
            'kpis.*.weight' => 'required|numeric|min:1',
        ]);
    }

    public function destroy(AppraisalTemplate $template)
    {
        $template->delete();
        return redirect()->back()->with('success', 'تم حذف قالب التقييم بنجاح.');
    }
}
