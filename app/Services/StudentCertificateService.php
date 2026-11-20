<?php

namespace App\Services;

use App\Models\Division;
use App\Models\Enrollment;
use App\Models\MonthlyGrade;
use App\Models\ResultPeriod;
use App\Models\Semester;
use App\Models\SemesterResult;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Support\Collection;

class StudentCertificateService
{
    public function getGradeEstimation(float $percentage): array
    {
        if ($percentage >= 90) {
            return ['label' => 'ممتاز', 'code' => 'excellent', 'passed' => true];
        }
        if ($percentage >= 80) {
            return ['label' => 'جيد جداً', 'code' => 'vgood', 'passed' => true];
        }
        if ($percentage >= 70) {
            return ['label' => 'جيد', 'code' => 'good', 'passed' => true];
        }
        if ($percentage >= 60) {
            return ['label' => 'مقبول', 'code' => 'pass', 'passed' => true];
        }
        if ($percentage >= 50) {
            return ['label' => 'ضعيف', 'code' => 'weak', 'passed' => true];
        }

        return ['label' => 'راسب', 'code' => 'fail', 'passed' => false];
    }

    public function resolveEnrollmentForYear(Student $student, ?int $academicYearId): ?Enrollment
    {
        if ($academicYearId) {
            $enrollment = Enrollment::with(['division.grade.subjects', 'division.grade.section', 'academicYear'])
                ->where('student_id', $student->id)
                ->where('academic_year_id', $academicYearId)
                ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
                ->orderByDesc('id')
                ->first();

            if ($enrollment) {
                return $enrollment;
            }
        }

        return $student->currentEnrollment()
            ->with(['division.grade.subjects', 'division.grade.section', 'academicYear'])
            ->first();
    }

    public function getPeriodWeeksCount(ResultPeriod $period): int
    {
        if (is_array($period->weeks_dates) && count($period->weeks_dates) > 0) {
            return count($period->weeks_dates);
        }

        return 4;
    }

    public function computeSubjectMonthlyLimits(?Subject $subject, int $weeksCount): array
    {
        $oralMax = (float) ($subject?->weekly_oral_max ?? 5) * $weeksCount;
        $homeworkMax = (float) ($subject?->weekly_homework_max ?? 5) * $weeksCount;
        $behaviorMax = (float) ($subject?->monthly_behavior_max ?? 10);
        $examMax = (float) ($subject?->monthly_exam_max ?? 50);
        $totalMax = $oralMax + $homeworkMax + $behaviorMax + $examMax;

        if ($totalMax <= 0) {
            $totalMax = 100.0;
        }

        return [
            'oral_max'     => round($oralMax, 2),
            'homework_max' => round($homeworkMax, 2),
            'behavior_max' => round($behaviorMax, 2),
            'exam_max'     => round($examMax, 2),
            'total_max'    => round($totalMax, 2),
        ];
    }

    public function computeSubjectSemesterLimits(?Subject $subject): array
    {
        $aggregateMax = (float) ($subject?->semester_aggregate_max ?? 20);
        $finalExamMax = (float) ($subject?->final_exam_max ?? 80);
        $totalMax = $aggregateMax + $finalExamMax;

        if ($totalMax <= 0) {
            $totalMax = 100.0;
        }

        return [
            'aggregate_max'  => round($aggregateMax, 2),
            'final_exam_max' => round($finalExamMax, 2),
            'total_max'      => round($totalMax, 2),
        ];
    }

    public function buildMonthlyCertificateData(
        Student $student,
        ResultPeriod $period,
        bool $onlySubmitted = true,
        bool $includeRank = true,
        ?array $precomputedRankMap = null
    ): ?array {
        $student->loadMissing('user');
        $period->loadMissing('semester.academicYear');

        $enrollment = $this->resolveEnrollmentForYear($student, $period->semester?->academic_year_id);
        if (!$enrollment) {
            return null;
        }

        $gradesQuery = MonthlyGrade::with('subject')
            ->where('enrollment_id', $enrollment->id)
            ->where('period_id', $period->id);

        if ($onlySubmitted) {
            $gradesQuery->where('is_submitted', true);
        }

        $grades = $gradesQuery->get();
        if ($grades->isEmpty()) {
            return null;
        }

        $rankInfo = null;
        if ($includeRank) {
            $rankMap = $precomputedRankMap ?? $this->computeMonthlyDivisionRankMap(
                (int) $enrollment->division_id,
                (int) $enrollment->academic_year_id,
                (int) $period->id,
                $onlySubmitted
            );
            $rankInfo = $rankMap[$enrollment->id] ?? null;
        }

        return $this->assembleMonthlyCertificate($student, $enrollment, $period, $grades, $rankInfo);
    }

