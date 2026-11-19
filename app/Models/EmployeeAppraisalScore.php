<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeAppraisalScore extends Model
{
    protected $fillable = [
        'appraisal_id', 'kpi_id', 'self_score', 'self_note', 'manager_score', 'manager_note'
    ];

    protected $casts = [
        'self_score' => 'integer',
        'manager_score' => 'float',
    ];

    public function appraisal()
    {
        return $this->belongsTo(EmployeeAppraisal::class, 'appraisal_id');
    }

    public function kpi()
    {
        return $this->belongsTo(AppraisalKpi::class, 'kpi_id');
    }

    public function goals()
    {
        return $this->hasMany(AppraisalGoal::class, 'appraisal_score_id');
    }

    public function evaluatorScores()
    {
        return $this->hasMany(EmployeeAppraisalEvaluatorScore::class, 'appraisal_score_id');
    }
}
