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
        $query = JobGrade::withCount('employees');

        // Calculate summary stats
        $totalGrades = JobGrade::count();
        $averageLevel = round(JobGrade::avg('level') ?? 0, 1);
        $totalEmployees = \App\Models\Employee::count();
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
                'employees_count'=> $grade->employees_count,
            ];
        });

        return Inertia::render('HR/JobGrades/Index', [
            'jobGrades' => $jobGrades,
            'stats'     => [
                'total_grades'    => $totalGrades,
                'average_level'   => $averageLevel,
                'total_employees' => $totalEmployees,
                'max_level'       => $maxLevel,
            ],
            'filters'   => $request->only(['search', 'level_range', 'staff_range', 'sort_by', 'min_level', 'max_level']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'level' => 'required|integer|min:1|max:15',
        ]);

        JobGrade::create($validated);

        return redirect()->route('hr.job-grades')->with('success', 'تم إضافة الدرجة الوظيفية بنجاح');
    }

    public function update(Request $request, JobGrade $jobGrade)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'level' => 'required|integer|min:1|max:15',
        ]);

        $jobGrade->update($validated);

        return redirect()->route('hr.job-grades')->with('success', 'تم تعديل الدرجة الوظيفية بنجاح');
    }

    public function destroy(JobGrade $jobGrade)
    {
        $jobGrade->delete();
        return redirect()->route('hr.job-grades')->with('success', 'تم حذف الدرجة الوظيفية بنجاح');
    }
}
