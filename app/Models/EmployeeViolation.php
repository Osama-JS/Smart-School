<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeViolation extends Model
{
    use \App\Traits\BelongsToBranch;
    use \App\Traits\LogsActivity;
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'academic_year_id',
        'user_id',
        'violation_type_id',
        'violation_date',
        'details',
        'action_taken',
        'attachment_path',
        'admin_signature',
        'employee_signature',
    ];

    protected $casts = [
        'violation_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function violationType()
    {
        return $this->belongsTo(ViolationType::class);
    }
}
