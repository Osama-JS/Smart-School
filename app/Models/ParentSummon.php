<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParentSummon extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'student_id',
        'student_violation_id',
        'follow_up_officer_id',
        'execution_officer_id',
        'summon_date',
        'reason',
        'status',
        'notes',
    ];

    protected $casts = [
        'summon_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function violation()
    {
        return $this->belongsTo(StudentViolation::class, 'student_violation_id');
    }

    public function followUpOfficer()
    {
        return $this->belongsTo(User::class, 'follow_up_officer_id');
    }

    public function executionOfficer()
    {
        return $this->belongsTo(User::class, 'execution_officer_id');
    }
}
