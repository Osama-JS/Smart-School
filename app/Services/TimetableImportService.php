<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\ActivityLog;
use App\Models\DailyPeriod;
use App\Models\Division;
use App\Models\DivisionSubjectTeacher;
use App\Models\MasterTimetable;
use App\Models\Section;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TimetableImportService
{
    public const DAYS_TRANSLATION = [
        'Sunday'    => 'الأحد',
        'Monday'    => 'الإثنين',
        'Tuesday'   => 'الثلاثاء',
        'Wednesday' => 'الأربعاء',
        'Thursday'  => 'الخميس',
        'Friday'    => 'الجمعة',
        'Saturday'  => 'السبت',
    ];

    public const DEFAULT_WORKING_DAYS = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
    ];

    public function resolveBranchId(User $user): ?int
    {
        if ($user->role && $user->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id')) {
            return (int) session('active_branch_id');
        }

        if ($user->branch_id) {
            return (int) $user->branch_id;
        }

        if (request()->hasSession() && session()->has('active_branch_id')) {
            return (int) session('active_branch_id');
        }

        return null;
    }

    public function isBreakPeriod(DailyPeriod $period): bool
    {
        return (bool) $period->is_break
            || (bool) preg_match('/فسحة|استراحة|صلاة/u', (string) $period->period_name);
    }

    public function getImportContext(?int $branchId, ?int $semesterId = null): array
    {
        $academicYears = AcademicYear::with('semesters')
            ->when($branchId, function ($q) use ($branchId) {
                $q->where(function ($sub) use ($branchId) {
                    $sub->where('branch_id', $branchId)->orWhereNull('branch_id');
                });
            })
            ->latest()
            ->get();

        $targetSemester = null;
        if ($semesterId) {
            $targetSemester = Semester::with('academicYear')->find($semesterId);
        }

        if (!$targetSemester && $academicYears->isNotEmpty()) {
            $activeYear = $academicYears->firstWhere('is_active', true) ?? $academicYears->first();
            $targetSemester = $activeYear?->semesters->firstWhere('is_active', true)
                ?? $activeYear?->semesters->first();
            if ($targetSemester && !$targetSemester->relationLoaded('academicYear')) {
                $targetSemester->setRelation('academicYear', $activeYear);
            }
        }

        $workingDays = ($targetSemester && !empty($targetSemester->academicYear?->working_days))
            ? array_values($targetSemester->academicYear->working_days)
            : self::DEFAULT_WORKING_DAYS;

        $sectionsCollection = Section::with([
            'grades' => function ($q) use ($branchId) {
                $q->with([
                    'divisions' => fn ($dq) => $dq->when($branchId, fn ($q2) => $q2->where('branch_id', $branchId))->orderBy('name'),
                    'subjects:id,name',
                    'timetableGroups:id,name',
                ])->orderBy('name');
            },
        ])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->get();

        $sections = $sectionsCollection->map(function (Section $section) {
            return [
                'id'     => (int) $section->id,
                'name'   => $section->name,
                'grades' => $section->grades->map(function ($grade) use ($section) {
                    return [
                        'id'                  => (int) $grade->id,
                        'name'                => $grade->name,
                        'section_id'          => (int) $section->id,
                        'section_name'        => $section->name,
                        'subject_ids'         => $grade->subjects->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
                        'timetable_group_ids' => $grade->timetableGroups->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
                        'divisions'           => $grade->divisions->map(function ($division) use ($grade) {
                            return [
                                'id'               => (int) $division->id,
                                'name'             => $division->name,
                                'grade_id'         => (int) $grade->id,
                                'academic_year_id' => $division->academic_year_id ? (int) $division->academic_year_id : null,
                            ];
                        })->values()->all(),
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        $branchDivisionIds = Division::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $periods = DailyPeriod::with('group:id,name')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('start_time')
            ->get()
            ->map(function (DailyPeriod $period) {
                return [
                    'id'                 => (int) $period->id,
                    'period_name'        => $period->period_name,
                    'start_time'         => $period->start_time ? substr((string) $period->start_time, 0, 5) : '',
                    'end_time'           => $period->end_time ? substr((string) $period->end_time, 0, 5) : '',
                    'timetable_group_id' => $period->timetable_group_id ? (int) $period->timetable_group_id : null,
                    'group_name'         => $period->group?->name,
                    'is_break'           => $this->isBreakPeriod($period),
                ];
            })->values()->all();

        $subjects = Subject::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($s) => ['id' => (int) $s->id, 'name' => $s->name])
            ->values()
            ->all();

        $teachers = User::with(['role:id,name', 'employee:id,user_id,national_id,job_title'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereHas('role', fn ($q) => $q->whereIn('name', ['معلم', 'معلم أول', 'موجه', 'موجه تربوي', 'مشرف تربوي']))
            ->orderBy('name')
            ->get(['id', 'name', 'username', 'email', 'national_id', 'role_id'])
            ->map(function (User $teacher) {
                $jobTitle = $teacher->employee?->job_title ?? $teacher->role?->name ?? '';
                return [
                    'id'           => (int) $teacher->id,
                    'name'         => $teacher->name,
                    'display_name' => $jobTitle ? "{$teacher->name} - {$jobTitle}" : $teacher->name,
                    'username'     => $teacher->username,
                    'email'        => $teacher->email,
                    'national_id'  => $teacher->national_id ?: $teacher->employee?->national_id,
                    'job_title'    => $jobTitle,
                ];
            })->values()->all();

        $existingSlots = [];
        $divisionSubjectTeachers = [];

        if ($targetSemester && !empty($branchDivisionIds)) {
            $existingSlots = MasterTimetable::with([
                'division.grade.section',
                'period:id,period_name,start_time,end_time',
                'subject:id,name',
                'teacher:id,name',
            ])
                ->where('semester_id', $targetSemester->id)
                ->whereIn('division_id', $branchDivisionIds)
                ->get()
                ->map(function (MasterTimetable $slot) {
                    return [
                        'id'            => (int) $slot->id,
                        'division_id'   => (int) $slot->division_id,
                        'grade_id'      => (int) ($slot->division?->grade_id ?? 0),
                        'grade_name'    => $slot->division?->grade?->name ?? '',
                        'division_name' => $slot->division?->name ?? '',
                        'day_of_week'   => $slot->day_of_week,
                        'period_id'     => (int) $slot->period_id,
                        'period_name'   => $slot->period?->period_name ?? '',
                        'subject_id'    => (int) $slot->subject_id,
                        'subject_name'  => $slot->subject?->name ?? '',
                        'teacher_id'    => (int) $slot->teacher_id,
                        'teacher_name'  => $slot->teacher?->name ?? '',
                    ];
                })->values()->all();

            $divisionSubjectTeachers = DivisionSubjectTeacher::whereIn('division_id', $branchDivisionIds)
                ->where(function ($q) use ($targetSemester) {
                    $q->where('semester_id', $targetSemester->id)
                        ->orWhereNull('semester_id');
                })
                ->get(['division_id', 'subject_id', 'teacher_id'])
                ->map(fn ($row) => [
                    'division_id' => (int) $row->division_id,
                    'subject_id'  => (int) $row->subject_id,
                    'teacher_id'  => (int) $row->teacher_id,
                ])->values()->all();
        }

        $otherSemesters = [];
        if (!empty($branchDivisionIds)) {
            $countsBySemester = MasterTimetable::whereIn('division_id', $branchDivisionIds)
                ->whereNotNull('semester_id')
                ->selectRaw('semester_id, COUNT(*) as slots_count')
                ->groupBy('semester_id')
                ->pluck('slots_count', 'semester_id');

            foreach ($academicYears as $year) {
                foreach ($year->semesters as $sem) {
                    $count = (int) ($countsBySemester[$sem->id] ?? 0);
                    if ($count > 0 && (!$targetSemester || (int) $sem->id !== (int) $targetSemester->id)) {
                        $otherSemesters[] = [
                            'id'          => (int) $sem->id,
                            'name'        => "{$year->name} - {$sem->name}",
                            'slots_count' => $count,
                        ];
                    }
                }
            }
        }

        return [
            'academic_years'            => $academicYears->map(function (AcademicYear $year) {
                return [
                    'id'           => (int) $year->id,
                    'name'         => $year->name,
                    'is_active'    => (bool) $year->is_active,
                    'working_days' => $year->working_days ?: self::DEFAULT_WORKING_DAYS,
                    'semesters'    => $year->semesters->map(fn (Semester $sem) => [
                        'id'               => (int) $sem->id,
                        'academic_year_id' => (int) $sem->academic_year_id,
                        'name'             => $sem->name,
                        'is_active'        => (bool) $sem->is_active,
                    ])->values()->all(),
                ];
            })->values()->all(),
            'target_semester_id'        => $targetSemester ? (int) $targetSemester->id : null,
            'working_days'              => $workingDays,
            'days_translation'          => self::DAYS_TRANSLATION,
            'sections'                  => $sections,
            'periods'                   => $periods,
            'subjects'                  => $subjects,
            'teachers'                  => $teachers,
            'existing_slots'            => $existingSlots,
            'division_subject_teachers' => $divisionSubjectTeachers,
            'other_semesters'           => $otherSemesters,
        ];
    }

    public function getCloneSourceSlots(?int $branchId, int $sourceSemesterId, array $divisionIds = []): array
    {
        $branchDivisionIds = Division::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $targetDivisionIds = !empty($divisionIds)
            ? array_values(array_intersect($branchDivisionIds, array_map('intval', $divisionIds)))
            : $branchDivisionIds;

        if (empty($targetDivisionIds)) {
            return [];
        }

        $dayOrder = array_flip(array_keys(self::DAYS_TRANSLATION));

        $slots = MasterTimetable::with([
            'division.grade:id,name',
            'period:id,period_name,start_time',
            'subject:id,name',
            'teacher:id,name',
        ])
            ->where('semester_id', $sourceSemesterId)
            ->whereIn('division_id', $targetDivisionIds)
            ->get()
            ->sort(function (MasterTimetable $a, MasterTimetable $b) use ($dayOrder) {
                $cmpDiv = $a->division_id <=> $b->division_id;
                if ($cmpDiv !== 0) {
                    return $cmpDiv;
                }

                $dayA = $dayOrder[$a->day_of_week] ?? 99;
                $dayB = $dayOrder[$b->day_of_week] ?? 99;
                if ($dayA !== $dayB) {
                    return $dayA <=> $dayB;
                }

                return strcmp((string) ($a->period?->start_time ?? ''), (string) ($b->period?->start_time ?? ''));
            })
            ->values();

        return $slots->map(function (MasterTimetable $slot) {
            return [
                'division_id'  => (int) $slot->division_id,
                'grade_id'     => (int) ($slot->division?->grade_id ?? 0),
                'raw_grade'    => $slot->division?->grade?->name ?? '',
                'raw_division' => $slot->division?->name ?? '',
                'day_of_week'  => $slot->day_of_week,
                'raw_day'      => self::DAYS_TRANSLATION[$slot->day_of_week] ?? $slot->day_of_week,
                'period_id'    => (int) $slot->period_id,
                'raw_period'   => $slot->period?->period_name ?? '',
                'subject_id'   => (int) $slot->subject_id,
                'raw_subject'  => $slot->subject?->name ?? '',
                'teacher_id'   => (int) $slot->teacher_id,
                'raw_teacher'  => $slot->teacher?->name ?? '',
            ];
        })->all();
    }

    public function resolveScopeDivisionIds(
        string $mode,
        string $scope,
        ?int $scopeId,
        array $items,
        Collection $branchDivisions
    ): array {
        if ($mode !== 'replace') {
            return [];
        }

        return match ($scope) {
            'file_divisions' => collect($items)
                ->pluck('division_id')
                ->map(fn ($id) => (int) $id)
                ->filter(fn ($id) => $branchDivisions->has($id))
                ->unique()
                ->values()
                ->all(),

            'division' => ($scopeId && $branchDivisions->has((int) $scopeId))
                ? [(int) $scopeId]
                : [],

            'grade' => $scopeId
                ? $branchDivisions
                    ->filter(fn (Division $div) => (int) $div->grade_id === (int) $scopeId)
                    ->keys()
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all()
                : [],

            'section' => $scopeId
                ? $branchDivisions
                    ->filter(fn (Division $div) => (int) ($div->grade?->section_id ?? 0) === (int) $scopeId)
                    ->keys()
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all()
                : [],

            'branch' => $branchDivisions->keys()->map(fn ($id) => (int) $id)->values()->all(),

            default => [],
        };
    }

    public function validateAndPrepare(
        array $items,
        int $semesterId,
        string $mode,
        string $scope,
        ?int $scopeId,
        ?int $branchId
    ): array {
        $rowErrors = [];
        $warnings = [];
        $normalizedItems = [];

        $semester = Semester::with('academicYear')->find($semesterId);
        if (!$semester) {
            $rowErrors[] = [
                'row_number' => 0,
                'field'      => 'semester_id',
                'message'    => 'الفصل الدراسي المحدد غير موجود.',
            ];

            return [
                'valid'               => false,
                'summary'             => [
                    'total_items'              => count($items),
                    'valid_items'              => 0,
                    'error_count'              => 1,
                    'warning_count'            => 0,
                    'will_insert'              => 0,
                    'will_update'              => 0,
                    'will_delete'              => 0,
                    'affected_divisions_count' => 0,
                ],
                'row_errors'          => $rowErrors,
                'warnings'            => $warnings,
                'normalized_items'    => [],
                'delete_division_ids' => [],
            ];
        }

        if ($branchId && $semester->academicYear?->branch_id && (int) $semester->academicYear->branch_id !== (int) $branchId) {
            $rowErrors[] = [
                'row_number' => 0,
                'field'      => 'semester_id',
                'message'    => 'الفصل الدراسي المحدد لا ينتمي إلى فرعك.',
            ];
        }

        $workingDays = !empty($semester->academicYear?->working_days)
            ? array_values($semester->academicYear->working_days)
            : self::DEFAULT_WORKING_DAYS;
        $workingDaysMap = array_flip($workingDays);

        $branchDivisions = Division::with([
            'grade:id,name,section_id',
            'grade.timetableGroups:id',
            'grade.subjects:id',
        ])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->get()
            ->keyBy('id');

        $branchPeriods = DailyPeriod::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->get()
            ->keyBy('id');

        $branchSubjects = Subject::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->get()
            ->keyBy('id');

        $branchTeachers = User::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->get(['id', 'name'])
            ->keyBy('id');

        $deleteDivisionIds = $this->resolveScopeDivisionIds($mode, $scope, $scopeId, $items, $branchDivisions);

        if ($mode === 'replace' && in_array($scope, ['division', 'grade', 'section'], true) && empty($deleteDivisionIds)) {
            $rowErrors[] = [
                'row_number' => 0,
                'field'      => 'scope_id',
                'message'    => 'نطاق الاستبدال المحدد غير صالح أو لا يحتوي على شعب في فرعك.',
            ];
        }

        $seenDivisionSlots = [];
        $seenTeacherSlots = [];
        $validCandidates = [];

        foreach ($items as $index => $item) {
            $rowNumber = (int) ($item['row_number'] ?? ($index + 1));
            $divisionId = (int) ($item['division_id'] ?? 0);
            $dayOfWeek = (string) ($item['day_of_week'] ?? '');
            $periodId = (int) ($item['period_id'] ?? 0);
            $subjectId = (int) ($item['subject_id'] ?? 0);
            $teacherId = (int) ($item['teacher_id'] ?? 0);

            $hasRowError = false;

            /** @var Division|null $division */
            $division = $branchDivisions->get($divisionId);
            if (!$division) {
                $rowErrors[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'division_id',
                    'message'    => "صف {$rowNumber}: الشعبة غير موجودة أو لا تنتمي إلى فرعك.",
                ];
                $hasRowError = true;
            }

            /** @var DailyPeriod|null $period */
            $period = $branchPeriods->get($periodId);
            if (!$period) {
                $rowErrors[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'period_id',
                    'message'    => "صف {$rowNumber}: الحصة غير موجودة أو لا تنتمي إلى فرعك.",
                ];
                $hasRowError = true;
            } elseif ($this->isBreakPeriod($period)) {
                $rowErrors[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'period_id',
                    'message'    => "صف {$rowNumber}: لا يمكن إسناد حصة إلى فترة راحة/فسحة ({$period->period_name}).",
                ];
                $hasRowError = true;
            }

            /** @var Subject|null $subject */
            $subject = $branchSubjects->get($subjectId);
            if (!$subject) {
                $rowErrors[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'subject_id',
                    'message'    => "صف {$rowNumber}: المادة غير موجودة أو لا تنتمي إلى فرعك.",
                ];
                $hasRowError = true;
            }

            /** @var User|null $teacher */
            $teacher = $branchTeachers->get($teacherId);
            if (!$teacher) {
                $rowErrors[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'teacher_id',
                    'message'    => "صف {$rowNumber}: المعلم غير موجود أو لا ينتمي إلى فرعك.",
                ];
                $hasRowError = true;
            }

            if (!isset($workingDaysMap[$dayOfWeek])) {
                $dayLabel = self::DAYS_TRANSLATION[$dayOfWeek] ?? $dayOfWeek;
                $rowErrors[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'day_of_week',
                    'message'    => "صف {$rowNumber}: اليوم ({$dayLabel}) ليس ضمن أيام الدوام المعتمدة للسنة الدراسية.",
                ];
                $hasRowError = true;
            }

            if ($division && $period && $period->timetable_group_id !== null) {
                $gradeGroupIds = $division->grade?->timetableGroups->pluck('id')->map(fn ($id) => (int) $id)->all() ?? [];
                if (!in_array((int) $period->timetable_group_id, $gradeGroupIds, true)) {
                    $gradeName = $division->grade?->name ?? '';
                    $rowErrors[] = [
                        'row_number' => $rowNumber,
                        'field'      => 'period_id',
                        'message'    => "صف {$rowNumber}: الحصة ({$period->period_name}) لا تنتمي لمجموعة توقيت الصف ({$gradeName}).",
                    ];
                    $hasRowError = true;
                }
            }

            if ($mode === 'replace' && in_array($scope, ['division', 'grade', 'section'], true) && $division && !in_array($divisionId, $deleteDivisionIds, true)) {
                $divLabel = ($division->grade?->name ? $division->grade->name . ' - ' : '') . $division->name;
                $rowErrors[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'division_id',
                    'message'    => "صف {$rowNumber}: الشعبة ({$divLabel}) خارج نطاق الاستبدال المحدد.",
                ];
                $hasRowError = true;
            }

            if (!$hasRowError) {
                $divSlotKey = "{$divisionId}_{$dayOfWeek}_{$periodId}";
                if (isset($seenDivisionSlots[$divSlotKey])) {
                    $firstRow = $seenDivisionSlots[$divSlotKey];
                    $divLabel = ($division->grade?->name ? $division->grade->name . ' - ' : '') . $division->name;
                    $dayLabel = self::DAYS_TRANSLATION[$dayOfWeek] ?? $dayOfWeek;
                    $rowErrors[] = [
                        'row_number' => $rowNumber,
                        'field'      => 'slot',
                        'message'    => "صف {$rowNumber}: خانة مكررة لنفس الشعبة ({$divLabel} - {$dayLabel} - {$period->period_name}) مع الصف {$firstRow}.",
                    ];
                    $hasRowError = true;
                } else {
                    $seenDivisionSlots[$divSlotKey] = $rowNumber;
                }

                $teacherSlotKey = "{$teacherId}_{$dayOfWeek}_{$periodId}";
                if (isset($seenTeacherSlots[$teacherSlotKey])) {
                    $prev = $seenTeacherSlots[$teacherSlotKey];
                    if ($prev['division_id'] !== $divisionId) {
                        $dayLabel = self::DAYS_TRANSLATION[$dayOfWeek] ?? $dayOfWeek;
                        $rowErrors[] = [
                            'row_number' => $rowNumber,
                            'field'      => 'teacher_id',
                            'message'    => "صف {$rowNumber}: تعارض داخل الملف للمعلم ({$teacher->name}) يوم {$dayLabel} في {$period->period_name} مع الشعبة ({$prev['division_label']}) في الصف {$prev['row_number']}.",
                        ];
                        $hasRowError = true;
                    }
                } else {
                    $seenTeacherSlots[$teacherSlotKey] = [
                        'row_number'     => $rowNumber,
                        'division_id'    => $divisionId,
                        'division_label' => ($division->grade?->name ? $division->grade->name . ' - ' : '') . $division->name,
                    ];
                }
            }

            if (!$hasRowError) {
                $validCandidates[] = [
                    'row_number'  => $rowNumber,
                    'division_id' => $divisionId,
                    'day_of_week' => $dayOfWeek,
                    'period_id'   => $periodId,
                    'subject_id'  => $subjectId,
                    'teacher_id'  => $teacherId,
                    'division'    => $division,
                    'period'      => $period,
                    'subject'     => $subject,
                    'teacher'     => $teacher,
                ];
            }
        }

        // Check database teacher conflicts & calculate insert/update/delete counts
        $incomingTeacherIds = collect($validCandidates)->pluck('teacher_id')->unique()->values()->all();
        $incomingDivisionIds = collect($validCandidates)->pluck('division_id')->unique()->values()->all();
        $affectedQueryDivisionIds = array_values(array_unique(array_merge($incomingDivisionIds, $deleteDivisionIds)));

        $dbSlots = collect();
        if (!empty($incomingTeacherIds) || !empty($affectedQueryDivisionIds)) {
            $dbSlots = MasterTimetable::with('division.grade:id,name')
                ->where('semester_id', $semesterId)
                ->where(function ($q) use ($incomingTeacherIds, $affectedQueryDivisionIds) {
                    if (!empty($incomingTeacherIds)) {
                        $q->whereIn('teacher_id', $incomingTeacherIds);
                    }
                    if (!empty($affectedQueryDivisionIds)) {
                        $method = !empty($incomingTeacherIds) ? 'orWhereIn' : 'whereIn';
                        $q->$method('division_id', $affectedQueryDivisionIds);
                    }
                })
                ->get();
        }

        $deleteDivisionLookup = array_flip($deleteDivisionIds);
        $incomingSlotLookup = [];
        foreach ($validCandidates as $candidate) {
            $incomingSlotLookup["{$candidate['division_id']}_{$candidate['day_of_week']}_{$candidate['period_id']}"] = true;
        }

        $remainingTeacherMap = [];
        $existingDivisionSlotSet = [];
        $willDelete = 0;

        foreach ($dbSlots as $dbSlot) {
            $dbDivId = (int) $dbSlot->division_id;
            $dbSlotKey = "{$dbDivId}_{$dbSlot->day_of_week}_{$dbSlot->period_id}";

            if (isset($deleteDivisionLookup[$dbDivId])) {
                $willDelete++;
                continue;
            }

            if ($mode === 'merge' && isset($incomingSlotLookup[$dbSlotKey])) {
                $existingDivisionSlotSet[$dbSlotKey] = true;
                continue;
            }

            $dbTeacherKey = "{$dbSlot->teacher_id}_{$dbSlot->day_of_week}_{$dbSlot->period_id}";
            if (!isset($remainingTeacherMap[$dbTeacherKey])) {
                $remainingTeacherMap[$dbTeacherKey] = [];
            }
            $remainingTeacherMap[$dbTeacherKey][] = $dbSlot;
        }

        // Load division_subject_teachers for non-blocking warnings
        $dstMap = [];
        if (!empty($incomingDivisionIds)) {
            $dstRows = DivisionSubjectTeacher::whereIn('division_id', $incomingDivisionIds)
                ->where(function ($q) use ($semesterId) {
                    $q->where('semester_id', $semesterId)->orWhereNull('semester_id');
                })
                ->get(['division_id', 'subject_id', 'teacher_id']);

            foreach ($dstRows as $dst) {
                $dstKey = "{$dst->division_id}_{$dst->subject_id}";
                if (!isset($dstMap[$dstKey])) {
                    $dstMap[$dstKey] = [];
                }
                $dstMap[$dstKey][] = (int) $dst->teacher_id;
            }
        }

        $willUpdate = 0;
        $willInsert = 0;

        foreach ($validCandidates as $candidate) {
            $rowNumber = $candidate['row_number'];
            $divisionId = $candidate['division_id'];
            $dayOfWeek = $candidate['day_of_week'];
            $periodId = $candidate['period_id'];
            $subjectId = $candidate['subject_id'];
            $teacherId = $candidate['teacher_id'];
            /** @var Division $division */
            $division = $candidate['division'];
            /** @var DailyPeriod $period */
            $period = $candidate['period'];
            /** @var Subject $subject */
            $subject = $candidate['subject'];
            /** @var User $teacher */
            $teacher = $candidate['teacher'];

            $teacherSlotKey = "{$teacherId}_{$dayOfWeek}_{$periodId}";
            $conflicts = $remainingTeacherMap[$teacherSlotKey] ?? [];
            $conflictOtherDivision = null;
            foreach ($conflicts as $dbSlot) {
                if ((int) $dbSlot->division_id !== $divisionId) {
                    $conflictOtherDivision = $dbSlot;
                    break;
                }
            }

            if ($conflictOtherDivision) {
                $conflictDivLabel = ($conflictOtherDivision->division?->grade?->name
                    ? $conflictOtherDivision->division->grade->name . ' - '
                    : '') . ($conflictOtherDivision->division?->name ?? "#{$conflictOtherDivision->division_id}");
                $dayLabel = self::DAYS_TRANSLATION[$dayOfWeek] ?? $dayOfWeek;

                $rowErrors[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'teacher_id',
                    'message'    => "صف {$rowNumber}: يوجد تعارض! المعلم ({$teacher->name}) لديه حصة في شعبة أخرى ({$conflictDivLabel}) يوم {$dayLabel} في {$period->period_name}.",
                ];
                continue;
            }

            // Non-blocking warnings
            $gradeSubjectIds = $division->grade?->subjects->pluck('id')->map(fn ($id) => (int) $id)->all() ?? [];
            if (!empty($gradeSubjectIds) && !in_array($subjectId, $gradeSubjectIds, true)) {
                $warnings[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'subject_id',
                    'message'    => "صف {$rowNumber}: المادة ({$subject->name}) غير مسجلة ضمن مواد الصف ({$division->grade?->name}).",
                ];
            }

            $dstKey = "{$divisionId}_{$subjectId}";
            if (!empty($dstMap[$dstKey]) && !in_array($teacherId, $dstMap[$dstKey], true)) {
                $warnings[] = [
                    'row_number' => $rowNumber,
                    'field'      => 'teacher_id',
                    'message'    => "صف {$rowNumber}: المعلم ({$teacher->name}) يختلف عن المعلم المُسند مسبقاً لمادة ({$subject->name}) في هذه الشعبة.",
                ];
            }

            $divSlotKey = "{$divisionId}_{$dayOfWeek}_{$periodId}";
            if ($mode === 'merge' && isset($existingDivisionSlotSet[$divSlotKey])) {
                $willUpdate++;
            } else {
                $willInsert++;
            }

            $normalizedItems[] = [
                'division_id' => $divisionId,
                'semester_id' => $semesterId,
                'period_id'   => $periodId,
                'subject_id'  => $subjectId,
                'teacher_id'  => $teacherId,
                'day_of_week' => $dayOfWeek,
            ];
        }

        $affectedDivisionsCount = collect($normalizedItems)
            ->pluck('division_id')
            ->merge($deleteDivisionIds)
            ->unique()
            ->count();

        return [
            'valid'               => empty($rowErrors),
            'summary'             => [
                'total_items'              => count($items),
                'valid_items'              => count($normalizedItems),
                'error_count'              => count($rowErrors),
                'warning_count'            => count($warnings),
                'will_insert'              => $willInsert,
                'will_update'              => $willUpdate,
                'will_delete'              => $willDelete,
                'affected_divisions_count' => $affectedDivisionsCount,
            ],
            'row_errors'          => array_values($rowErrors),
            'warnings'            => array_values($warnings),
            'normalized_items'    => $normalizedItems,
            'delete_division_ids' => $deleteDivisionIds,
        ];
    }

    public function executeImport(
        array $items,
        int $semesterId,
        string $mode,
        string $scope,
        ?int $scopeId,
        ?int $branchId,
        int $userId
    ): array {
        return DB::transaction(function () use ($items, $semesterId, $mode, $scope, $scopeId, $branchId, $userId) {
            $prepared = $this->validateAndPrepare($items, $semesterId, $mode, $scope, $scopeId, $branchId);

            if (!$prepared['valid']) {
                $messages = collect($prepared['row_errors'])
                    ->pluck('message')
                    ->take(20)
                    ->values()
                    ->all();

                throw ValidationException::withMessages([
                    'items' => !empty($messages) ? $messages : ['تعذر استيراد الجدول بسبب أخطاء في البيانات.'],
                ]);
            }

            $normalizedItems = $prepared['normalized_items'];
            $deleteDivisionIds = $prepared['delete_division_ids'];
            $now = now();

            $inserted = 0;
            $updated = 0;
            $deleted = 0;

            MasterTimetable::withoutEvents(function () use (
                $normalizedItems,
                $deleteDivisionIds,
                $semesterId,
                $mode,
                $now,
                &$inserted,
                &$updated,
                &$deleted
            ) {
                if ($mode === 'replace') {
                    if (!empty($deleteDivisionIds)) {
                        $deleted = MasterTimetable::where('semester_id', $semesterId)
                            ->whereIn('division_id', $deleteDivisionIds)
                            ->delete();
                    }

                    $rowsToInsert = array_map(fn ($row) => array_merge($row, [
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]), $normalizedItems);

                    foreach (array_chunk($rowsToInsert, 200) as $chunk) {
                        MasterTimetable::insert($chunk);
                    }
                    $inserted = count($rowsToInsert);
                } else {
                    $incomingDivisionIds = collect($normalizedItems)->pluck('division_id')->unique()->values()->all();

                    $existingByKey = [];
                    if (!empty($incomingDivisionIds)) {
                        $existingRows = MasterTimetable::where('semester_id', $semesterId)
                            ->whereIn('division_id', $incomingDivisionIds)
                            ->orderBy('id')
                            ->get();

                        foreach ($existingRows as $existingRow) {
                            $key = "{$existingRow->division_id}_{$existingRow->day_of_week}_{$existingRow->period_id}";
                            if (!isset($existingByKey[$key])) {
                                $existingByKey[$key] = [];
                            }
                            $existingByKey[$key][] = $existingRow;
                        }
                    }

                    $rowsToInsert = [];
                    foreach ($normalizedItems as $row) {
                        $key = "{$row['division_id']}_{$row['day_of_week']}_{$row['period_id']}";
                        if (!empty($existingByKey[$key])) {
                            /** @var MasterTimetable $primary */
                            $primary = $existingByKey[$key][0];
                            $primary->update([
                                'subject_id' => $row['subject_id'],
                                'teacher_id' => $row['teacher_id'],
                            ]);
                            $updated++;

                            if (count($existingByKey[$key]) > 1) {
                                $extraIds = collect($existingByKey[$key])->slice(1)->pluck('id')->all();
                                if (!empty($extraIds)) {
                                    $deleted += MasterTimetable::whereIn('id', $extraIds)->delete();
                                }
                            }
                        } else {
                            $rowsToInsert[] = array_merge($row, [
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]);
                        }
                    }

                    foreach (array_chunk($rowsToInsert, 200) as $chunk) {
                        MasterTimetable::insert($chunk);
                    }
                    $inserted = count($rowsToInsert);
                }
            });

            $divisionsCount = collect($normalizedItems)
                ->pluck('division_id')
                ->merge($deleteDivisionIds)
                ->unique()
                ->count();

            $summary = [
                'semester_id'     => $semesterId,
                'mode'            => $mode,
                'scope'           => $scope,
                'scope_id'        => $scopeId,
                'inserted'        => $inserted,
                'updated'         => $updated,
                'deleted'         => $deleted,
                'total'           => count($normalizedItems),
                'divisions_count' => $divisionsCount,
            ];

            ActivityLog::create([
                'user_id'    => $userId,
                'branch_id'  => $branchId,
                'action'     => 'استيراد',
                'table_name' => 'master_timetable',
                'old_values' => null,
                'new_values' => $summary,
            ]);

            return $summary;
        });
    }
}
