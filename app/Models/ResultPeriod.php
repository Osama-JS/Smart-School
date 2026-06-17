<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ResultPeriod extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'semester_id', 'branch_id', 'month_name',
        'fill_start_date', 'fill_end_date'
    ];

    protected $casts = [
        'fill_start_date' => 'date',
        'fill_end_date'   => 'date',
    ];

    // ── العلاقات ──

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function monthlyGrades(): HasMany
    {
        return $this->hasMany(MonthlyGrade::class, 'period_id');
    }

    // ── Scopes ──

    /**
     * يجلب فترات الرصد المفتوحة حالياً
     */
    public function scopeOpenForGrading(Builder $query): void
    {
        $today = today();
        $query->where('fill_start_date', '<=', $today)
              ->where('fill_end_date', '>=', $today);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }
}
