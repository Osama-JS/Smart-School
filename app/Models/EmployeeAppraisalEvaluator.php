<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeeAppraisalEvaluator extends Model
{
    public const ROLE_LABELS = [
        'manager' => 'المدير المباشر',
        'supervisor' => 'المشرف التربوي',
        'hr' => 'الموارد البشرية',
        'committee' => 'عضو لجنة',
    ];

    protected $fillable = [
        'appraisal_id',
        'evaluator_user_id',
        'role_type',
        'weight',
        'status',
        'calculated_score',
        'comments',
        'signature',
        'submitted_at',
    ];

    protected $casts = [
        'weight' => 'integer',
        'calculated_score' => 'float',
        'submitted_at' => 'datetime',
    ];

    public function appraisal(): BelongsTo
    {
        return $this->belongsTo(EmployeeAppraisal::class, 'appraisal_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_user_id');
    }

    public function evaluatorScores(): HasMany
    {
        return $this->hasMany(EmployeeAppraisalEvaluatorScore::class, 'evaluator_id');
    }
}
