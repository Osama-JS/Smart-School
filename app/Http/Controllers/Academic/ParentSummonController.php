<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\ParentSummon;
use App\Models\Student;
use App\Models\StudentViolation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ParentSummonController extends Controller
{
    public function index()
    {
        $branchId = auth()->user()->branch_id;
        
        $summons = ParentSummon::with(['student.user', 'violation.violationType'])
            ->where('branch_id', $branchId)
            ->latest()
            ->get();
            
        // For simple lookup in the form
        $students = Student::with('user')->whereHas('user', function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        })->get();

        $violations = StudentViolation::with('violationType')
            ->where('branch_id', $branchId)
            ->where('status', 'pending') // Maybe only show pending violations for summons
            ->get();

        return Inertia::render('Academic/StudentDiscipline/Summons/Index', [
            'summons' => $summons,
            'students' => $students,
            'violations' => $violations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'student_violation_id' => 'nullable|exists:student_violations,id',
            'summon_date' => 'required|date',
            'reason' => 'required|string',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;
        $validated['status'] = 'scheduled';

        $summon = ParentSummon::create($validated);

        // Parent Notification
        $student = Student::with(['parents'])->find($validated['student_id']);
        if ($student) {
            foreach ($student->parents as $parent) {
                $parent->notify(new \App\Notifications\ParentSummonIssuedNotification($summon));
            }
        }

        return redirect()->back()->with('success', 'تم إنشاء استدعاء ولي الأمر بنجاح وإرسال الإشعارات.');
    }

    public function update(Request $request, ParentSummon $parentSummon)
    {
        $validated = $request->validate([
            'summon_date' => 'required|date',
            'reason' => 'required|string',
            'status' => 'required|string', // scheduled, attended, no_show
            'notes' => 'nullable|string',
        ]);

        $parentSummon->update($validated);

        return redirect()->back()->with('success', 'تم تحديث حالة الاستدعاء بنجاح');
    }

    public function destroy(ParentSummon $parentSummon)
    {
        $parentSummon->delete();
        return redirect()->back()->with('success', 'تم الحذف بنجاح');
    }

    public function report(Request $request)
    {
        $branchId = auth()->user()->branch_id;
        $query = ParentSummon::with(['student.user', 'student.activeEnrollment.division.grade', 'violation.violationType'])
            ->where('branch_id', $branchId);

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status');

        if ($startDate) {
            $query->whereDate('summon_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('summon_date', '<=', $endDate);
        }
        if ($status) {
            $query->where('status', $status);
        }

        $summons = $query->orderBy('summon_date', 'desc')->get();

        return Inertia::render('Academic/StudentDiscipline/Summons/Report', [
            'summons' => $summons,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
            ]
        ]);
    }
}