    public function buildSemesterCertificateData(
        Student $student,
        Semester $semester,
        bool $onlyLocked = true,
        bool $includeRank = true,
        ?array $precomputedRankMap = null
    ): ?array {
        $student->loadMissing('user');
        $semester->loadMissing('academicYear');

        $enrollment = $this->resolveEnrollmentForYear($student, $semester->academic_year_id);
        if (!$enrollment) {
            return null;
        }

        $resultsQuery = SemesterResult::with('subject')
            ->where('enrollment_id', $enrollment->id)
            ->where('semester_id', $semester->id);

        if ($onlyLocked) {
            $resultsQuery->where('status', 'locked');
        }

        $results = $resultsQuery->get();
        if ($results->isEmpty()) {
            return null;
        }

        $rankInfo = null;
        if ($includeRank) {
            $rankMap = $precomputedRankMap ?? $this->computeSemesterDivisionRankMap(
                (int) $enrollment->division_id,
                (int) $enrollment->academic_year_id,
                (int) $semester->id,
                $onlyLocked
            );
            $rankInfo = $rankMap[$enrollment->id] ?? null;
        }

        return $this->assembleSemesterCertificate($student, $enrollment, $semester, $results, $rankInfo);
    }

    public function buildDivisionBatchCertificates(
        Division $division,
        string $type,
        int $targetId,
        bool $onlyOfficial = false
    ): array {
        $division->loadMissing('grade.subjects', 'grade.section');

        if ($type === 'monthly') {
            $period = ResultPeriod::with('semester.academicYear')->findOrFail($targetId);
            $academicYearId = $period->semester?->academic_year_id ?? $division->academic_year_id;

            $enrollments = Enrollment::with(['student.user', 'division.grade.subjects', 'division.grade.section', 'academicYear'])
                ->where('division_id', $division->id)
                ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
                ->where('status', 'active')
                ->get()
                ->sortBy(fn ($e) => $e->student?->user?->name ?? '')
                ->values();

            if ($enrollments->isEmpty()) {
                return [];
            }

            $gradesByEnrollment = MonthlyGrade::with('subject')
                ->whereIn('enrollment_id', $enrollments->pluck('id'))
                ->where('period_id', $period->id)
                ->when($onlyOfficial, fn ($q) => $q->where('is_submitted', true))
                ->get()
                ->groupBy('enrollment_id');

            $totalsByEnrollment = [];
            foreach ($enrollments as $enroll) {
                $enrollGrades = $gradesByEnrollment->get($enroll->id);
                if ($enrollGrades && $enrollGrades->isNotEmpty()) {
                    $totalsByEnrollment[$enroll->id] = $enrollGrades->sum(fn ($g) => (float) ($g->scores['grand_total'] ?? 0));
                }
            }
            $rankMap = $this->buildRankMapFromTotals($totalsByEnrollment);

            $certificates = [];
            foreach ($enrollments as $enroll) {
                $enrollGrades = $gradesByEnrollment->get($enroll->id);
                if (!$enroll->student || !$enrollGrades || $enrollGrades->isEmpty()) {
                    continue;
                }
                $certificates[] = $this->assembleMonthlyCertificate(
                    $enroll->student,
                    $enroll,
                    $period,
                    $enrollGrades,
                    $rankMap[$enroll->id] ?? null
                );
            }

            return $certificates;
        }

        $semester = Semester::with('academicYear')->findOrFail($targetId);
        $academicYearId = $semester->academic_year_id ?? $division->academic_year_id;

        $enrollments = Enrollment::with(['student.user', 'division.grade.subjects', 'division.grade.section', 'academicYear'])
            ->where('division_id', $division->id)
            ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
            ->where('status', 'active')
            ->get()
            ->sortBy(fn ($e) => $e->student?->user?->name ?? '')
            ->values();

        if ($enrollments->isEmpty()) {
            return [];
        }

        $resultsByEnrollment = SemesterResult::with('subject')
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->where('semester_id', $semester->id)
            ->when($onlyOfficial, fn ($q) => $q->where('status', 'locked'))
            ->get()
            ->groupBy('enrollment_id');

        $totalsByEnrollment = [];
        foreach ($enrollments as $enroll) {
            $enrollResults = $resultsByEnrollment->get($enroll->id);
            if ($enrollResults && $enrollResults->isNotEmpty()) {
                $totalsByEnrollment[$enroll->id] = $enrollResults->sum(fn ($r) => (float) ($r->semester_total ?? 0));
            }
        }
        $rankMap = $this->buildRankMapFromTotals($totalsByEnrollment);

        $certificates = [];
        foreach ($enrollments as $enroll) {
            $enrollResults = $resultsByEnrollment->get($enroll->id);
            if (!$enroll->student || !$enrollResults || $enrollResults->isEmpty()) {
                continue;
            }
            $certificates[] = $this->assembleSemesterCertificate(
                $enroll->student,
                $enroll,
                $semester,
                $enrollResults,
                $rankMap[$enroll->id] ?? null
            );
        }

        return $certificates;
    }

