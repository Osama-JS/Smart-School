<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';

        // Load subjects with their attached grades and branch
        $query = Subject::with(['grades.section', 'branch']);

        if (!$isAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $subjects = $query->latest()->get();

        // Load sections with grades for the Add/Edit Modal
        $sectionsQuery = Section::with('grades');
        if (!$isAdmin) {
            $sectionsQuery->where('branch_id', $user->branch_id);
        }
        $sections = $sectionsQuery->get();

        $branches = [];
        if ($isAdmin) {
            $branches = \App\Models\Branch::select('id', 'name')->get();
        }

        return Inertia::render('Academic/Subjects/Index', [
            'subjects' => $subjects,
            'sections' => $sections,
            'branches' => $branches,
            'isAdmin'  => $isAdmin,
            'filters'  => $request->only('search')
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';

        $rules = [
            'name'        => 'required|string|max:255',
            'icon'        => 'nullable|string|max:50',
            'grade_ids'   => 'required|array|min:1',
            'grade_ids.*' => 'exists:grades,id',
        ];

        if ($isAdmin) {
            $rules['branch_id'] = 'required|exists:branches,id';
        }

        $validated = $request->validate($rules, [
            'grade_ids.required' => 'يجب اختيار صف دراسي واحد على الأقل',
            'grade_ids.array'    => 'صيغة البيانات غير صحيحة',
            'grade_ids.min'      => 'يجب اختيار صف دراسي واحد على الأقل',
            'branch_id.required' => 'يجب تحديد الفرع',
        ]);

        DB::beginTransaction();
        try {
            $subjectData = [
                'name' => $validated['name'],
                'icon' => $validated['icon'] ?? null,
                'branch_id' => $isAdmin ? $validated['branch_id'] : $user->branch_id,
            ];

            $subject = Subject::create($subjectData);
            $subject->grades()->sync($validated['grade_ids']);

            DB::commit();
            return redirect()->back()->with('success', 'تم إضافة المادة الدراسية بنجاح وربطها بالصفوف المحددة');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء الإضافة: ' . $e->getMessage());
        }
    }

    public function update(Request $request, Subject $subject)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';

        $rules = [
            'name'        => 'required|string|max:255',
            'icon'        => 'nullable|string|max:50',
            'grade_ids'   => 'required|array|min:1',
            'grade_ids.*' => 'exists:grades,id',
        ];

        if ($isAdmin) {
            $rules['branch_id'] = 'required|exists:branches,id';
        }

        $validated = $request->validate($rules, [
            'grade_ids.required' => 'يجب اختيار صف دراسي واحد على الأقل',
            'branch_id.required' => 'يجب تحديد الفرع',
        ]);

        if (!$isAdmin && $subject->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بتعديل بيانات هذا الفرع');
        }

        DB::beginTransaction();
        try {
            $subject->update([
                'name' => $validated['name'],
                'icon' => $validated['icon'] ?? null,
                'branch_id' => $isAdmin ? $validated['branch_id'] : $user->branch_id,
            ]);
            $subject->grades()->sync($validated['grade_ids']);

            DB::commit();
            return redirect()->back()->with('success', 'تم تعديل المادة الدراسية بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء التعديل: ' . $e->getMessage());
        }
    }

    public function destroy(Subject $subject)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير الفرع';

        if (!$isAdmin && $subject->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك');
        }

        $subject->grades()->detach();
        $subject->delete();
        
        return redirect()->back()->with('success', 'تم حذف المادة الدراسية بنجاح');
    }
}
