<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToBranch;

class Attendance extends Model
{
    use HasFactory, BelongsToBranch;

    protected $fillable = [
        'employee_id',
        'branch_id',
        'shift_id',
        'academic_year_id',
        'semester_id',
        'date',
        'check_in',
        'check_in_lat',
        'check_in_lng',
        'check_out',
        'check_out_lat',
        'check_out_lng',
        'status',
        'late_minutes',
    ];

    protected $casts = [
        'date'          => 'date',
        'check_in_lat'  => 'float',
        'check_in_lng'  => 'float',
        'check_out_lat' => 'float',
        'check_out_lng' => 'float',
        'late_minutes'  => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }
}
