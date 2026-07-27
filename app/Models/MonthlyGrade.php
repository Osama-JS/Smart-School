<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class MonthlyGrade extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'enrollment_id', 'semester_id', 'period_id', 'subject_id',
        'scores',
        'weekly_scores',
        'is_submitted', 'submitted_at', 'submitted_by',
    ];

    protected $casts = [
        'scores'        => 'array',
        'weekly_scores' => 'array',
        'is_submitted'  => 'boolean',
        'submitted_at'  => 'datetime',
    ];

    // ── العلاقات ──

    public function enrollment(): BelongsTo { return $this->belongsTo(Enrollment::class); }
    public function semester(): BelongsTo   { return $this->belongsTo(Semester::class); }
    public function period(): BelongsTo     { return $this->belongsTo(ResultPeriod::class, 'period_id'); }
    public function subject(): BelongsTo    { return $this->belongsTo(Subject::class); }
    public function submittedBy(): BelongsTo { return $this->belongsTo(User::class, 'submitted_by'); }

    // ── Scopes ──

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }

    public function scopeSubmitted($query)
    {
        return $query->where('is_submitted', true);
    }

    // ── Helpers ──

    /**
     * هل السجل مقفول (مرفوع أو انتهت فترة الرصد)؟
     */
    public function getIsLockedAttribute(): bool
    {
        if ($this->is_submitted) return true;

        if ($this->period) {
            return today() > $this->period->fill_end_date;
        }

        return false;
    }

    /**
     * مجموع درجات الشفهي من الأسابيع
     */
    public function computeWeeklyOralTotal(): float
    {
        return collect($this->weekly_scores ?? [])->sum('oral');
    }

    /**
     * مجموع درجات الواجب من الأسابيع
     */
    public function computeWeeklyHomeworkTotal(): float
    {
        return collect($this->weekly_scores ?? [])->sum('homework');
    }

    /**
     * المجموع الإجمالي للشهر (من حقل scores النهائي)
     */
    public function getTotalScoreAttribute(): float
    {
        if (!$this->scores || !is_array($this->scores)) return 0;
        return array_sum($this->scores);
    }

    /**
     * تجميع مجاميع الأسابيع وإعداد scores النهائي عند الرفع
     */
    public function buildFinalScores(float $behavior, float $monthlyExam): array
    {
        $oralTotal     = $this->computeWeeklyOralTotal();
        $homeworkTotal = $this->computeWeeklyHomeworkTotal();

        return [
            'oral_total'     => $oralTotal,
            'homework_total' => $homeworkTotal,
            'behavior'       => $behavior,
            'monthly_exam'   => $monthlyExam,
            'grand_total'    => $oralTotal + $homeworkTotal + $behavior + $monthlyExam,
        ];
    }
}
