<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\JobGrade;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JobGradeController extends Controller
{
    public function index(Request $request)
    {
        $query = JobGrade::with(['parent'])->withCount('employees');

        // Calculate summary stats
        $totalGrades = JobGrade::count();
        $averageLevel = round(JobGrade::avg('level') ?? 0, 1);
        $totalEmployees = \App\Models\Employee::whereIn('job_grade_id', JobGrade::select('id'))->count();
        $maxLevel = JobGrade::max('level') ?? 0;

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by Level Range Category
        if ($request->filled('level_range')) {
            if ($request->level_range === 'executive') {
                $query->whereBetween('level', [10, 15]);
            } elseif ($request->level_range === 'supervisory') {
                $query->whereBetween('level', [5, 9]);
            } elseif ($request->level_range === 'entry') {
                $query->whereBetween('level', [1, 4]);
            }
        }

        // Filter by Precise Min Level
        if ($request->filled('min_level')) {
            $query->where('level', '>=', intval($request->min_level));
        }

        // Filter by Precise Max Level
        if ($request->filled('max_level')) {
            $query->where('level', '<=', intval($request->max_level));
        }

        // Filter by Staff Density Range
        if ($request->filled('staff_range')) {
            if ($request->staff_range === 'empty') {
                $query->has('employees', '=', 0);
            } elseif ($request->staff_range === 'low') {
                $query->has('employees', '>=', 1)->has('employees', '<=', 5);
            } elseif ($request->staff_range === 'medium') {
                $query->has('employees', '>=', 6)->has('employees', '<=', 15);
            } elseif ($request->staff_range === 'high') {
                $query->has('employees', '>=', 16);
            }
        }

        // Sorting
        if ($request->filled('sort_by')) {
            if ($request->sort_by === 'level_desc') {
                $query->orderBy('level', 'desc');
            } elseif ($request->sort_by === 'level_asc') {
                $query->orderBy('level', 'asc');
            } elseif ($request->sort_by === 'name_asc') {
                $query->orderBy('name', 'asc');
            } elseif ($request->sort_by === 'name_desc') {
                $query->orderBy('name', 'desc');
            } elseif ($request->sort_by === 'employees_desc') {
                $query->orderBy('employees_count', 'desc');
            } elseif ($request->sort_by === 'employees_asc') {
                $query->orderBy('employees_count', 'asc');
            }
        } else {
            $query->orderBy('level', 'desc');
        }

        $jobGrades = $query->paginate(12)->withQueryString()->through(function ($grade) {
            return [
                'id'             => $grade->id,
                'name'           => $grade->name,
                'level'          => $grade->level,
                'parent'         => $grade->parent ? ['id' => $grade->parent->id, 'name' => $grade->parent->name] : null,
                'employees_count'=> $grade->employees_count,
            ];
        });

        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);
        $branches = $isAdmin ? \App\Models\Branch::select('id', 'name')->get() : [];

        $allGrades = JobGrade::select('id', 'name', 'level', 'parent_id')->orderBy('level', 'asc')->get();

        return Inertia::render('HR/JobGrades/Index', [
            'jobGrades' => $jobGrades,
            'allGrades' => $allGrades,
            'stats'     => [
                'total_grades'    => $totalGrades,
                'average_level'   => $averageLevel,
                'total_employees' => $totalEmployees,
                'max_level'       => $maxLevel,
            ],
            'filters'   => $request->only(['search', 'level_range', 'staff_range', 'sort_by', 'min_level', 'max_level']),
            'branches'  => $branches,
            'isAdmin'   => $isAdmin,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'level'     => 'required|integer|min:1|max:15',
            'branch_id' => 'nullable|exists:branches,id',
            'parent_id' => [
                'nullable',
                'exists:job_grades,id',
                function ($attribute, $value, $fail) use ($request) {
                    if ($value) {
                        $parentLevel = \App\Models\JobGrade::where('id', $value)->value('level');
                        $currentLevel = (int) $request->input('level');
                        if ($parentLevel >= $currentLevel) {
                            $fail('يجب أن يكون المستوى الوظيفي للدرجة المسؤولة أعلى مرتبة (رقم أقل) من الدرجة الحالية.');
                        }
                    }
                },
            ],
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);

        if (!$isAdmin) {
            // مدراء الفروع لا يمكنهم سوى إنشاء درجات وظيفية لفروعهم
            $validated['branch_id'] = $user->branch_id;
        }

        JobGrade::create($validated);

        return redirect()->route('hr.job-grades')->with('success', 'تم إضافة الدرجة الوظيفية بنجاح');
    }

    public function update(Request $request, JobGrade $job_grade)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'level'     => 'required|integer|min:1|max:15',
            'branch_id' => 'nullable|exists:branches,id',
            'parent_id' => [
                'nullable',
                'exists:job_grades,id',
                function ($attribute, $value, $fail) use ($request) {
                    if ($value) {
                        $parentLevel = \App\Models\JobGrade::where('id', $value)->value('level');
                        $currentLevel = (int) $request->input('level');
                        if ($parentLevel >= $currentLevel) {
                            $fail('يجب أن يكون المستوى الوظيفي للدرجة المسؤولة أعلى مرتبة (رقم أقل) من الدرجة الحالية.');
                        }
                    }
                },
            ],
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);

        if (!$isAdmin) {
            // لا يجوز لمدير الفرع أن يغير فرع الدرجة الوظيفية أو يجعلها عامة
            $validated['branch_id'] = $user->branch_id;
        }

        $job_grade->update($validated);

        return redirect()->route('hr.job-grades')->with('success', 'تم تعديل الدرجة الوظيفية بنجاح');
    }

    public function destroy(JobGrade $job_grade)
    {
        if ($job_grade->employees()->exists()) {
            return redirect()->route('hr.job-grades')->with('error', 'لا يمكن حذف الدرجة الوظيفية لأنها مرتبطة بموظفين');
        }
        $job_grade->delete();
        return redirect()->route('hr.job-grades')->with('success', 'تم حذف الدرجة الوظيفية بنجاح');
    }
}
