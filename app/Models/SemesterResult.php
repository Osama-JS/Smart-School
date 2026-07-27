<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class SemesterResult extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'enrollment_id', 'semester_id', 'subject_id', 'branch_id',
        'monthly_aggregate', 'final_exam_score', 'semester_total',
        'status', 'finalized_by', 'finalized_at',
    ];

    protected $casts = [
        'monthly_aggregate' => 'float',
        'final_exam_score'  => 'float',
        'semester_total'    => 'float',
        'finalized_at'      => 'datetime',
    ];

    // ── العلاقات ──

    public function enrollment(): BelongsTo  { return $this->belongsTo(Enrollment::class); }
    public function semester(): BelongsTo    { return $this->belongsTo(Semester::class); }
    public function subject(): BelongsTo     { return $this->belongsTo(Subject::class); }
    public function branch(): BelongsTo      { return $this->belongsTo(Branch::class); }
    public function finalizedBy(): BelongsTo { return $this->belongsTo(User::class, 'finalized_by'); }

    // ── Scopes ──

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }

    public function scopeLocked($query)
    {
        return $query->where('status', 'locked');
    }

    // ── الحسابات الجوهرية ──

    /**
     * حساب المحصلة الفصلية من مجموع الأشهر المرفوعة
     *
     * المعادلة: (مجموع الطالب في الأشهر / الحد الأقصى الكلي) × aggregateMax
     *
     * مثال فصل شهرين:   totalMax = 200  → aggregateMax = 20
     * مثال فصل 3 أشهر:  totalMax = 300  → aggregateMax = 20
     *
     * @param int $enrollmentId
     * @param int $semesterId
     * @param int $subjectId
     * @param float $aggregateMax الحد الأقصى للمحصلة (افتراضياً 20)
     * @return float
     */
    public static function computeAggregate(
        int $enrollmentId,
        int $semesterId,
        int $subjectId,
        float $aggregateMax = 20.0
    ): float {
        $submittedMonths = MonthlyGrade::where([
            'enrollment_id' => $enrollmentId,
            'semester_id'   => $semesterId,
            'subject_id'    => $subjectId,
            'is_submitted'  => true,
        ])->get();

        if ($submittedMonths->isEmpty()) return 0.0;

        $totalEarned = $submittedMonths->sum(function ($month) {
            $scores = $month->scores ?? [];
            return $scores['grand_total'] ?? array_sum($scores);
        });

        $totalMax = $submittedMonths->count() * 100;

        if ($totalMax === 0) return 0.0;

        return round(($totalEarned / $totalMax) * $aggregateMax, 2);
    }

    /**
     * حساب إجمالي الفصل = المحصلة + درجة الاختبار النهائي
     */
    public function computeSemesterTotal(): float
    {
        return round($this->monthly_aggregate + $this->final_exam_score, 2);
    }

    /**
     * هل يمكن قفل النتيجة؟ (يجب أن تكون مرفوعة ولم تُقفل بعد)
     */
    public function canBeLocked(): bool
    {
        return $this->status === 'submitted';
    }

    /**
     * جلب ملخص سنوي للطالب في مادة معينة عبر فصلين
     * الدرجة السنوية = مجموع فصل 1 (50) + مجموع فصل 2 (50) = 100
     */
    public static function computeYearlyTotal(
        int $enrollmentId,
        int $subjectId
    ): array {
        $results = self::where([
            'enrollment_id' => $enrollmentId,
            'subject_id'    => $subjectId,
        ])->with('semester')->get();

        $yearlyTotal = $results->sum('semester_total');

        return [
            'results'      => $results,
            'yearly_total' => round($yearlyTotal, 2),
            'max_possible' => $results->count() * 50,
        ];
    }
}
