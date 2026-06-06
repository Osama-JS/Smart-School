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

        // Live Search
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by Type (Main or Sub)
        if ($request->filled('type')) {
            if ($request->type === 'main') {
                $query->whereNull('parent_id');
            } elseif ($request->type === 'sub') {
                $query->whereNotNull('parent_id');
            }
        }

        // Filter by Parent Department
        if ($request->filled('parent_filter_id')) {
            $query->where('parent_id', $request->parent_filter_id);
        }

        // Filter by Staff Density Range
        if ($request->filled('staff_range')) {
            if ($request->staff_range === 'empty') {
                $query->has('employees', '=', 0);
            } elseif ($request->staff_range === 'low') {
                $query->has('employees', '>=', 1)->has('employees', '<=', 2);
            } elseif ($request->staff_range === 'medium') {
                $query->has('employees', '>=', 3)->has('employees', '<=', 9);
            } elseif ($request->staff_range === 'high') {
                $query->has('employees', '>=', 10);
            }
        }

        // Sorting
        if ($request->filled('sort_by')) {
            if ($request->sort_by === 'name_asc') {
                $query->orderBy('name', 'asc');
            } elseif ($request->sort_by === 'name_desc') {
                $query->orderBy('name', 'desc');
            } elseif ($request->sort_by === 'employees_desc') {
                $query->orderBy('employees_count', 'desc');
            } elseif ($request->sort_by === 'employees_asc') {
                $query->orderBy('employees_count', 'asc');
            }
        } else {
            $query->orderBy('parent_id')->orderBy('name');
        }

        $departments = $query->paginate(12)->withQueryString()->through(function ($dept) {
            return [
                'id'             => $dept->id,
                'name'           => $dept->name,
                'parent_id'      => $dept->parent_id,
                'parent_name'    => $dept->parent ? $dept->parent->name : null,
                'employees_count'=> $dept->employees_count,
            ];
        });

        // Build tree for tree-view (remains full hierarchical layout representation)
        $allDepts = Department::with('children')->whereNull('parent_id')->get();
        $tree = $this->buildTree($allDepts);

        $parentOptions = Department::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('HR/Departments/Index', [
            'departments'   => $departments,
            'tree'          => $tree,
            'parentOptions' => $parentOptions,
            'filters'       => $request->only(['search', 'type', 'parent_filter_id', 'staff_range', 'sort_by']),
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
