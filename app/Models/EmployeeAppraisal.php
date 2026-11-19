<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeAppraisal extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'employee_id', 'cycle_id', 'template_id', 'manager_id', 'hr_id',
        'status', 'self_score', 'manager_score', 'final_score',
        'self_comments', 'manager_comments', 'hr_comments',
        'strengths', 'improvement_areas', 'recommended_training', 'final_recommendation',
        'return_reason', 'returned_at',
        'employee_signature', 'manager_signature', 'hr_signature'
    ];

    protected $casts = [
        'self_score' => 'float',
        'manager_score' => 'float',
        'final_score' => 'float',
        'returned_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function cycle()
    {
        return $this->belongsTo(AppraisalCycle::class, 'cycle_id');
    }

    public function template()
    {
        return $this->belongsTo(AppraisalTemplate::class, 'template_id');
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function hr()
    {
        return $this->belongsTo(User::class, 'hr_id');
    }

    public function scores()
    {
        return $this->hasMany(EmployeeAppraisalScore::class, 'appraisal_id');
    }

    public function evaluators()
    {
        return $this->hasMany(EmployeeAppraisalEvaluator::class, 'appraisal_id');
    }

    public const RECOMMENDATION_LABELS = [
        'promotion' => 'ترقية',
        'reward' => 'مكافأة تشجيعية',
        'training' => 'برنامج تدريبي',
        'contract_renewal' => 'تجديد عقد',
        'pip' => 'خطة تحسين أداء (PIP)',
        'warning' => 'لفت نظر / إنذار',
    ];

    public const RECOMMENDATION_ALIASES = [
        'promotion' => ['promotion', 'ترقية'],
        'reward' => ['reward', 'مكافأة تشجيعية', 'مكافأة تميز'],
        'training' => ['training', 'برنامج تدريبي', 'إلحاق بدورة تدريبية'],
        'contract_renewal' => ['contract_renewal', 'تجديد عقد'],
        'pip' => ['pip', 'خطة تحسين أداء (PIP)'],
        'warning' => ['warning', 'لفت نظر / إنذار', 'لفت نظر'],
    ];

    public static function normalizeRecommendation(?string $value): ?string
    {
        if (!$value) {
            return null;
        }
        foreach (self::RECOMMENDATION_ALIASES as $key => $variants) {
            if (in_array($value, $variants, true)) {
                return $key;
            }
        }
        return $value;
    }

    public static function recommendationLabel(?string $value): ?string
    {
        if (!$value) {
            return null;
        }
        $key = self::normalizeRecommendation($value);
        return self::RECOMMENDATION_LABELS[$key] ?? $value;
    }

    public static function recommendationValuesForFilter(string $value): array
    {
        $key = self::normalizeRecommendation($value);
        return self::RECOMMENDATION_ALIASES[$key] ?? [$value];
    }

    /**
     * Ensure the direct manager (if assigned) is registered as a default evaluator.
     */
    public function ensureDefaultManagerEvaluator(): void
    {
        $this->loadMissing('manager');
        $managerUserId = $this->manager?->user_id;
        if (!$managerUserId) {
            return;
        }

        $this->evaluators()->firstOrCreate(
            ['evaluator_user_id' => $managerUserId],
            [
                'role_type' => 'manager',
                'weight' => 100,
                'status' => in_array($this->status, ['pending_hr', 'completed']) ? 'submitted' : 'pending',
            ]
        );
    }

    /**
     * Assign initial evaluators on appraisal creation: direct manager and, for teachers/supervisor KPIs,
     * the educational supervisor (with 60/40 weighting).
     */
    public function assignInitialEvaluators(): void
    {
        $this->ensureDefaultManagerEvaluator();
        $this->loadMissing(['employee.user.role', 'manager', 'template.kpis']);

        $employeeUser = $this->employee?->user;
        $employeeUserId = $employeeUser?->id;
        if (!$employeeUserId) {
            return;
        }

        $hasSupervisorKpis = $this->template?->kpis?->contains(function ($kpi) {
            return is_array($kpi->evaluator_roles) && in_array('supervisor', $kpi->evaluator_roles, true);
        }) ?? false;

        $isTeacher = ($employeeUser->role?->name === 'معلم')
            || MasterTimetable::where('teacher_id', $employeeUserId)->exists()
            || LessonPreparation::where('teacher_id', $employeeUserId)->exists()
            || ClassroomVisit::where('teacher_id', $employeeUserId)->exists();

        if (!$isTeacher && !$hasSupervisorKpis) {
            return;
        }

        $supervisorUserId = ClassroomVisit::where('teacher_id', $employeeUserId)
            ->whereNotNull('supervisor_id')
            ->where('supervisor_id', '!=', $employeeUserId)
            ->latest('visit_date')
            ->value('supervisor_id');

        if (!$supervisorUserId) {
            $supervisorUserId = LessonPreparation::where('teacher_id', $employeeUserId)
                ->whereNotNull('reviewed_by')
                ->where('reviewed_by', '!=', $employeeUserId)
                ->latest('reviewed_at')
                ->value('reviewed_by');
        }

        if (!$supervisorUserId) {
            $branchId = $employeeUser->branch_id;
            $supervisorUserId = User::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->where('id', '!=', $employeeUserId)
                ->whereHas('role', fn ($q) => $q->where('name', 'like', '%مشرف%'))
                ->value('id');
        }

        $managerUserId = $this->manager?->user_id;
        if (!$supervisorUserId || (int) $supervisorUserId === (int) $employeeUserId || ($managerUserId && (int) $supervisorUserId === (int) $managerUserId)) {
            return;
        }

        $this->evaluators()->firstOrCreate(
            ['evaluator_user_id' => $supervisorUserId],
            [
                'role_type' => 'supervisor',
                'weight' => 40,
                'status' => in_array($this->status, ['pending_hr', 'completed']) ? 'submitted' : 'pending',
            ]
        );

        if ($managerUserId) {
            $managerEval = $this->evaluators()->where('evaluator_user_id', $managerUserId)->first();
            if ($managerEval && (int) $managerEval->weight === 100) {
                $managerEval->update(['weight' => 60]);
            }
        }
    }

    /**
     * Recalculate per-KPI weighted averages and overall manager/final score from evaluators.
     */
    public function recalculateScoresFromEvaluators(): void
    {
        $scores = $this->scores()->with(['kpi', 'evaluatorScores.evaluator'])->get();

        $totalWeightedScore = 0;
        $totalKpiWeight = 0;

        foreach ($scores as $score) {
            $submittedEntries = $score->evaluatorScores->filter(function ($entry) {
                return $entry->evaluator && $entry->evaluator->status === 'submitted';
            });

            if ($submittedEntries->isNotEmpty()) {
                $sumWeighted = 0;
                $sumEvalWeights = 0;
                foreach ($submittedEntries as $entry) {
                    $evalWeight = max(1, (int) ($entry->evaluator->weight ?? 100));
                    $sumWeighted += ((float) $entry->score) * $evalWeight;
                    $sumEvalWeights += $evalWeight;
                }

                $avgKpiScore = $sumEvalWeights > 0 ? round($sumWeighted / $sumEvalWeights, 2) : null;
                $score->update(['manager_score' => $avgKpiScore]);
            } else {
                $avgKpiScore = null;
                if ($score->manager_score !== null) {
                    $score->update(['manager_score' => null]);
                }
            }

            if ($avgKpiScore !== null && $score->kpi) {
                $kpiWeight = max(1, (int) $score->kpi->weight);
                $totalWeightedScore += ($avgKpiScore * $kpiWeight);
                $totalKpiWeight += $kpiWeight;
            }
        }

        $overallPct = $totalKpiWeight > 0
            ? round(($totalWeightedScore / ($totalKpiWeight * 5)) * 100, 2)
            : null;

        $this->update([
            'manager_score' => $overallPct,
            'final_score' => $overallPct,
        ]);
    }

    /**
     * Save one evaluator's assessment, recalculate weighted averages, and advance status if all evaluators submitted.
     */
    public function submitEvaluatorAssessment(
        User $actingUser,
        array $scoresInput,
        ?string $comments,
        ?string $signature,
        array $idpData = [],
        bool $forceAdvanceToHr = false,
        string $fallbackRole = 'committee'
    ): array {
        return \Illuminate\Support\Facades\DB::transaction(function () use (
            $actingUser,
            $scoresInput,
            $comments,
            $signature,
            $idpData,
            $forceAdvanceToHr,
            $fallbackRole
        ) {
            $this->ensureDefaultManagerEvaluator();

            $evaluator = $this->evaluators()->firstOrCreate(
                ['evaluator_user_id' => $actingUser->id],
                [
                    'role_type' => $fallbackRole,
                    'weight' => 100,
                    'status' => 'pending',
                ]
            );

            $scoreMap = collect($scoresInput)->keyBy('id');
            $appraisalScores = $this->scores()->with('kpi')->get();

            $evalWeightedSum = 0;
            $evalWeightTotal = 0;

            foreach ($appraisalScores as $appraisalScore) {
                $kpi = $appraisalScore->kpi;
                if (!$kpi || !$kpi->allowsRole($evaluator->role_type)) {
                    continue;
                }

                $input = $scoreMap->get($appraisalScore->id);
                if (!$input || empty($input['manager_score'])) {
                    continue;
                }

                $val = (int) $input['manager_score'];
                $note = $input['manager_note'] ?? null;

                EmployeeAppraisalEvaluatorScore::updateOrCreate(
                    [
                        'appraisal_score_id' => $appraisalScore->id,
                        'evaluator_id' => $evaluator->id,
                    ],
                    [
                        'score' => $val,
                        'note' => $note,
                    ]
                );

                if ($evaluator->role_type === 'manager' || empty($appraisalScore->manager_note)) {
                    $appraisalScore->update(['manager_note' => $note]);
                }

                $kpiWeight = max(1, (int) $kpi->weight);
                $evalWeightedSum += ($val * $kpiWeight);
                $evalWeightTotal += $kpiWeight;
            }

            $evaluatorPct = $evalWeightTotal > 0
                ? round(($evalWeightedSum / ($evalWeightTotal * 5)) * 100, 2)
                : null;

            $evaluator->update([
                'status' => 'submitted',
                'calculated_score' => $evaluatorPct,
                'comments' => $comments,
                'signature' => $signature ?: $evaluator->signature,
                'submitted_at' => now(),
            ]);

            $this->recalculateScoresFromEvaluators();

            $pendingEvaluatorsCount = $this->evaluators()->where('status', 'pending')->count();
            $allSubmitted = ($pendingEvaluatorsCount === 0) || $forceAdvanceToHr;

            $updatePayload = [
                'status' => $allSubmitted ? 'pending_hr' : 'pending_manager',
                'return_reason' => null,
                'returned_at' => null,
            ];

            if ($evaluator->role_type === 'manager' || empty($this->manager_comments)) {
                $updatePayload['manager_comments'] = $comments;
            }
            if ($signature && ($evaluator->role_type === 'manager' || empty($this->manager_signature))) {
                $updatePayload['manager_signature'] = $signature;
            }

            foreach (['strengths', 'improvement_areas', 'recommended_training', 'final_recommendation'] as $idpKey) {
                if (array_key_exists($idpKey, $idpData) && $idpData[$idpKey] !== null && $idpData[$idpKey] !== '') {
                    $updatePayload[$idpKey] = $idpData[$idpKey];
                }
            }

            $this->update($updatePayload);

            return [
                'evaluator' => $evaluator->fresh(),
                'all_submitted' => $allSubmitted,
                'pending_count' => $pendingEvaluatorsCount,
            ];
        });
    }

    public function scopeApplyFilters($query, $request)
    {
        if ($request->filled('cycle_id')) {
            $query->where('cycle_id', $request->cycle_id);
        }
        
        if ($request->filled('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }
        
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('final_recommendation')) {
            $query->whereIn(
                'final_recommendation',
                self::recommendationValuesForFilter((string) $request->final_recommendation)
            );
        }

        return $query;
    }

    /**
     * Build a 360-degree objective performance snapshot for the appraisal cycle.
     */
    public function buildPerformanceSnapshot(): array
    {
        $this->loadMissing(['employee.user', 'cycle']);

        $startDate = $this->cycle?->start_date
            ? \Carbon\Carbon::parse($this->cycle->start_date)->startOfDay()
            : now()->startOfYear();
        $endDate = $this->cycle?->end_date
            ? \Carbon\Carbon::parse($this->cycle->end_date)->endOfDay()
            : now()->endOfDay();

        $startYmd = $startDate->format('Y-m-d');
        $endYmd = $endDate->format('Y-m-d');
        $userId = $this->employee?->user_id;

        $attendances = Attendance::where('employee_id', $this->employee_id)
            ->whereBetween('date', [$startYmd, $endYmd])
            ->get();

        $presentDays = $attendances->whereIn('status', ['present', 'late', 'extra'])->count();
        $absentDays = $attendances->where('status', 'absent')->count();
        $lateDays = $attendances->where('status', 'late')->count();
        $trackedDays = $attendances->whereNotIn('status', ['weekend', 'holiday', 'future'])->count();
        $attendanceRate = $trackedDays > 0 ? round(($presentDays / $trackedDays) * 100, 1) : 100.0;

        $violations = $userId
            ? EmployeeViolation::where('user_id', $userId)
                ->whereBetween('violation_date', [$startYmd, $endYmd])
                ->with('violationType')
                ->get()
            : collect();

        $achievements = $userId
            ? EmployeeAchievement::where('user_id', $userId)
                ->whereBetween('achievement_date', [$startYmd, $endYmd])
                ->with('achievementType')
                ->get()
            : collect();

        $preps = $userId
            ? LessonPreparation::where('teacher_id', $userId)
                ->whereBetween('preparation_date', [$startYmd, $endYmd])
                ->get()
            : collect();

        $publishedPreps = $preps->where('status', 'published');
        $reviewedPreps = $preps->whereNotNull('supervisor_rating');
        $avgPrepRating = $reviewedPreps->count() > 0 ? round($reviewedPreps->avg('supervisor_rating'), 2) : null;
        $onTrackPrepsCount = $publishedPreps->filter(function ($p) {
            return $p->curriculum_progress
                && (str_contains($p->curriculum_progress, 'مطابق') || str_contains($p->curriculum_progress, 'متقدم'));
        })->count();

        $visits = $userId
            ? ClassroomVisit::where('teacher_id', $userId)
                ->whereBetween('visit_date', [$startYmd, $endYmd])
                ->orderByDesc('visit_date')
                ->get()
            : collect();

        $approvedVisits = $visits->where('is_approved', true);
        $scoredVisits = ($approvedVisits->count() > 0 ? $approvedVisits : $visits)->where('score', '>', 0);
        $avgVisitScore = $scoredVisits->count() > 0 ? round($scoredVisits->avg('score'), 1) : null;

        $studyPlans = $userId
            ? StudyPlan::where('teacher_id', $userId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
            : collect();

        $approvedStudyPlans = $studyPlans->where('status', 'approved')->count();
        $hasAcademicData = $preps->count() > 0 || $visits->count() > 0 || $studyPlans->count() > 0;

        // Compute objective components (0-100)
        $attendanceComponent = max(0, min(100, $attendanceRate - min(10, $lateDays * 1.5)));
        $behaviorComponent = max(0, min(100, 90 + min(10, $achievements->count() * 5) - min(40, $violations->count() * 10)));

        $academicParts = [];
        if ($avgVisitScore !== null) {
            $academicParts[] = min(100, max(0, (float) $avgVisitScore));
        }
        if ($avgPrepRating !== null) {
            $academicParts[] = min(100, max(0, ($avgPrepRating / 5) * 100));
        }
        if ($studyPlans->count() > 0) {
            $academicParts[] = ($approvedStudyPlans / $studyPlans->count()) * 100;
        } elseif ($preps->count() > 0) {
            $academicParts[] = ($publishedPreps->count() / $preps->count()) * 100;
        }

        $academicComponent = count($academicParts) > 0
            ? array_sum($academicParts) / count($academicParts)
            : null;

        $suggestedPct = $academicComponent !== null
            ? round(($attendanceComponent * 0.30) + ($behaviorComponent * 0.25) + ($academicComponent * 0.45), 1)
            : round(($attendanceComponent * 0.55) + ($behaviorComponent * 0.45), 1);

        $suggestedOutOf5 = max(1.0, min(5.0, round(($suggestedPct / 100) * 5, 1)));

        return [
            'attendances' => $attendances,
            'attendance_summary' => [
                'present_days' => $presentDays,
                'absent_days' => $absentDays,
                'late_days' => $lateDays,
                'total_days' => $trackedDays,
                'attendance_rate' => $attendanceRate,
            ],
            'violations' => $violations,
            'achievements' => $achievements,
            'academic' => [
                'has_academic_data' => $hasAcademicData,
                'preparations_total' => $preps->count(),
                'preparations_published' => $publishedPreps->count(),
                'preparations_reviewed' => $reviewedPreps->count(),
                'preparations_avg_rating' => $avgPrepRating,
                'preparations_on_track' => $onTrackPrepsCount,
                'visits_total' => $visits->count(),
                'visits_approved' => $approvedVisits->count(),
                'visits_avg_score' => $avgVisitScore,
                'recent_visits' => $visits->take(3)->map(fn ($v) => [
                    'id' => $v->id,
                    'visit_date' => $v->visit_date ? $v->visit_date->format('Y-m-d') : null,
                    'visit_type' => $v->visit_type,
                    'score' => (float) $v->score,
                    'is_approved' => (bool) $v->is_approved,
                ])->values(),
                'study_plans_total' => $studyPlans->count(),
                'study_plans_approved' => $approvedStudyPlans,
            ],
            'suggested_metrics' => [
                'score_pct' => $suggestedPct,
                'score_5' => $suggestedOutOf5,
                'attendance_component' => round($attendanceComponent, 1),
                'behavior_component' => round($behaviorComponent, 1),
                'academic_component' => $academicComponent !== null ? round($academicComponent, 1) : null,
            ],
        ];
    }
}
