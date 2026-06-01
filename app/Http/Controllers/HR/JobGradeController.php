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

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $jobGrades = $query->orderBy('level', 'desc')->paginate(12)->through(function ($grade) {
            return [
                'id'             => $grade->id,
                'name'           => $grade->name,
                'level'          => $grade->level,
                'employees_count'=> $grade->employees_count,
            ];
        });

        return Inertia::render('HR/JobGrades/Index', [
            'jobGrades' => $jobGrades,
            'filters'   => $request->only(['search']),
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
