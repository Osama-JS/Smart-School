<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\ReportTemplate;
use App\Models\JobGrade;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportTemplateController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $branchId = $isAdmin ? session('active_branch_id') : $user->branch_id;
        
        $query = ReportTemplate::with(['jobGrade', 'fields'])->withCount('fields')
            ->where(function($q) use ($branchId) {
                if ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                }
            });

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by job grade
        if ($request->filled('job_grade_id')) {
            $query->where('job_grade_id', $request->job_grade_id);
        }

        $templates = $query->latest()->paginate(10)->withQueryString();

        // Stats
        $baseQuery = ReportTemplate::where(function($q) use ($branchId) {
            if ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            }
        });
        
        $totalTemplates = (clone $baseQuery)->count();
        $totalFields = \App\Models\ReportTemplateField::whereIn('report_template_id', (clone $baseQuery)->pluck('id'))->count();
        $totalReports = \App\Models\Report::whereIn('report_template_id', (clone $baseQuery)->pluck('id'))->count();

        // JobGrade HAS BelongsToBranch trait.
        $jobGrades = JobGrade::withoutGlobalScope('branch_isolation')
            ->where('branch_id', $branchId)
            ->get();

        return Inertia::render('HR/Reports/Templates/Index', [
            'templates' => $templates,
            'jobGrades' => $jobGrades,
            'stats' => [
                'total_templates' => $totalTemplates,
                'total_fields' => $totalFields,
                'total_reports' => $totalReports,
            ],
            'filters' => $request->only(['search', 'job_grade_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'period_type' => 'required|in:daily,weekly,monthly,quarterly,yearly,custom',
            'job_grade_id' => 'required|exists:job_grades,id',
            'fields' => 'nullable|array',
            'fields.*.name' => 'required|string|max:255',
            'fields.*.type' => 'required|in:text,number,select,checkbox,image,textarea,date,time,file,rating,matrix_text',
            'fields.*.options' => 'nullable|array',
            'fields.*.is_required' => 'boolean',
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $branchId = $isAdmin ? session('active_branch_id') : $user->branch_id;

        $template = ReportTemplate::create([
            'branch_id' => $branchId,
            'job_grade_id' => $validated['job_grade_id'],
            'name' => $validated['name'],
            'description' => $validated['description'],
            'period_type' => $validated['period_type'],
        ]);

        if (!empty($validated['fields'])) {
            foreach ($validated['fields'] as $index => $fieldData) {
                $template->fields()->create([
                    'name' => $fieldData['name'],
                    'type' => $fieldData['type'],
                    'options' => $fieldData['options'] ?? null,
                    'is_required' => $fieldData['is_required'] ?? false,
                    'order' => $index,
                ]);
            }
        }

        return redirect()->back()->with('success', 'تم إنشاء القالب بنجاح');
    }

    public function update(Request $request, ReportTemplate $template)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'period_type' => 'required|in:daily,weekly,monthly,quarterly,yearly,custom',
            'job_grade_id' => 'required|exists:job_grades,id',
            'fields' => 'nullable|array',
            'fields.*.id' => 'nullable|exists:report_template_fields,id',
            'fields.*.name' => 'required|string|max:255',
            'fields.*.type' => 'required|in:text,number,select,checkbox,image,textarea,date,time,file,rating,matrix_text',
            'fields.*.options' => 'nullable|array',
            'fields.*.is_required' => 'boolean',
        ]);

        $template->update([
            'job_grade_id' => $validated['job_grade_id'],
            'name' => $validated['name'],
            'description' => $validated['description'],
            'period_type' => $validated['period_type'],
        ]);

        // If 'fields' key is not present or null, maybe we shouldn't delete existing fields.
        // But if it's an empty array, it means user deleted all fields.
        if ($request->has('fields')) {
            $fields = $validated['fields'] ?? [];
            $keptFieldIds = collect($fields)->pluck('id')->filter()->toArray();
            
            $template->fields()->whereNotIn('id', $keptFieldIds)->delete();

            foreach ($fields as $index => $fieldData) {
                $template->fields()->updateOrCreate(
                    ['id' => $fieldData['id'] ?? null],
                    [
                        'name' => $fieldData['name'],
                        'type' => $fieldData['type'],
                        'options' => $fieldData['options'] ?? null,
                        'is_required' => $fieldData['is_required'] ?? false,
                        'order' => $index,
                    ]
                );
            }
        }

        return redirect()->back()->with('success', 'تم تحديث القالب بنجاح');
    }

    public function updateFields(Request $request, ReportTemplate $template)
    {
        $validated = $request->validate([
            'fields' => 'nullable|array',
            'fields.*.id' => 'nullable|exists:report_template_fields,id',
            'fields.*.name' => 'required|string|max:255',
            'fields.*.type' => 'required|in:text,number,select,checkbox,image,textarea,date,time,file,rating,matrix_text',
            'fields.*.options' => 'nullable|array',
            'fields.*.is_required' => 'boolean',
        ]);

        if ($request->has('fields')) {
            $fields = $validated['fields'] ?? [];
            $keptFieldIds = collect($fields)->pluck('id')->filter()->toArray();
            
            $template->fields()->whereNotIn('id', $keptFieldIds)->delete();

            foreach ($fields as $index => $fieldData) {
                $template->fields()->updateOrCreate(
                    ['id' => $fieldData['id'] ?? null],
                    [
                        'name' => $fieldData['name'],
                        'type' => $fieldData['type'],
                        'options' => $fieldData['options'] ?? null,
                        'is_required' => $fieldData['is_required'] ?? false,
                        'order' => $index,
                    ]
                );
            }
        }

        return redirect()->back()->with('success', 'تم تحديث الحقول بنجاح');
    }

    public function destroy(ReportTemplate $template)
    {
        $template->delete();
        return redirect()->back()->with('success', 'تم حذف القالب بنجاح');
    }
}