    public function getDivisionCertificateRoster(Division $division, string $type, int $targetId): array
    {
        $division->loadMissing('grade.subjects');

        if ($type === 'monthly') {
            $period = ResultPeriod::with('semester')->find($targetId);
            if (!$period) {
                return [];
            }

            $enrollments = Enrollment::with('student.user')
                ->where('division_id', $division->id)
                ->when($period->semester?->academic_year_id, fn ($q, $yearId) => $q->where('academic_year_id', $yearId))
                ->where('status', 'active')
                ->get()
                ->sortBy(fn ($e) => $e->student?->user?->name ?? '')
                ->values();

            $gradesByEnrollment = MonthlyGrade::with('subject')
                ->whereIn('enrollment_id', $enrollments->pluck('id'))
                ->where('period_id', $period->id)
                ->get()
                ->groupBy('enrollment_id');

            $weeksCount = $this->getPeriodWeeksCount($period);
            $totalsByEnrollment = [];
            foreach ($enrollments as $enroll) {
                $list = $gradesByEnrollment->get($enroll->id);
                if ($list && $list->isNotEmpty()) {
                    $totalsByEnrollment[$enroll->id] = $list->sum(fn ($g) => (float) ($g->scores['grand_total'] ?? 0));
                }
            }
            $rankMap = $this->buildRankMapFromTotals($totalsByEnrollment);

            return $enrollments->map(function (Enrollment $enroll) use ($gradesByEnrollment, $weeksCount, $rankMap) {
                $list = $gradesByEnrollment->get($enroll->id) ?? collect();
                $totalMarks = 0.0;
                $maxPossible = 0.0;

                foreach ($list as $g) {
                    $limits = $this->computeSubjectMonthlyLimits($g->subject, $weeksCount);
                    $totalMarks += (float) ($g->scores['grand_total'] ?? 0);
                    $maxPossible += $limits['total_max'];
                }

                $percentage = $maxPossible > 0 ? round(($totalMarks / $maxPossible) * 100, 2) : 0.0;
                $est = $this->getGradeEstimation($percentage);

                return [
                    'student_id'        => (int) $enroll->student_id,
                    'enrollment_id'     => (int) $enroll->id,
                    'student_name'      => $enroll->student?->user?->name ?? 'طالب',
                    'username'          => $enroll->student?->user?->username ?? '',
                    'is_result_blocked' => (bool) $enroll->is_result_blocked,
                    'subjects_count'    => $list->count(),
                    'submitted_count'   => $list->where('is_submitted', true)->count(),
                    'total_marks'       => round($totalMarks, 2),
                    'max_possible'      => round($maxPossible, 2),
                    'percentage'        => $percentage,
                    'grade_text'        => $list->isNotEmpty() ? $est['label'] : '—',
                    'rank'              => $rankMap[$enroll->id]['rank'] ?? null,
                    'has_grades'        => $list->isNotEmpty(),
                ];
            })->all();
        }

        $semester = Semester::find($targetId);
        if (!$semester) {
            return [];
        }

        $enrollments = Enrollment::with('student.user')
            ->where('division_id', $division->id)
            ->when($semester->academic_year_id, fn ($q, $yearId) => $q->where('academic_year_id', $yearId))
            ->where('status', 'active')
            ->get()
            ->sortBy(fn ($e) => $e->student?->user?->name ?? '')
            ->values();

        $resultsByEnrollment = SemesterResult::with('subject')
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->where('semester_id', $semester->id)
            ->get()
            ->groupBy('enrollment_id');

        $totalsByEnrollment = [];
        foreach ($enrollments as $enroll) {
            $list = $resultsByEnrollment->get($enroll->id);
            if ($list && $list->isNotEmpty()) {
                $totalsByEnrollment[$enroll->id] = $list->sum(fn ($r) => (float) ($r->semester_total ?? 0));
            }
        }
        $rankMap = $this->buildRankMapFromTotals($totalsByEnrollment);

        return $enrollments->map(function (Enrollment $enroll) use ($resultsByEnrollment, $rankMap) {
            $list = $resultsByEnrollment->get($enroll->id) ?? collect();
            $totalMarks = 0.0;
            $maxPossible = 0.0;

            foreach ($list as $r) {
                $limits = $this->computeSubjectSemesterLimits($r->subject);
                $totalMarks += (float) ($r->semester_total ?? 0);
                $maxPossible += $limits['total_max'];
            }

            $percentage = $maxPossible > 0 ? round(($totalMarks / $maxPossible) * 100, 2) : 0.0;
            $est = $this->getGradeEstimation($percentage);

            return [
                'student_id'        => (int) $enroll->student_id,
                'enrollment_id'     => (int) $enroll->id,
                'student_name'      => $enroll->student?->user?->name ?? 'طالب',
                'username'          => $enroll->student?->user?->username ?? '',
                'is_result_blocked' => (bool) $enroll->is_result_blocked,
                'subjects_count'    => $list->count(),
                'locked_count'      => $list->where('status', 'locked')->count(),
                'total_marks'       => round($totalMarks, 2),
                'max_possible'      => round($maxPossible, 2),
                'percentage'        => $percentage,
                'grade_text'        => $list->isNotEmpty() ? $est['label'] : '—',
                'rank'              => $rankMap[$enroll->id]['rank'] ?? null,
                'has_grades'        => $list->isNotEmpty(),
            ];
        })->all();
    }

