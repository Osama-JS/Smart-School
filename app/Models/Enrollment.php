<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    /**
     * academic_year_id بدلاً من academic_year (string)
     * status: active | transferred | withdrawn | graduated
     */
    protected $fillable = [
        'student_id', 'division_id', 'academic_year_id',
        'is_result_blocked', 'status'
    ];

    protected $casts = [
        'is_result_blocked' => 'boolean',
    ];

    // ── العلاقات ──

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /** السنة الدراسية لهذا التسجيل */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /** درجات الطالب الشهرية لهذا التسجيل */
    public function monthlyGrades(): HasMany
    {
        return $this->hasMany(MonthlyGrade::class);
    }

    /** التقييمات الأسبوعية */
    public function weeklyEvaluations(): HasMany
    {
        return $this->hasMany(WeeklyEvaluation::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForYear($query, $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }
}
