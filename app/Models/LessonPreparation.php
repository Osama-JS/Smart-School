<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonPreparation extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'teacher_id', 'semester_id', 'subject_id', 'grade_id',
        'lesson_title', 'preparation_date', 'content'
    ];

    protected $casts = [
        'preparation_date' => 'date',
    ];

    public function teacher(): BelongsTo  { return $this->belongsTo(User::class, 'teacher_id'); }
    public function semester(): BelongsTo { return $this->belongsTo(Semester::class); }
    public function subject(): BelongsTo  { return $this->belongsTo(Subject::class); }
    public function grade(): BelongsTo    { return $this->belongsTo(Grade::class); }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }

    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }
}
