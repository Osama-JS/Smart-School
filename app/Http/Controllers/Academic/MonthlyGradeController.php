<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\MonthlyGrade;
use App\Models\ResultPeriod;
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

        $periods = ResultPeriod::where('branch_id', $user->branch_id)
            ->where(function($q) {
                $q->where('period_type', 'monthly')->orWhereNull('period_type');
            })
            ->orderBy('fill_start_date', 'desc')
            ->get();

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

    public function reportIndex(Request $request)
    {
        $user = auth()->user();
        $isTeacher = $user && $user->role && $user->role->name === 'معلم';
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير النظام', 'مدير الفرع']);

        $periods = ResultPeriod::where('branch_id', $user->branch_id)
            ->where(function($q) {
                $q->where('period_type', 'monthly')->orWhereNull('period_type');
            })
            ->orderBy('fill_start_date', 'desc')
            ->get();

        $divisionsQuery = Division::with(['grade', 'branch'])->where('branch_id', $user->branch_id);
        
        $assignedSubjects = [];

        if ($isTeacher) {
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

        return Inertia::render('Teacher/MonthlyGrades/ReportIndex', [
            'periods' => $periods,
            'divisions' => $divisions,
            'assignedSubjects' => $assignedSubjects,
            'isAdmin' => $isAdmin,
            'isTeacher' => $isTeacher,
        ]);
    }

    public function reportView(Request $request, Division $division, $subject_id, ResultPeriod $period)
    {
        $user = auth()->user();
        $isTeacher = $user && $user->role && $user->role->name === 'معلم';
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير النظام', 'مدير الفرع']);

        if ($isTeacher) {
            $isAssigned = DivisionSubjectTeacher::where('division_id', $division->id)
                ->where('subject_id', $subject_id)
                ->where('teacher_id', $user->id)
                ->exists();
            if (!$isAssigned) {
                abort(403, 'غير مصرح لك برصد الدرجات لهذه المادة والشعبة.');
            }
        }

        $subject = \App\Models\Subject::find($subject_id);
        $gradeSetting = $subject;

        $enrollments = Enrollment::with('student.user')
            ->where('division_id', $division->id)
            ->where('academic_year_id', $period->semester->academic_year_id)
            ->where('status', 'active')
            ->get();

        $existingGrades = MonthlyGrade::where('period_id', $period->id)
            ->where('subject_id', $subject_id)
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->get()->keyBy('enrollment_id');

        return Inertia::render('Teacher/MonthlyGrades/ReportView', [
            'division' => $division->load('grade'),
            'subject' => $subject,
            'period' => $period,
            'gradeSetting' => $gradeSetting,
            'enrollments' => $enrollments,
            'existingGrades' => $existingGrades,
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

        // Get Grade Settings for this subject from the subject itself
        $subject = \App\Models\Subject::find($subject_id);
        $gradeSetting = $subject;

        // Get Enrolled Students in this Division
        $enrollments = Enrollment::with('student.user')
            ->where('division_id', $division->id)
            ->where('academic_year_id', $period->semester->academic_year_id) // Match the current year of the period
            ->where('status', 'active')
            ->get();

        // Get Existing Grades
        $existingGrades = MonthlyGrade::where('period_id', $period->id)
            ->where('subject_id', $subject_id)
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->get()->keyBy('enrollment_id');

        return Inertia::render('Teacher/MonthlyGrades/GradeEntry', [
            'division' => $division->load('grade'),
            'subject' => $subject,
            'period' => $period,
            'gradeSetting' => $gradeSetting,
            'enrollments' => $enrollments,
            'existingGrades' => $existingGrades,
        ]);
    }

    private function checkPermissionAndPeriod(Request $request, Division $division, $subject_id, ResultPeriod $period)
    {
        $user = auth()->user();
        $isTeacher = $user && $user->role && $user->role->name === 'معلم';

        if ($isTeacher) {
            $isAssigned = DivisionSubjectTeacher::where('division_id', $division->id)
                ->where('subject_id', $subject_id)
                ->where('teacher_id', $user->id)
                ->exists();
            if (!$isAssigned) {
                abort(403, 'غير مصرح لك برصد الدرجات لهذه المادة والشعبة.');
            }
        }

        $today = today();
        if ($today < $period->fill_start_date || $today > $period->fill_end_date) {
            return 'فترة الرصد مغلقة أو غير متاحة حالياً.';
        }

        return null; // No errors
    }

    public function saveWeeklyScores(Request $request, Division $division, $subject_id, ResultPeriod $period)
    {
        if ($error = $this->checkPermissionAndPeriod($request, $division, $subject_id, $period)) {
            return redirect()->back()->with('error', $error);
        }

        $weekKey = $request->input('week_key');
        if ($weekKey && $period->weeks_dates && is_array($period->weeks_dates)) {
            preg_match('/week_(\d+)/', $weekKey, $matches);
            if (isset($matches[1])) {
                $weekIndex = intval($matches[1]) - 1;
                $weekData = $period->weeks_dates[$weekIndex] ?? null;
                if ($weekData && isset($weekData['start_date'])) {
                    if (today() < \Carbon\Carbon::parse($weekData['start_date'])) {
                        return redirect()->back()->with('error', 'لا يمكن إدخال درجات هذا الأسبوع لأنه لم يبدأ بعد.');
                    }
                }
            }
        }

        $validated = $request->validate([
            'week_key' => 'required|string',
            'grades' => 'required|array',
            'grades.*.enrollment_id' => 'required|exists:enrollments,id',
            'grades.*.oral' => 'required|numeric|min:0',
            'grades.*.homework' => 'required|numeric|min:0',
            'grades.*.note' => 'nullable|string|max:500',
        ]);

        $weekKey = $validated['week_key'];

        DB::beginTransaction();
        try {
            foreach ($validated['grades'] as $gradeData) {
                $monthlyGrade = MonthlyGrade::firstOrCreate(
                    [
                        'enrollment_id' => $gradeData['enrollment_id'],
                        'period_id' => $period->id,
                        'subject_id' => $subject_id,
                    ],
                    [
                        'semester_id' => $period->semester_id,
                        'weekly_scores' => [],
                    ]
                );

                if ($monthlyGrade->is_submitted) {
                    continue; // Skip if already submitted
                }

                $weeklyScores = $monthlyGrade->weekly_scores ?? [];
                $weeklyScores[$weekKey] = [
                    'oral' => (float)$gradeData['oral'],
                    'homework' => (float)$gradeData['homework'],
                    'note' => $gradeData['note'] ?? null,
                ];

                $monthlyGrade->update(['weekly_scores' => $weeklyScores]);
            }
            DB::commit();
            return redirect()->back()->with('success', 'تم حفظ درجات الأسبوع بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء حفظ الدرجات: ' . $e->getMessage());
        }
    }

    public function submitMonth(Request $request, Division $division, $subject_id, ResultPeriod $period)
    {
        if ($error = $this->checkPermissionAndPeriod($request, $division, $subject_id, $period)) {
            return redirect()->back()->with('error', $error);
        }

        $validated = $request->validate([
            'grades' => 'required|array',
            'grades.*.enrollment_id' => 'required|exists:enrollments,id',
            'grades.*.behavior' => 'required|numeric|min:0',
            'grades.*.monthly_exam' => 'required|numeric|min:0',
            'grades.*.note' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['grades'] as $gradeData) {
                $monthlyGrade = MonthlyGrade::firstOrCreate(
                    [
                        'enrollment_id' => $gradeData['enrollment_id'],
                        'period_id' => $period->id,
                        'subject_id' => $subject_id,
                    ],
                    [
                        'semester_id' => $period->semester_id,
                    ]
                );

                if ($monthlyGrade->is_submitted) {
                    continue; // Already submitted
                }

                $finalScores = $monthlyGrade->buildFinalScores(
                    (float)$gradeData['behavior'],
                    (float)$gradeData['monthly_exam']
                );
                
                if (isset($gradeData['note'])) {
                    $finalScores['note'] = $gradeData['note'];
                }

                $monthlyGrade->update([
                    'scores' => $finalScores,
                    'is_submitted' => true,
                    'submitted_at' => now(),
                    'submitted_by' => auth()->id(),
                ]);
            }
            DB::commit();
            return redirect()->back()->with('success', 'تم رفع درجات الشهر النهائي وقفلها بنجاح.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء الرفع: ' . $e->getMessage());
        }
    }
}
