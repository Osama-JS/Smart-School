<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppraisalCycle extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'title', 'type', 'start_date', 'end_date', 'status'
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    public function appraisals()
    {
        return $this->hasMany(EmployeeAppraisal::class, 'cycle_id');
    }
}
