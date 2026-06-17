<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use \App\Traits\LogsActivity;

    use HasFactory;

    protected $fillable = [
        'branch_id', 'report_template_id', 'submitter_id', 'reviewer_id', 
        'status', 'data', 'manager_notes', 'period_type', 'period_start_date', 
        'period_end_date', 'period_label', 'academic_year_id', 'semester_id'
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function template()
    {
        return $this->belongsTo(ReportTemplate::class, 'report_template_id');
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitter_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }
}
