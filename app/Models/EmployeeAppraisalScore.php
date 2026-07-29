<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeAppraisalScore extends Model
{
    protected $fillable = [
        'appraisal_id', 'kpi_id', 'self_score', 'manager_score'
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
}
