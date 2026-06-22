<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ViolationType extends Model
{
    use \App\Traits\BelongsToBranch;
    use \App\Traits\LogsActivity;
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'description',
        'first_time_action',
        'second_time_action',
        'third_time_action',
        'follow_up_role_id',
        'execution_role_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function violations()
    {
        return $this->hasMany(EmployeeViolation::class);
    }

    public function followUpRole()
    {
        return $this->belongsTo(JobGrade::class, 'follow_up_role_id');
    }

    public function executionRole()
    {
        return $this->belongsTo(JobGrade::class, 'execution_role_id');
    }
}
