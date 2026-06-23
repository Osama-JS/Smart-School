<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonPreparation extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'teacher_id', 'branch_id', 'academic_year_id', 'semester_id', 'subject_id', 'grade_id', 'division_id',
        'lesson_title', 'preparation_date', 'content', 'topics_covered', 'notes', 'homework', 'status'
    ];

    protected $casts = [
        'preparation_date' => 'date',
    ];

    public function teacher(): BelongsTo  { return $this->belongsTo(User::class, 'teacher_id'); }
    public function branch(): BelongsTo   { return $this->belongsTo(Branch::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function semester(): BelongsTo { return $this->belongsTo(Semester::class); }
    public function subject(): BelongsTo  { return $this->belongsTo(Subject::class); }
    public function grade(): BelongsTo    { return $this->belongsTo(Grade::class); }
    public function division(): BelongsTo { return $this->belongsTo(Division::class); }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }

    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }
}
