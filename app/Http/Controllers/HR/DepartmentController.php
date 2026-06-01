<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::with('parent')->withCount('employees');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $departments = $query->orderBy('parent_id')->paginate(12)->through(function ($dept) {
            return [
                'id'             => $dept->id,
                'name'           => $dept->name,
                'parent_id'      => $dept->parent_id,
                'parent_name'    => $dept->parent ? $dept->parent->name : null,
                'employees_count'=> $dept->employees_count,
            ];
        });

        // Build tree for tree-view
        $allDepts = Department::with('children')->whereNull('parent_id')->get();
        $tree = $this->buildTree($allDepts);

        $parentOptions = Department::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('HR/Departments/Index', [
            'departments'   => $departments,
            'tree'          => $tree,
            'parentOptions' => $parentOptions,
            'filters'       => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'parent_id' => 'nullable|exists:departments,id',
        ]);

        Department::create($validated);

        return redirect()->route('hr.departments')->with('success', 'تم إضافة القسم بنجاح');
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'parent_id' => 'nullable|exists:departments,id',
        ]);

        $department->update($validated);

        return redirect()->route('hr.departments')->with('success', 'تم تعديل القسم بنجاح');
    }

    public function destroy(Department $department)
    {
        $department->delete();
        return redirect()->route('hr.departments')->with('success', 'تم حذف القسم بنجاح');
    }

    private function buildTree($departments)
    {
        return $departments->map(function ($dept) {
            return [
                'id'       => $dept->id,
                'name'     => $dept->name,
                'children' => $this->buildTree($dept->children),
            ];
        })->values()->toArray();
    }
}
