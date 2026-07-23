<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudyPlanTemplate extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'branch_id',
        'academic_year_id',
        'semester_id',
        'name',
        'month',
        'columns',
        'is_active',
    ];

    protected $casts = [
        'columns' => 'array',
        'is_active' => 'boolean',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function studyPlans(): HasMany
    {
        return $this->hasMany(StudyPlan::class, 'template_id');
    }
}
