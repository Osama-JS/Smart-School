<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class LeaveBalance extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['employee_id', 'academic_year_id', 'leave_type_id', 'total_days'];
    protected $appends = ['used_days'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function getUsedDaysAttribute()
    {
        return Leave::where('employee_id', $this->employee_id)
            ->where('academic_year_id', $this->academic_year_id)
            ->where('leave_type_id', $this->leave_type_id)
            ->where('status', 'approved')
            ->get()
            ->sum(function ($leave) {
                return Carbon::parse($leave->start_date)->diffInDays(Carbon::parse($leave->end_date)) + 1;
            });
    }
}
