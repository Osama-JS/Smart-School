<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAchievement extends Model
{
    use HasFactory, \App\Traits\LogsActivity;

    protected $fillable = [
        'student_id',
        'academic_year_id',
        'branch_id',
        'student_achievement_type_id',
        'description',
        'points',
        'date_awarded',
        'awarded_by',
        'status', // pending, approved, rejected
    ];

    protected $casts = [
        'date_awarded' => 'date',
        'points' => 'integer',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function awardedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'awarded_by');
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(StudentAchievementType::class, 'student_achievement_type_id');
    }
}
