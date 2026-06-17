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
        'written_score', 'homework_score', 'oral_score', 'attendance_score'
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
            get: fn () => $this->written_score + $this->homework_score + $this->oral_score + $this->attendance_score,
        );
    }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }
}
