<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class MonthlyGrade extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'enrollment_id', 'semester_id', 'period_id', 'subject_id', 'scores'
    ];

    protected $casts = [
        'scores' => 'array',
    ];

    public function enrollment(): BelongsTo { return $this->belongsTo(Enrollment::class); }
    public function semester(): BelongsTo   { return $this->belongsTo(Semester::class); }
    public function period(): BelongsTo     { return $this->belongsTo(ResultPeriod::class, 'period_id'); }
    public function subject(): BelongsTo    { return $this->belongsTo(Subject::class); }

    /**
     * حساب المجموع الإجمالي للدرجة
     */
    protected function totalScore(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->scores || !is_array($this->scores)) return 0;
                return array_sum($this->scores);
            },
        );
    }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }
}