    private function assembleMonthlyCertificate(
        Student $student,
        Enrollment $enrollment,
        ResultPeriod $period,
        Collection $grades,
        ?array $rankInfo
    ): array {
        $weeksCount = $this->getPeriodWeeksCount($period);
        $gradesBySubject = $grades->keyBy('subject_id');
        $orderedSubjects = $this->mergeSubjectsOrder($enrollment->division?->grade?->subjects ?? collect(), $grades);

        $rows = [];
        $totalMarks = 0.0;
        $maxPossible = 0.0;
        $failedSubjects = 0;
        $hasUnsubmitted = false;

        foreach ($orderedSubjects as $subject) {
            /** @var MonthlyGrade|null $grade */
            $grade = $gradesBySubject->get($subject->id);
            if (!$grade) {
                continue;
            }

            if (!$grade->is_submitted) {
                $hasUnsubmitted = true;
            }

            $limits = $this->computeSubjectMonthlyLimits($subject, $weeksCount);
            $scores = is_array($grade->scores) ? $grade->scores : [];

            $oral = isset($scores['oral_total']) ? (float) $scores['oral_total'] : (float) $grade->computeWeeklyOralTotal();
            $homework = isset($scores['homework_total']) ? (float) $scores['homework_total'] : (float) $grade->computeWeeklyHomeworkTotal();
            $behavior = isset($scores['behavior']) ? (float) $scores['behavior'] : 0.0;
            $exam = isset($scores['monthly_exam']) ? (float) $scores['monthly_exam'] : 0.0;
            $grandTotal = isset($scores['grand_total'])
                ? (float) $scores['grand_total']
                : ($oral + $homework + $behavior + $exam);

            $pct = $limits['total_max'] > 0 ? round(($grandTotal / $limits['total_max']) * 100, 2) : 0.0;
            $est = $this->getGradeEstimation($pct);
            $passed = $grandTotal >= ($limits['total_max'] / 2);

            if (!$passed) {
                $failedSubjects++;
            }

            $totalMarks += $grandTotal;
            $maxPossible += $limits['total_max'];

            $rows[] = [
                'subject_id'   => (int) $subject->id,
                'subject_name' => $subject->name,
                'oral_total'   => round($oral, 2),
                'oral_max'     => $limits['oral_max'],
                'homework_total' => round($homework, 2),
                'homework_max' => $limits['homework_max'],
                'behavior'     => round($behavior, 2),
                'behavior_max' => $limits['behavior_max'],
                'monthly_exam' => round($exam, 2),
                'exam_max'     => $limits['exam_max'],
                'grand_total'  => round($grandTotal, 2),
                'max_total'    => $limits['total_max'],
                'percentage'   => $pct,
                'grade_text'   => $est['label'],
                'grade_code'   => $est['code'],
                'passed'       => $passed,
                'note'         => $scores['note'] ?? null,
                'is_submitted' => (bool) $grade->is_submitted,
            ];
        }

        $percentage = $maxPossible > 0 ? round(($totalMarks / $maxPossible) * 100, 2) : 0.0;
        $overallEst = $this->getGradeEstimation($percentage);
        $overallPassed = $overallEst['passed'] && $failedSubjects === 0;

        $branchId = $enrollment->division?->branch_id ?? $student->user?->branch_id;
        $design = ReportDesignService::getDesignConfig($branchId);
        $logoUrl = $this->resolveLogoUrl($design);
        $issueDate = now()->format('Y-m-d');

        $qrText = implode(' | ', [
            $design['school_name'] ?? 'Smart-School',
            'شهادة شهرية',
            'الطالب: ' . ($student->user?->name ?? ''),
            'الرقم: ' . $student->id,
            'الشهر: ' . $period->month_name,
            'المجموع: ' . round($totalMarks, 2) . '/' . round($maxPossible, 2),
            'النسبة: ' . $percentage . '%',
            'التقدير: ' . $overallEst['label'],
            'التاريخ: ' . $issueDate,
        ]);

        return [
            'type'         => 'monthly',
            'student'      => [
                'id'          => (int) $student->id,
                'name'        => $student->user?->name ?? 'طالب',
                'username'    => $student->user?->username ?? '',
                'national_id' => $student->user?->national_id ?? '',
            ],
            'enrollment'   => [
                'id'                => (int) $enrollment->id,
                'is_result_blocked' => (bool) $enrollment->is_result_blocked,
                'grade_name'        => $enrollment->division?->grade?->name ?? 'غير محدد',
                'division_name'     => $enrollment->division?->name ?? '—',
                'section_name'      => $enrollment->division?->grade?->section?->name ?? '',
            ],
            'period'       => [
                'id'          => (int) $period->id,
                'month_name'  => $period->month_name,
                'weeks_count' => $weeksCount,
            ],
            'semester'     => [
                'id'   => (int) ($period->semester?->id ?? 0),
                'name' => $period->semester?->name ?? '',
            ],
            'academicYear' => $period->semester?->academicYear?->name ?? $enrollment->academicYear?->name ?? '',
            'rows'         => $rows,
            'summary'      => [
                'total_marks'             => round($totalMarks, 2),
                'max_possible'            => round($maxPossible, 2),
                'percentage'              => $percentage,
                'grade_text'              => $overallEst['label'],
                'grade_code'              => $overallEst['code'],
                'passed'                  => $overallPassed,
                'failed_subjects_count'   => $failedSubjects,
                'rank'                    => $rankInfo['rank'] ?? null,
                'division_students_count' => $rankInfo['total_students'] ?? null,
                'has_unsubmitted'         => $hasUnsubmitted,
                'has_draft'               => $hasUnsubmitted,
            ],
            'design'       => $design,
            'logoUrl'      => $logoUrl,
            'qrText'       => $qrText,
            'issueDate'    => $issueDate,
        ];
    }

