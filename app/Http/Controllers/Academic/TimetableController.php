<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\DailyPeriod;
use App\Models\Division;
use App\Models\MasterTimetable;
use App\Models\Section;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TimetableController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الجداول الدراسية', only: ['index']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إسناد المعلمين', only: ['assign', 'unassign']),
        ];
    }
    public function index(Request $request)
    {
        $branchId = auth()->user()->branch_id;

        $academicYears = AcademicYear::with('semesters')->latest()->get();
        
        $sections = Section::with(['grades.divisions' => function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        }])
        ->where('branch_id', $branchId)
        ->get();

        $periods = DailyPeriod::where('branch_id', $branchId)->orderBy('start_time')->get();

        $selectedDivisionId = $request->division_id;
        $selectedSemesterId = $request->semester_id;

        $timetable = [];
        if ($selectedDivisionId && $selectedSemesterId) {
            $timetable = MasterTimetable::with(['subject', 'teacher'])
                ->where('division_id', $selectedDivisionId)
                ->where('semester_id', $selectedSemesterId)
                ->get();
        }

        // Get working days from current academic year or semester's year
        $semester = Semester::with('academicYear')->find($selectedSemesterId);
        $workingDays = $semester && $semester->academicYear->working_days 
            ? $semester->academicYear->working_days 
            : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        // Translations for UI display
        $daysTranslation = [
            'Sunday'    => 'الأحد',
            'Monday'    => 'الإثنين',
            'Tuesday'   => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday'  => 'الخميس',
            'Friday'    => 'الجمعة',
            'Saturday'  => 'السبت',
        ];

        // For the subject selection modal
        $subjects = Subject::where('branch_id', $branchId)->get();
        $teachers = User::where('branch_id', $branchId)
            ->whereHas('role', function($q){
                $q->whereIn('name', ['معلم', 'معلم أول', 'مشرف تربوي']);
            })->get(['id', 'name']);

        return Inertia::render('Academic/Timetables/Index', [
            'academicYears' => $academicYears,
            'sections' => $sections,
            'periods' => $periods,
            'timetable' => $timetable,
            'workingDays' => $workingDays,
            'daysTranslation' => $daysTranslation,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'filters' => $request->only('academic_year_id', 'semester_id', 'section_id', 'grade_id', 'division_id'),
        ]);
    }

    public function assign(Request $request)
    {
        $validated = $request->validate([
            'semester_id' => 'required|exists:semesters,id',
            'division_id' => 'required|exists:divisions,id',
            'period_id'   => 'required|exists:daily_periods,id',
            'day_of_week' => 'required|string',
            'subject_id'  => 'required|exists:subjects,id',
            'teacher_id'  => 'required|exists:users,id',
        ]);

        $branchId = auth()->user()->branch_id;

        // Security check: ensure division, period, subject, and teacher belong to the current branch
        $division = Division::where('id', $validated['division_id'])->where('branch_id', $branchId)->first();
        $period = DailyPeriod::where('id', $validated['period_id'])->where('branch_id', $branchId)->first();
        $subject = Subject::where('id', $validated['subject_id'])->where('branch_id', $branchId)->first();
        $teacher = User::where('id', $validated['teacher_id'])->where('branch_id', $branchId)->first();

        if (!$division || !$period || !$subject || !$teacher) {
            return redirect()->back()->with('error', 'بيانات غير صالحة أو لا تنتمي لفرعك.');
        }

        // --- CONFLICT PREVENTION (منع التعارض) ---
        // 1. Check if teacher is already assigned to another division at the same time
        $teacherConflict = MasterTimetable::where('semester_id', $validated['semester_id'])
            ->where('period_id', $validated['period_id'])
            ->where('day_of_week', $validated['day_of_week'])
            ->where('teacher_id', $validated['teacher_id'])
            ->where('division_id', '!=', $validated['division_id'])
            ->with('division.grade.section')
            ->first();

        if ($teacherConflict) {
            $conflictDivision = $teacherConflict->division->grade->name . ' - ' . $teacherConflict->division->name;
            return redirect()->back()->with('error', "يوجد تعارض! المعلم لديه حصة في شعبة أخرى ({$conflictDivision}) في نفس الوقت.");
        }

        // Assign or update the slot for this division
        MasterTimetable::updateOrCreate(
            [
                'semester_id' => $validated['semester_id'],
                'division_id' => $validated['division_id'],
                'period_id'   => $validated['period_id'],
                'day_of_week' => $validated['day_of_week'],
            ],
            [
                'subject_id' => $validated['subject_id'],
                'teacher_id' => $validated['teacher_id'],
            ]
        );

        return redirect()->back()->with('success', 'تم تعيين الحصة بنجاح.');
    }

    public function unassign(Request $request)
    {
        $validated = $request->validate([
            'semester_id' => 'required|exists:semesters,id',
            'division_id' => 'required|exists:divisions,id',
            'period_id'   => 'required|exists:daily_periods,id',
            'day_of_week' => 'required|string',
        ]);

        MasterTimetable::where($validated)->delete();

        return redirect()->back()->with('success', 'تم تفريغ الحصة.');
    }

    // Teacher's personal timetable
    public function myTimetable(Request $request)
    {
        $branchId = auth()->user()->branch_id;
        $userId   = auth()->id();
        $academicYears = AcademicYear::with('semesters')->latest()->get();
        $periods = DailyPeriod::where('branch_id', $branchId)->orderBy('start_time')->get();

        $selectedSemesterId = $request->semester_id;
        if (!$selectedSemesterId && $academicYears->count() > 0) {
            $activeYear = $academicYears->firstWhere('is_active', true) ?? $academicYears->first();
            $activeSemester = $activeYear->semesters->firstWhere('is_active', true) ?? $activeYear->semesters->first();
            $selectedSemesterId = $activeSemester ? $activeSemester->id : null;
        }

        $timetable   = [];
        $coverages   = []; // slots where this teacher is the SUBSTITUTE
        $workingDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        if ($selectedSemesterId) {
            // Own regular schedule
            $timetable = MasterTimetable::with(['subject', 'division.grade.section'])
                ->where('semester_id', $selectedSemesterId)
                ->where('teacher_id', $userId)
                ->get();

            $semester = Semester::with('academicYear')->find($selectedSemesterId);
            if ($semester && $semester->academicYear->working_days) {
                $workingDays = $semester->academicYear->working_days;
            }

            // Coverage slots (this teacher is the substitute) — for today's date context
            // We pass coverages indexed by [date][period_id] for easy lookup in the view
            $coverages = \App\Models\ClassCoverage::with([
                'absentTeacher:id,name',
                'period:id,period_name,start_time,end_time',
                'division.grade.section',
                'subject:id,name',
            ])
                ->where('substitute_teacher_id', $userId)
                ->where('branch_id', $branchId)
                ->whereDate('coverage_date', now()->toDateString())
                ->get();
        }

        $daysTranslation = [
            'Sunday'    => 'الأحد',
            'Monday'    => 'الإثنين',
            'Tuesday'   => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday'  => 'الخميس',
            'Friday'    => 'الجمعة',
            'Saturday'  => 'السبت',
        ];

        return Inertia::render('Academic/Timetables/MyTimetable', [
            'academicYears'      => $academicYears,
            'periods'            => $periods,
            'timetable'          => $timetable,
            'coverages'          => $coverages,        // today's coverage assignments
            'workingDays'        => $workingDays,
            'daysTranslation'    => $daysTranslation,
            'selectedSemesterId' => $selectedSemesterId,
        ]);
    }
}
