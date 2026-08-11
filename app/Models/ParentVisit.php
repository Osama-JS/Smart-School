<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParentVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'student_id',
        'visitor_name',
        'visitor_relation',
        'employee_id',
        'visit_date',
        'visit_time',
        'purpose_category',
        'purpose',
        'status',
        'notes',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'visit_time' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}
