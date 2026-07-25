<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyPlanRow extends Model
{
    protected $fillable = [
        'study_plan_id',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function studyPlan(): BelongsTo
    {
        return $this->belongsTo(StudyPlan::class);
    }
}
