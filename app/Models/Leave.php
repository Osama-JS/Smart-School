<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'employee_id',
        'academic_year_id',
        'semester_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'status',
        'reason',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }
}
