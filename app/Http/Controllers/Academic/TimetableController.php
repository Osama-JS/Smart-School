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
use Spatie\LaravelPdf\Facades\Pdf;

class TimetableController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الجداول الدراسية', only: ['index']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إسناد المعلمين', only: ['assign', 'unassign']),
        ];
    }
    public function reportIndex(Request $request)
    {
        $branchId = auth()->user()->branch_id;

        $academicYears = AcademicYear::with('semesters')->latest()->get();
        
        $sections = Section::with(['grades.divisions' => function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        }])
        ->where('branch_id', $branchId)
        ->get();

        $selectedDivisionId = $request->division_id;
        $selectedSemesterId = $request->semester_id;
        $reportType = $request->report_type ?? 'division';
        $selectedTeacherId = $request->teacher_id;
        
        $selectedSectionId = $request->section_id;
        $selectedGradeId = $request->grade_id;

        $periodsQuery = DailyPeriod::where('branch_id', $branchId);
        
        if ($reportType === 'division' && $selectedDivisionId) {
            $division = Division::find($selectedDivisionId);
            $gradeId = $division ? $division->grade_id : null;
            if ($gradeId) {
                $periodsQuery->where(function($q) use ($gradeId) {
                    $q->whereNull('timetable_group_id')
                      ->orWhereHas('group.grades', function($q2) use ($gradeId) {
                          $q2->where('grades.id', $gradeId);
                      });
                });
            }
        }
        
        $periods = $periodsQuery->orderBy('start_time')->get();

        $timetable = [];
        $masterDivisions = [];
        if ($reportType === 'division' && $selectedDivisionId && $selectedSemesterId) {
            $timetable = MasterTimetable::with(['subject', 'teacher'])
                ->where('division_id', $selectedDivisionId)
                ->where('semester_id', $selectedSemesterId)
                ->get();
        } elseif ($reportType === 'teacher' && $selectedTeacherId && $selectedSemesterId) {
            $timetable = MasterTimetable::with(['subject', 'division.grade.section'])
                ->where('teacher_id', $selectedTeacherId)
                ->where('semester_id', $selectedSemesterId)
                ->get();
        } elseif ($reportType === 'master' && $selectedSemesterId) {
            $divisionsQuery = Division::with('grade.section')->where('branch_id', $branchId);
            if ($selectedGradeId) {
                $divisionsQuery->where('grade_id', $selectedGradeId);
            } elseif ($selectedSectionId) {
                $divisionsQuery->whereHas('grade', function($q) use ($selectedSectionId) {
                    $q->where('section_id', $selectedSectionId);
                });
            }
            $masterDivisions = $divisionsQuery->orderBy('grade_id')->orderBy('name')->get();

            $timetable = MasterTimetable::with(['subject', 'teacher', 'division.grade.section'])
                ->whereIn('division_id', $masterDivisions->pluck('id'))
                ->where('semester_id', $selectedSemesterId)
                ->get();
        }

        $teachers = User::with(['role', 'employee'])
            ->where('branch_id', $branchId)
            ->whereHas('role', function($q){
                $q->whereIn('name', ['معلم', 'معلم أول', 'مشرف تربوي']);
            })->get(['id', 'name', 'role_id'])->map(function($teacher) {
                $jobTitle = $teacher->employee?->job_title ?? $teacher->role?->name ?? '';
                return [
                    'id' => $teacher->id,
                    'name' => $jobTitle ? "{$teacher->name} - {$jobTitle}" : $teacher->name,
                ];
            });

        $semester = Semester::with('academicYear')->find($selectedSemesterId);
        $workingDays = $semester && $semester->academicYear->working_days 
            ? $semester->academicYear->working_days 
            : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        $daysTranslation = [
            'Sunday'    => 'الأحد',
            'Monday'    => 'الإثنين',
            'Tuesday'   => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday'  => 'الخميس',
            'Friday'    => 'الجمعة',
            'Saturday'  => 'السبت',
        ];

        return Inertia::render('Academic/Timetables/ReportIndex', [
            'academicYears' => $academicYears,
            'sections' => $sections,
            'periods' => $periods,
            'timetable' => $timetable,
            'workingDays' => $workingDays,
            'daysTranslation' => $daysTranslation,
            'teachers' => $teachers,
            'masterDivisions' => $masterDivisions,
            'filters' => $request->only('academic_year_id', 'semester_id', 'section_id', 'grade_id', 'division_id', 'report_type', 'teacher_id'),
        ]);
    }

    public function reportPdf(Request $request)
    {
        $branchId = auth()->user()->branch_id;

        $academicYears = AcademicYear::with('semesters')->latest()->get();
        
        $selectedDivisionId = $request->division_id;
        $selectedSemesterId = $request->semester_id;
        $reportType = $request->report_type ?? 'division';
        $selectedTeacherId = $request->teacher_id;
        
        $selectedSectionId = $request->section_id;
        $selectedGradeId = $request->grade_id;

        $periodsQuery = DailyPeriod::where('branch_id', $branchId);
        $division = null;
        $teacher = null;
        
        if ($reportType === 'division' && $selectedDivisionId) {
            $division = Division::with('grade.section')->find($selectedDivisionId);
            $gradeId = $division ? $division->grade_id : null;
            if ($gradeId) {
                $periodsQuery->where(function($q) use ($gradeId) {
                    $q->whereNull('timetable_group_id')
                      ->orWhereHas('group.grades', function($q2) use ($gradeId) {
                          $q2->where('grades.id', $gradeId);
                      });
                });
            }
        }

        if ($reportType === 'teacher' && $selectedTeacherId) {
            $teacher = User::with('employee')->find($selectedTeacherId);
        }
        
        $periods = $periodsQuery->orderBy('start_time')->get();

        $timetable = [];
        $masterDivisions = [];
        if ($reportType === 'division' && $selectedDivisionId && $selectedSemesterId) {
            $timetable = MasterTimetable::with(['subject', 'teacher'])
                ->where('division_id', $selectedDivisionId)
                ->where('semester_id', $selectedSemesterId)
                ->get();
        } elseif ($reportType === 'teacher' && $selectedTeacherId && $selectedSemesterId) {
            $timetable = MasterTimetable::with(['subject', 'division.grade.section'])
                ->where('teacher_id', $selectedTeacherId)
                ->where('semester_id', $selectedSemesterId)
                ->get();
        } elseif ($reportType === 'master' && $selectedSemesterId) {
            $divisionsQuery = Division::with('grade.section')->where('branch_id', $branchId);
            if ($selectedGradeId) {
                $divisionsQuery->where('grade_id', $selectedGradeId);
            } elseif ($selectedSectionId) {
                $divisionsQuery->whereHas('grade', function($q) use ($selectedSectionId) {
                    $q->where('section_id', $selectedSectionId);
                });
            }
            $masterDivisions = $divisionsQuery->orderBy('grade_id')->orderBy('name')->get();

            $timetable = MasterTimetable::with(['subject', 'teacher', 'division.grade.section'])
                ->whereIn('division_id', $masterDivisions->pluck('id'))
                ->where('semester_id', $selectedSemesterId)
                ->get();
        }

        $semester = Semester::with('academicYear')->find($selectedSemesterId);
        $workingDays = $semester && $semester->academicYear->working_days 
            ? $semester->academicYear->working_days 
            : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        $daysTranslation = [
            'Sunday'    => 'الأحد',
            'Monday'    => 'الإثنين',
            'Tuesday'   => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday'  => 'الخميس',
            'Friday'    => 'الجمعة',
            'Saturday'  => 'السبت',
        ];

        $printSettings = json_decode($request->input('printSettings', '{}'), true);
        $paperSize = $printSettings['paperSize'] ?? 'A4';
        $brandColor = $printSettings['brandColor'] ?? '#63a22f';
        $orientation = $printSettings['orientation'] ?? 'landscape';
        $marginSetting = $printSettings['margins'] ?? 'normal';
        
        $margins = match ($marginSetting) {
            'none' => [0, 0, 0, 0],
            '1cm' => [10, 10, 10, 10],
            '2cm' => [20, 20, 20, 20],
            default => [15, 15, 15, 15],
        };

        if ($orientation === 'landscape') {
            $paperSize = \Spatie\LaravelPdf\Enums\Format::tryFrom(strtolower($paperSize)) ?? \Spatie\LaravelPdf\Enums\Format::A4;
            $margins = [$margins[0], $margins[1], $margins[2], $margins[3]];
        }

        $data = [
            'periods' => $periods,
            'timetable' => $timetable,
            'workingDays' => $workingDays,
            'daysTranslation' => $daysTranslation,
            'division' => $division,
            'teacher' => $teacher,
            'masterDivisions' => $masterDivisions,
            'reportType' => $reportType,
            'printSettings' => $printSettings,
            'brandColor' => $brandColor,
            'watermark' => $printSettings['watermark'] ?? 'none',
            'orientation' => $orientation,
        ];

        $footerHtml = '
            <div style="width: 100%; padding: 0 40px 10px 40px; margin: 0; font-family: tahoma, arial, sans-serif; direction: rtl; box-sizing: border-box;">
                <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 9px; color: #64748b;">
                    <div style="width: 33%; text-align: right;">
                        <strong style="color: ' . $brandColor . ';">نظام الإدارة الذكية</strong> (Smart School)
                    </div>
                    <div style="width: 33%; text-align: center; color: #94a3b8;">
                        طُبع بتاريخ: ' . now()->format('Y-m-d H:i') . '
                    </div>
                    <div style="width: 33%; text-align: left;">
                        <span style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 12px; font-weight: bold; color: #475569; display: inline-block;">
                            صفحة <span class="pageNumber"></span> / <span class="totalPages"></span>
                        </span>
                    </div>
                </div>
            </div>
        ';

        $viewName = 'pdf.academic.timetable-report';
        if ($reportType === 'teacher') {
            $viewName = 'pdf.academic.teacher-timetable-report';
        } elseif ($reportType === 'master') {
            $viewName = 'pdf.academic.master-timetable-report';
        }

        $pdf = Pdf::view($viewName, $data)
            ->format($paperSize)
            ->margins($margins[0], $margins[1], $margins[2] + 12, $margins[3])
            ->footerHtml($footerHtml);

        if ($orientation === 'landscape') {
            $pdf->landscape();
        }

        return $pdf->withBrowsershot(function ($browsershot) {
                $browsershot->setChromePath('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
                           ->noSandbox()
                           ->showBackground()
                           ->waitUntilNetworkIdle()
                           ->delay(2000);
            })
            ->download('timetable_report.pdf');
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

        $selectedDivisionId = $request->division_id;
        $selectedSemesterId = $request->semester_id;

        $periodsQuery = DailyPeriod::where('branch_id', $branchId);
        
        if ($selectedDivisionId) {
            $division = Division::find($selectedDivisionId);
            $gradeId = $division ? $division->grade_id : null;
            if ($gradeId) {
                $periodsQuery->where(function($q) use ($gradeId) {
                    $q->whereNull('timetable_group_id')
                      ->orWhereHas('group.grades', function($q2) use ($gradeId) {
                          $q2->where('grades.id', $gradeId);
                      });
                });
            }
        }
        
        $periods = $periodsQuery->orderBy('start_time')->get();

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
        $teachers = User::with(['role', 'employee'])
            ->where('branch_id', $branchId)
            ->whereHas('role', function($q){
                $q->whereIn('name', ['معلم', 'معلم أول', 'مشرف تربوي']);
            })->get(['id', 'name', 'role_id'])->map(function($teacher) {
                $jobTitle = $teacher->employee?->job_title ?? $teacher->role?->name ?? '';
                return [
                    'id' => $teacher->id,
                    'name' => $jobTitle ? "{$teacher->name} - {$jobTitle}" : $teacher->name,
                ];
            });

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

        if ($period->is_break) {
            return redirect()->back()->with('error', 'لا يمكن إسناد معلم إلى فترة راحة.');
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
