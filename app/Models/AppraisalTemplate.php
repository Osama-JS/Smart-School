<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppraisalTemplate extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'title', 'job_grade_id', 'description', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function jobGrade()
    {
        return $this->belongsTo(JobGrade::class);
    }

    public function kpis()
    {
        return $this->hasMany(AppraisalKpi::class, 'template_id')->orderBy('order');
    }

    public function appraisals()
    {
        return $this->hasMany(EmployeeAppraisal::class, 'template_id');
    }
}
