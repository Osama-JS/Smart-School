<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\StudentViolation;
use App\Models\StudentPledge;
use Illuminate\Support\Carbon;

use App\Traits\ResolvesStudent;

class MyDisciplineController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        [$student, $children] = $this->resolveStudent($request);
        
        if (!$student) {
            return Inertia::render('Student/Discipline/Index', [
                'violations' => [],
                'pledges' => [],
                'stats' => [],
                'children' => $children,
                'activeChildId' => null,
            ]);
        }

        // Get Violations
        $violations = StudentViolation::with(['violationType', 'supervisor'])
            ->where('student_id', $student->id)
            ->orderBy('violation_date', 'desc')
            ->get()
            ->map(function ($violation) {
                return [
                    'id' => $violation->id,
                    'type' => $violation->violationType ? $violation->violationType->name : 'مخالفة',
                    'degree' => $violation->violationType ? $violation->violationType->degree : null,
                    'date' => Carbon::parse($violation->violation_date)->format('Y-m-d'),
                    'supervisor' => $violation->supervisor ? $violation->supervisor->name : null,
                    'details' => $violation->details,
                    'action_taken' => $violation->action_taken,
                    'status' => $violation->status,
                ];
            });

        // Get Pledges
        $pledges = StudentPledge::with('violation.violationType')
            ->where('student_id', $student->id)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($pledge) {
                return [
                    'id' => $pledge->id,
                    'violation_type' => $pledge->violation && $pledge->violation->violationType ? $pledge->violation->violationType->name : null,
                    'pledge_text' => $pledge->pledge_text,
                    'date' => Carbon::parse($pledge->date)->format('Y-m-d'),
                    'is_signed_by_student' => $pledge->is_signed_by_student,
                    'is_signed_by_parent' => $pledge->is_signed_by_parent,
                ];
            });

        return Inertia::render('Student/Discipline/Index', [
            'violations' => $violations,
            'pledges' => $pledges,
            'stats' => [
                'totalViolations' => $violations->count(),
                'pendingPledges' => $pledges->where('is_signed_by_student', false)->count(),
                'resolvedViolations' => $violations->where('status', 'resolved')->count(),
            ],
            'children' => $children,
            'activeChildId' => $student->id,
        ]);
    }

    public function signPledge(Request $request, StudentPledge $pledge)
    {
        $user = auth()->user();
        $studentId = $user->role->name === 'طالب' ? $user->student?->id : null;
        
        // Let parents sign the pledge too if needed, or maybe just students. 
        // For now, let's keep the existing logic or allow parents.
        if ($user->role->name === 'ولي أمر') {
            $studentId = $pledge->student_id; // Parent can sign any of their children's pledges?
            // Optionally check if the pledge's student belongs to the parent
            if (!$user->children()->where('students.id', $studentId)->exists()) {
                abort(403);
            }
        }
        
        if ($pledge->student_id !== $studentId) {
            abort(403);
        }

        $pledge->update([
            'is_signed_by_student' => true,
        ]);

        return back()->with('success', 'تم توقيع التعهد بنجاح');
    }
}
