<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentPledge extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'student_id',
        'student_violation_id',
        'pledge_text',
        'date',
        'is_signed_by_student',
        'is_signed_by_parent',
        'attachment_path',
        'student_signature_path',
        'parent_signature_path',
    ];

    protected $casts = [
        'date' => 'date',
        'is_signed_by_student' => 'boolean',
        'is_signed_by_parent' => 'boolean',
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
}
