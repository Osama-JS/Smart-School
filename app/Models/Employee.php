<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use \App\Traits\LogsActivity;
    protected $fillable = [
        'user_id', 'department_id', 'job_grade_id', 'manager_id', 'hire_date',
        'national_id', 'specialization', 'job_title', 'address', 'attachments'
    ];

    protected $casts = [
        'attachments' => 'array',
        'hire_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function jobGrade()
    {
        return $this->belongsTo(JobGrade::class);
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function shifts()
    {
        return $this->belongsToMany(Shift::class, 'branch_employee_shift')
                    ->withPivot('branch_id', 'working_days')
                    ->withTimestamps();
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function requests()
    {
        return $this->hasMany(EmployeeRequest::class);
    }

    public function violations()
    {
        return $this->hasMany(EmployeeViolation::class, 'user_id', 'user_id');
    }

    public function achievements()
    {
        return $this->hasMany(EmployeeAchievement::class, 'user_id', 'user_id');
    }

    public function masterTimetables()
    {
        return $this->hasMany(MasterTimetable::class, 'teacher_id', 'user_id');
    }

    public function substituteCoverages()
    {
        return $this->hasMany(ClassCoverage::class, 'substitute_teacher_id', 'user_id');
    }

    public function lessonPreparations()
    {
        return $this->hasMany(LessonPreparation::class, 'teacher_id', 'user_id');
    }

    public function meetingParticipations()
    {
        return $this->hasMany(MeetingParticipant::class, 'user_id', 'user_id');
    }
}