    private function assembleSemesterCertificate(
        Student $student,
        Enrollment $enrollment,
        Semester $semester,
        Collection $results,
        ?array $rankInfo
    ): array {
        $resultsBySubject = $results->keyBy('subject_id');
        $orderedSubjects = $this->mergeSubjectsOrder($enrollment->division?->grade?->subjects ?? collect(), $results);

        $rows = [];
        $totalMarks = 0.0;
        $maxPossible = 0.0;
        $failedSubjects = 0;
        $hasDraft = false;

        foreach ($orderedSubjects as $subject) {
            /** @var SemesterResult|null $result */
            $result = $resultsBySubject->get($subject->id);
            if (!$result) {
                continue;
            }

            if ($result->status !== 'locked') {
                $hasDraft = true;
            }

            $limits = $this->computeSubjectSemesterLimits($subject);
            $monthlyAggregate = (float) ($result->monthly_aggregate ?? 0);
            $finalExamScore = (float) ($result->final_exam_score ?? 0);
            $semesterTotal = (float) ($result->semester_total ?? ($monthlyAggregate + $finalExamScore));

            $pct = $limits['total_max'] > 0 ? round(($semesterTotal / $limits['total_max']) * 100, 2) : 0.0;
            $est = $this->getGradeEstimation($pct);
            $passed = $semesterTotal >= ($limits['total_max'] / 2);

            if (!$passed) {
                $failedSubjects++;
            }

            $totalMarks += $semesterTotal;
            $maxPossible += $limits['total_max'];

            $rows[] = [
                'subject_id'        => (int) $subject->id,
                'subject_name'      => $subject->name,
                'monthly_aggregate' => round($monthlyAggregate, 2),
                'aggregate_max'     => $limits['aggregate_max'],
                'final_exam_score'  => round($finalExamScore, 2),
                'final_exam_max'    => $limits['final_exam_max'],
                'semester_total'    => round($semesterTotal, 2),
                'max_total'         => $limits['total_max'],
                'percentage'        => $pct,
                'grade_text'        => $est['label'],
                'grade_code'        => $est['code'],
                'passed'            => $passed,
                'status'            => $result->status,
                'notes'             => $result->notes ?? null,
            ];
        }

        $percentage = $maxPossible > 0 ? round(($totalMarks / $maxPossible) * 100, 2) : 0.0;
        $overallEst = $this->getGradeEstimation($percentage);
        $overallPassed = $overallEst['passed'] && $failedSubjects === 0;

        $branchId = $enrollment->division?->branch_id ?? $student->user?->branch_id;
        $design = ReportDesignService::getDesignConfig($branchId);
        $logoUrl = $this->resolveLogoUrl($design);
        $issueDate = now()->format('Y-m-d');

        $qrText = implode(' | ', [
            $design['school_name'] ?? 'Smart-School',
            'شهادة فصلية',
            'الطالب: ' . ($student->user?->name ?? ''),
            'الرقم: ' . $student->id,
            'الفصل: ' . $semester->name,
            'المجموع: ' . round($totalMarks, 2) . '/' . round($maxPossible, 2),
            'النسبة: ' . $percentage . '%',
            'التقدير: ' . $overallEst['label'],
            'التاريخ: ' . $issueDate,
        ]);

        return [
            'type'         => 'semester',
            'student'      => [
                'id'          => (int) $student->id,
                'name'        => $student->user?->name ?? 'طالب',
                'username'    => $student->user?->username ?? '',
                'national_id' => $student->user?->national_id ?? '',
            ],
            'enrollment'   => [
                'id'                => (int) $enrollment->id,
                'is_result_blocked' => (bool) $enrollment->is_result_blocked,
                'grade_name'        => $enrollment->division?->grade?->name ?? 'غير محدد',
                'division_name'     => $enrollment->division?->name ?? '—',
                'section_name'      => $enrollment->division?->grade?->section?->name ?? '',
            ],
            'period'       => null,
            'semester'     => [
                'id'   => (int) $semester->id,
                'name' => $semester->name,
            ],
            'academicYear' => $semester->academicYear?->name ?? $enrollment->academicYear?->name ?? '',
            'rows'         => $rows,
            'summary'      => [
                'total_marks'             => round($totalMarks, 2),
                'max_possible'            => round($maxPossible, 2),
                'percentage'              => $percentage,
                'grade_text'              => $overallEst['label'],
                'grade_code'              => $overallEst['code'],
                'passed'                  => $overallPassed,
                'failed_subjects_count'   => $failedSubjects,
                'rank'                    => $rankInfo['rank'] ?? null,
                'division_students_count' => $rankInfo['total_students'] ?? null,
                'has_unsubmitted'         => false,
                'has_draft'               => $hasDraft,
            ],
            'design'       => $design,
            'logoUrl'      => $logoUrl,
            'qrText'       => $qrText,
            'issueDate'    => $issueDate,
        ];
    }

