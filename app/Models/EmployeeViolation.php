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
        'repetition_level',
        'violation_date',
        'details',
        'action_taken',
        'status',
        'attachment_path',
        'admin_signature',
        'employee_signature',
    ];

    protected $casts = [
        'violation_date' => 'date',
    ];

    protected $appends = [
        'employee_signature_url',
        'admin_signature_url',
        'attachment_url'
    ];

    public function getEmployeeSignatureUrlAttribute()
    {
        return $this->employee_signature ? asset('storage/' . $this->employee_signature) : null;
    }

    public function getAdminSignatureUrlAttribute()
    {
        return $this->admin_signature ? asset('storage/' . $this->admin_signature) : null;
    }

    public function getAttachmentUrlAttribute()
    {
        return $this->attachment_path ? asset('storage/' . $this->attachment_path) : null;
    }

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
