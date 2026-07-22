<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\MonthlyGrade;
use App\Models\ResultPeriod;
use App\Models\SubjectGradeSetting;
use App\Models\Division;
use App\Models\DivisionSubjectTeacher;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MonthlyGradeController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض درجات الطلاب', only: ['index']),
        ];
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $isTeacher = $user && $user->role && $user->role->name === 'معلم';
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير النظام', 'مدير الفرع']);

        $periods = ResultPeriod::where('branch_id', $user->branch_id)->orderBy('fill_start_date', 'desc')->get();

        $divisionsQuery = Division::with(['grade', 'branch'])->where('branch_id', $user->branch_id);
        
        $assignedSubjects = [];

        if ($isTeacher) {
            // Get divisions and subjects assigned to this teacher
            $assignments = DivisionSubjectTeacher::with(['division.grade', 'subject'])
                ->where('teacher_id', $user->id)
                ->get();
            
            $assignedSubjects = $assignments->groupBy('division_id');
            $divisionsQuery->whereIn('id', $assignments->pluck('division_id')->unique());
            $divisions = $divisionsQuery->get();
        } else {
            $divisions = $divisionsQuery->with('grade.subjects')->get();
            foreach ($divisions as $division) {
                if ($division->grade && $division->grade->subjects) {
                    $assignedSubjects[$division->id] = $division->grade->subjects->map(function($subject) {
                        return (object)[
                            'id' => 'admin_' . $subject->id,
                            'subject_id' => $subject->id,
                            'subject' => $subject
                        ];
                    });
                }
            }
        }

        return Inertia::render('Teacher/MonthlyGrades/Index', [
            'periods' => $periods,
            'divisions' => $divisions,
            'assignedSubjects' => $assignedSubjects,
            'isAdmin' => $isAdmin,
            'isTeacher' => $isTeacher,
        ]);
    }

    public function gradeEntry(Request $request, Division $division, $subject_id, ResultPeriod $period)
    {
        $user = auth()->user();
        $isTeacher = $user && $user->role && $user->role->name === 'معلم';
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير النظام', 'مدير الفرع']);

        // Check if teacher is assigned to this division and subject
        if ($isTeacher) {
            $isAssigned = DivisionSubjectTeacher::where('division_id', $division->id)
                ->where('subject_id', $subject_id)
                ->where('teacher_id', $user->id)
                ->exists();
            if (!$isAssigned) {
                abort(403, 'غير مصرح لك برصد الدرجات لهذه المادة والشعبة.');
            }
        }

        // Get Grade Settings for this subject
        $gradeSetting = SubjectGradeSetting::where('subject_id', $subject_id)->first();
        if (!$gradeSetting || empty($gradeSetting->criteria_weights)) {
            return redirect()->back()->with('error', 'لم يتم ضبط إعدادات توزيع الدرجات لهذه المادة. يرجى التواصل مع الإدارة.');
        }

        // Get Enrolled Students in this Division
        $enrollments = Enrollment::with('student')
            ->where('division_id', $division->id)
            ->where('academic_year_id', $period->semester->academic_year_id) // Match the current year of the period
            ->where('status', 'نشط')
            ->get();

        // Get Existing Grades
        $existingGrades = MonthlyGrade::where('period_id', $period->id)
            ->where('subject_id', $subject_id)
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->get()->keyBy('enrollment_id');

        return Inertia::render('Teacher/MonthlyGrades/GradeEntry', [
            'division' => $division->load('grade'),
            'subject' => \App\Models\Subject::find($subject_id),
            'period' => $period,
            'gradeSetting' => $gradeSetting,
            'enrollments' => $enrollments,
            'existingGrades' => $existingGrades,
        ]);
    }

    public function storeGrades(Request $request, Division $division, $subject_id, ResultPeriod $period)
    {
        $user = auth()->user();
        $isTeacher = $user && $user->role && $user->role->name === 'معلم';

        // Check if teacher is assigned to this division and subject
        if ($isTeacher) {
            $isAssigned = DivisionSubjectTeacher::where('division_id', $division->id)
                ->where('subject_id', $subject_id)
                ->where('teacher_id', $user->id)
                ->exists();
            if (!$isAssigned) {
                abort(403, 'غير مصرح لك برصد الدرجات لهذه المادة والشعبة.');
            }
        }

        // Check if period is open for grading
        $today = today();
        if ($today < $period->fill_start_date || $today > $period->fill_end_date) {
            return redirect()->back()->with('error', 'فترة الرصد مغلقة أو غير متاحة حالياً.');
        }

        $validated = $request->validate([
            'grades' => 'required|array',
            'grades.*.enrollment_id' => 'required|exists:enrollments,id',
            'grades.*.scores' => 'required|array',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['grades'] as $gradeData) {
                MonthlyGrade::updateOrCreate(
                    [
                        'enrollment_id' => $gradeData['enrollment_id'],
                        'period_id' => $period->id,
                        'subject_id' => $subject_id,
                    ],
                    [
                        'semester_id' => $period->semester_id,
                        'scores' => $gradeData['scores']
                    ]
                );
            }
            DB::commit();
            return redirect()->back()->with('success', 'تم رصد وحفظ الدرجات بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء حفظ الدرجات: ' . $e->getMessage());
        }
    }
}
