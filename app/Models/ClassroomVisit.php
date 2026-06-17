<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassroomVisit extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'supervisor_id', 'teacher_id', 'academic_year_id', 'semester_id',
        'visit_date', 'score', 'notes'
    ];

    protected $casts = [
        'visit_date' => 'date',
    ];

    /** المشرف الذي قام بالزيارة */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    /** المعلم الذي تم تقييمه */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /** السنة الدراسية */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /** الفصل الدراسي */
    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function scopeForYear($query, $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }
}
