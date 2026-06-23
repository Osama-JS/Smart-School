<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\LessonPreparation;
use App\Models\User;
use App\Models\Grade;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LessonPreparationController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض دفاتر التحضير', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إدارة دفاتر التحضير', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $userBranchId = auth()->user()->branch_id;

        $query = LessonPreparation::with(['teacher', 'grade', 'division', 'subject'])
            ->whereHas('grade', function ($q) use ($userBranchId) {
                if ($userBranchId) {
                    $q->where('branch_id', $userBranchId);
                }
            })
            ->latest('preparation_date');

        if ($request->has('teacher_id') && $request->teacher_id) {
            $query->where('teacher_id', $request->teacher_id);
        }
        
        if ($request->has('grade_id') && $request->grade_id) {
            $query->where('grade_id', $request->grade_id);
        }

        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('date_range') && $request->date_range) {
            $dates = explode(' to ', $request->date_range);
            if (count($dates) == 2) {
                $query->whereDate('preparation_date', '>=', trim($dates[0]))
                      ->whereDate('preparation_date', '<=', trim($dates[1]));
            } else {
                $query->whereDate('preparation_date', trim($dates[0]));
            }
        }

        $preparations = $query->paginate(15)->withQueryString();
        
        $teachersQuery = User::whereHas('role', function($q) {
            $q->where('name', 'معلم');
        });
        if ($userBranchId) {
            $teachersQuery->where('branch_id', $userBranchId);
        }
        $teachers = $teachersQuery->get(['id', 'name']);

        $gradesQuery = Grade::with('divisions');
        if ($userBranchId) {
            $gradesQuery->where('branch_id', $userBranchId);
        }
        $grades = $gradesQuery->get();

        $subjectsQuery = Subject::query();
        if ($userBranchId) {
            $subjectsQuery->where('branch_id', $userBranchId);
        }
        $subjects = $subjectsQuery->get(['id', 'name']);

        return Inertia::render('Academic/LessonPreparations/Index', [
            'preparations' => $preparations,
            'teachers' => $teachers,
            'grades' => $grades,
            'subjects' => $subjects,
            'filters' => $request->only(['teacher_id', 'grade_id', 'subject_id', 'date_range'])
        ]);
    }

    public function destroy(LessonPreparation $lessonPreparation)
    {
        // Only allow if within same branch
        if (auth()->user()->branch_id && $lessonPreparation->branch_id !== auth()->user()->branch_id) {
            abort(403);
        }

        $lessonPreparation->delete();

        return redirect()->back()->with('success', 'تم حذف سجل التحضير بنجاح.');
    }
}
