<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeAppraisal extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'employee_id', 'cycle_id', 'template_id', 'manager_id', 'hr_id',
        'status', 'self_score', 'manager_score', 'final_score',
        'self_comments', 'manager_comments', 'hr_comments',
        'employee_signature', 'manager_signature', 'hr_signature'
    ];

    protected $casts = [
        'self_score' => 'float',
        'manager_score' => 'float',
        'final_score' => 'float',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function cycle()
    {
        return $this->belongsTo(AppraisalCycle::class, 'cycle_id');
    }

    public function template()
    {
        return $this->belongsTo(AppraisalTemplate::class, 'template_id');
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function hr()
    {
        return $this->belongsTo(User::class, 'hr_id');
    }

    public function scores()
    {
        return $this->hasMany(EmployeeAppraisalScore::class, 'appraisal_id');
    }
}
