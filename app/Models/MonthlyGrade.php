<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class MonthlyGrade extends Model
{
    protected $fillable = [
        'enrollment_id', 'period_id', 'subject_id', 
        'written_score', 'homework_score', 'oral_score', 'attendance_score'
    ];

    public function enrollment(): BelongsTo { return $this->belongsTo(Enrollment::class); }
    public function period(): BelongsTo { return $this->belongsTo(ResultPeriod::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }

    /**
     * ميزة متقدمة (Accessor): حساب المجموع الإجمالي ديناميكياً أثناء العرض
     * يتم استدعاؤه كأنه حقل في قاعدة البيانات: $grade->total_score
     */
    protected function totalScore(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->written_score + $this->homework_score + $this->oral_score + $this->attendance_score,
        );
    }
}
