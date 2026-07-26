<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudentViolationType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentViolationTypeController extends Controller
{
    public function index()
    {
        $types = StudentViolationType::where('branch_id', auth()->user()->branch_id)->get();
        
        return Inertia::render('Academic/StudentDiscipline/Types/Index', [
            'types' => $types
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'degree' => 'required|string',
            'first_time_action' => 'nullable|string',
            'second_time_action' => 'nullable|string',
            'third_time_action' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;

        StudentViolationType::create($validated);

        return redirect()->back()->with('success', 'تم إضافة نوع المخالفة بنجاح');
    }

    public function update(Request $request, StudentViolationType $studentViolationType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'degree' => 'required|string',
            'first_time_action' => 'nullable|string',
            'second_time_action' => 'nullable|string',
            'third_time_action' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $studentViolationType->update($validated);

        return redirect()->back()->with('success', 'تم التعديل بنجاح');
    }

    public function destroy(StudentViolationType $studentViolationType)
    {
        $studentViolationType->delete();
        return redirect()->back()->with('success', 'تم الحذف بنجاح');
    }
}