    private function mergeSubjectsOrder(Collection $gradeSubjects, Collection $gradeRecords): Collection
    {
        $subjects = collect();
        $seen = [];

        foreach ($gradeSubjects as $subj) {
            $subjects->push($subj);
            $seen[$subj->id] = true;
        }

        foreach ($gradeRecords as $rec) {
            if ($rec->subject && !isset($seen[$rec->subject->id])) {
                $subjects->push($rec->subject);
                $seen[$rec->subject->id] = true;
            }
        }

        return $subjects;
    }

    private function computeMonthlyDivisionRankMap(
        int $divisionId,
        int $academicYearId,
        int $periodId,
        bool $onlySubmitted
    ): array {
        $enrollmentIds = Enrollment::where('division_id', $divisionId)
            ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
            ->where('status', 'active')
            ->pluck('id');

        if ($enrollmentIds->isEmpty()) {
            return [];
        }

        $allGrades = MonthlyGrade::whereIn('enrollment_id', $enrollmentIds)
            ->where('period_id', $periodId)
            ->when($onlySubmitted, fn ($q) => $q->where('is_submitted', true))
            ->get()
            ->groupBy('enrollment_id');

        $totals = [];
        foreach ($allGrades as $eid => $list) {
            $totals[$eid] = $list->sum(fn ($g) => (float) ($g->scores['grand_total'] ?? 0));
        }

        return $this->buildRankMapFromTotals($totals);
    }

