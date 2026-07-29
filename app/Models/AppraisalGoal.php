<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppraisalGoal extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'appraisal_score_id',
        'title',
        'description',
        'progress',
        'status'
    ];

    public function score()
    {
        return $this->belongsTo(EmployeeAppraisalScore::class, 'appraisal_score_id');
    }
}
