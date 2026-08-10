<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassAttendance extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'student_id',
        'division_id',
        'subject_id',
        'period_id',
        'teacher_id',
        'recorder_id',
        'date',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function period()
    {
        return $this->belongsTo(DailyPeriod::class, 'period_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
    
    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorder_id');
    }
}