    private function computeSemesterDivisionRankMap(
        int $divisionId,
        int $academicYearId,
        int $semesterId,
        bool $onlyLocked
    ): array {
        $enrollmentIds = Enrollment::where('division_id', $divisionId)
            ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
            ->where('status', 'active')
            ->pluck('id');

        if ($enrollmentIds->isEmpty()) {
            return [];
        }

        $allResults = SemesterResult::whereIn('enrollment_id', $enrollmentIds)
            ->where('semester_id', $semesterId)
            ->when($onlyLocked, fn ($q) => $q->where('status', 'locked'))
            ->get()
            ->groupBy('enrollment_id');

        $totals = [];
        foreach ($allResults as $eid => $list) {
            $totals[$eid] = $list->sum(fn ($r) => (float) ($r->semester_total ?? 0));
        }

        return $this->buildRankMapFromTotals($totals);
    }

    private function buildRankMapFromTotals(array $totalsByEnrollment): array
    {
        if (empty($totalsByEnrollment)) {
            return [];
        }

        arsort($totalsByEnrollment, SORT_NUMERIC);
        $totalStudents = count($totalsByEnrollment);
        $rankMap = [];

        $position = 0;
        $currentRank = 0;
        $prevTotal = null;

        foreach ($totalsByEnrollment as $enrollmentId => $total) {
            $position++;
            $rounded = round((float) $total, 2);
            if ($prevTotal === null || abs($rounded - $prevTotal) > 0.001) {
                $currentRank = $position;
                $prevTotal = $rounded;
            }
            $rankMap[$enrollmentId] = [
                'rank'           => $currentRank,
                'total_students' => $totalStudents,
            ];
        }

        return $rankMap;
    }

    private function resolveLogoUrl(array $design): string
    {
        if (!empty($design['logo'])) {
            return str_starts_with($design['logo'], 'http')
                ? $design['logo']
                : asset('storage/' . ltrim($design['logo'], '/'));
        }

        if (file_exists(public_path('images/logo.png'))) {
            return asset('images/logo.png');
        }

        return asset('images/school_logo.png');
    }
}
