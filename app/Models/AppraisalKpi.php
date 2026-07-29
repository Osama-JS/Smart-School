<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppraisalKpi extends Model
{
    protected $fillable = [
        'template_id', 'name', 'description', 'weight', 'order'
    ];

    public function template()
    {
        return $this->belongsTo(AppraisalTemplate::class, 'template_id');
    }

    public function scores()
    {
        return $this->hasMany(EmployeeAppraisalScore::class, 'kpi_id');
    }
}
