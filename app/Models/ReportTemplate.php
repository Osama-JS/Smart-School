<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['branch_id', 'job_grade_id', 'name', 'description'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function jobGrade()
    {
        return $this->belongsTo(JobGrade::class);
    }

    public function fields()
    {
        return $this->hasMany(ReportTemplateField::class)->orderBy('order');
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }
}
