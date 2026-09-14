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

    public function scopeApplyFilters($query, $request)
    {
        if ($request->filled('cycle_id')) {
            $query->where('cycle_id', $request->cycle_id);
        }
        
        if ($request->filled('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }
        
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        
        return $query;
    }
}
