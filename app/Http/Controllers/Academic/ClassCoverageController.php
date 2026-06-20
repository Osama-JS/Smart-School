<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\ClassCoverage;
use App\Models\MasterTimetable;
use App\Models\DailyPeriod;
use App\Models\Semester;
use App\Models\User;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class ClassCoverageController extends Controller
{
    /** لوحة سجلات التغطية */
    public function index(Request $request)
    {
        $user     = auth()->user();
        $branchId = $user->branch_id;

        $query = ClassCoverage::with([
            'absentTeacher:id,name',
            'substituteTeacher:id,name',
            'period:id,period_name,start_time,end_time',
            'division.grade.section',
            'subject:id,name',
            'semester:id,name',
            'recordedBy:id,name',
        ])->where('branch_id', $branchId);

        // Filters
        if ($request->filled('date')) {
            $query->whereDate('coverage_date', $request->date);
        }
        if ($request->filled('absent_teacher_id')) {
            $query->where('absent_teacher_id', $request->absent_teacher_id);
        }
        if ($request->filled('substitute_teacher_id')) {
            $query->where('substitute_teacher_id', $request->substitute_teacher_id);
        }

        $coverages = $query->latest('coverage_date')->paginate(15)->withQueryString();

        // Stats
        $today     = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek(Carbon::SATURDAY);
        $monthStart = Carbon::now()->startOfMonth();

        $statsBase = ClassCoverage::where('branch_id', $branchId);

        $stats = [
            'today'       => (clone $statsBase)->whereDate('coverage_date', $today)->count(),
            'this_week'   => (clone $statsBase)->whereBetween('coverage_date', [$weekStart, Carbon::now()])->count(),
            'this_month'  => (clone $statsBase)->whereBetween('coverage_date', [$monthStart, Carbon::now()])->count(),
            'total'       => (clone $statsBase)->count(),
        ];

        // Lists for filters
        $teachers = User::where('branch_id', $branchId)
            ->whereHas('role', fn($q) => $q->whereIn('name', ['معلم', 'معلم أول', 'مشرف تربوي']))
            ->get(['id', 'name']);

        return Inertia::render('Academic/Coverage/Index', [
            'coverages' => $coverages,
            'stats'     => $stats,
            'teachers'  => $teachers,
            'filters'   => (object) $request->only(['date', 'absent_teacher_id', 'substitute_teacher_id']),
        ]);
    }

    /** شاشة إنشاء التغطية */
    public function create()
    {
        $branchId = auth()->user()->branch_id;

        $teachers = User::where('branch_id', $branchId)
            ->whereHas('role', fn($q) => $q->whereIn('name', ['معلم', 'معلم أول', 'مشرف تربوي']))
            ->get(['id', 'name']);

        $subjects = Subject::where('branch_id', $branchId)->get(['id', 'name']);

        // Active semester for this branch
        $activeSemester = Semester::with('academicYear')
            ->whereHas('academicYear', fn($q) => $q->where('branch_id', $branchId)->where('is_active', true))
            ->where('is_active', true)
            ->first();

        // All semesters for manual selection
        $allSemesters = Semester::whereHas('academicYear', fn($q) => $q->where('branch_id', $branchId))
            ->get()
            ->map(fn($s) => ['id' => $s->id, 'label' => $s->name]);

        return Inertia::render('Academic/Coverage/Create', [
            'teachers'       => $teachers,
            'subjects'       => $subjects,
            'activeSemester' => $activeSemester,
            'allSemesters'   => $allSemesters,
        ]);
    }

    /**
     * API — جلب حصص المعلم الغائب في تاريخ معين
     * يُستدعى من الواجهة الأمامية عند اختيار المعلم والتاريخ
     */
    public function getTeacherPeriods(Request $request)
    {
        $request->validate([
            'teacher_id'  => 'required|exists:users,id',
            'date'        => 'required|date',
            'semester_id' => 'required|exists:semesters,id',
        ]);

        $dayOfWeek = Carbon::parse($request->date)->format('l'); // e.g. 'Sunday'

        // Fetch the teacher's scheduled slots for that day
        $slots = MasterTimetable::with([
            'period:id,period_name,start_time,end_time',
            'division.grade.section',
            'subject:id,name,icon',
        ])
            ->where('semester_id', $request->semester_id)
            ->where('teacher_id', $request->teacher_id)
            ->where('day_of_week', $dayOfWeek)
            ->get();

        // Check if a coverage already exists for each slot on that date
        $existingCoverages = ClassCoverage::where('absent_teacher_id', $request->teacher_id)
            ->whereDate('coverage_date', $request->date)
            ->pluck('period_id')
            ->toArray();

        // Calculate busy teachers for these periods
        $busyTeachers = [];
        $periodIds = $slots->pluck('period_id')->unique();
        if ($periodIds->isNotEmpty()) {
            $busyTimetables = MasterTimetable::where('semester_id', $request->semester_id)
                ->whereIn('period_id', $periodIds)
                ->where('day_of_week', $dayOfWeek)
                ->get(['period_id', 'teacher_id']);

            foreach ($busyTimetables as $bt) {
                $busyTeachers[$bt->period_id][] = $bt->teacher_id;
            }
            
            // Also include teachers who are assigned as substitutes on that day for these periods
            $substitutes = ClassCoverage::where('coverage_date', $request->date)
                ->whereIn('period_id', $periodIds)
                ->whereNotNull('substitute_teacher_id')
                ->get(['period_id', 'substitute_teacher_id']);
                
            foreach ($substitutes as $sub) {
                $busyTeachers[$sub->period_id][] = $sub->substitute_teacher_id;
            }
        }

        return response()->json([
            'day'               => $dayOfWeek,
            'slots'             => $slots,
            'existingCoverages' => $existingCoverages,
            'busyTeachers'      => $busyTeachers,
        ]);
    }

    /** حفظ التغطيات (دفعة واحدة) */
    public function store(Request $request)
    {
        $request->validate([
            'coverage_date'     => 'required|date',
            'absent_teacher_id' => 'required|exists:users,id',
            'semester_id'       => 'required|exists:semesters,id',
            'coverages'         => 'required|array|min:1',
            'coverages.*.period_id'              => 'required|exists:daily_periods,id',
            'coverages.*.division_id'            => 'required|exists:divisions,id',
            'coverages.*.substitute_teacher_id'  => 'nullable|exists:users,id',
            'coverages.*.subject_id'             => 'nullable|exists:subjects,id',
            'coverages.*.coverage_type'          => 'nullable|in:substitution,free,merged',
            'coverages.*.notes'                  => 'nullable|string|max:500',
        ]);

        $branchId   = auth()->user()->branch_id;
        $recordedBy = auth()->id();
        $created    = 0;

        foreach ($request->coverages as $coverage) {
            // Skip entries without a substitute (not mandatory)
            if (empty($coverage['substitute_teacher_id'])) {
                continue;
            }

            // Conflict check: does the substitute already have a real class at this period on this day?
            $conflict = false;
            if (($coverage['coverage_type'] ?? 'substitution') !== 'merged') {
                $dayOfWeek = Carbon::parse($request->coverage_date)->format('l');
                
                $originalConflict = MasterTimetable::where('semester_id', $request->semester_id)
                    ->where('teacher_id', $coverage['substitute_teacher_id'])
                    ->where('period_id', $coverage['period_id'])
                    ->where('day_of_week', $dayOfWeek)
                    ->exists();

                $substituteConflict = ClassCoverage::where('coverage_date', $request->coverage_date)
                    ->where('period_id', $coverage['period_id'])
                    ->where('substitute_teacher_id', $coverage['substitute_teacher_id'])
                    ->exists();

                $conflict = $originalConflict || $substituteConflict;
            }

            if ($conflict) {
                return back()->with('error',
                    'تعارض: المعلم البديل لديه حصة أصلية أو تغطية أخرى في نفس التوقيت. يرجى اختيار معلم آخر، أو استخدام خيار "دمج فصلين".'
                );
            }

            // Also check if another coverage already exists for this slot
            $duplicate = ClassCoverage::where('coverage_date', $request->coverage_date)
                ->where('period_id', $coverage['period_id'])
                ->where('absent_teacher_id', $request->absent_teacher_id)
                ->exists();

            if ($duplicate) {
                continue; // skip silently
            }

            $record = ClassCoverage::create([
                'coverage_date'          => $request->coverage_date,
                'period_id'              => $coverage['period_id'],
                'division_id'            => $coverage['division_id'],
                'semester_id'            => $request->semester_id,
                'subject_id'             => $coverage['subject_id'] ?? null,
                'branch_id'              => $branchId,
                'absent_teacher_id'      => $request->absent_teacher_id,
                'substitute_teacher_id'  => $coverage['substitute_teacher_id'],
                'recorded_by'            => $recordedBy,
                'coverage_type'          => $coverage['coverage_type'] ?? 'substitution',
                'notes'                  => $coverage['notes'] ?? null,
                'substitute_notified'    => false, // will be true when notification service ready
            ]);

            // Placeholder — notify substitute teacher
            // $record->notifySubstitute();

            $created++;
        }

        if ($created === 0) {
            return back()->with('warning', 'لم يتم تسجيل أي تغطية. تأكد من اختيار معلم بديل لحصة واحدة على الأقل.');
        }

        return redirect()->route('academic.coverage.index')
            ->with('success', "تم تسجيل {$created} تغطية بنجاح.");
    }

    /** حذف سجل تغطية */
    public function destroy(ClassCoverage $coverage)
    {
        $branchId = auth()->user()->branch_id;
        if ($coverage->branch_id !== $branchId) {
            abort(403);
        }

        $coverage->delete();
        return back()->with('success', 'تم حذف سجل التغطية بنجاح.');
    }
}
