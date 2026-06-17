<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DivisionSubjectTeacher extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['division_id', 'semester_id', 'subject_id', 'teacher_id'];

    public function division(): BelongsTo  { return $this->belongsTo(Division::class); }
    public function semester(): BelongsTo  { return $this->belongsTo(Semester::class); }
    public function subject(): BelongsTo   { return $this->belongsTo(Subject::class); }
    public function teacher(): BelongsTo   { return $this->belongsTo(User::class, 'teacher_id'); }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }
}
