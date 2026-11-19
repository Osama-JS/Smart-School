<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeAppraisalEvaluatorScore extends Model
{
    protected $fillable = [
        'appraisal_score_id',
        'evaluator_id',
        'score',
        'note',
    ];

    protected $casts = [
        'score' => 'integer',
    ];

    public function appraisalScore(): BelongsTo
    {
        return $this->belongsTo(EmployeeAppraisalScore::class, 'appraisal_score_id');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(EmployeeAppraisalEvaluator::class, 'evaluator_id');
    }
}
