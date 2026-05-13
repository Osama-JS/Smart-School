<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class ResultPeriod extends Model
{
    protected $fillable = ['month_name', 'academic_year', 'fill_start_date', 'fill_end_date'];

    protected $casts = [
        'fill_start_date' => 'date',
        'fill_end_date' => 'date',
    ];

    public function monthlyGrades(): HasMany {
        return $this->hasMany(MonthlyGrade::class, 'period_id');
    }

    /**
     * نطاق برمجي (Scope): يجلب الفترات المفتوحة حالياً لرصد الدرجات
     * الاستخدام: ResultPeriod::openForGrading()->get();
     */
    public function scopeOpenForGrading(Builder $query): void
    {
        $today = today();
        $query->where('fill_start_date', '<=', $today)
              ->where('fill_end_date', '>=', $today);
    }
}
