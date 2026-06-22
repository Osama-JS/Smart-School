<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassroomVisit extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'branch_id', 'academic_year_id', 'semester_id',
        'supervisor_id', 'teacher_id', 'grade_id', 'division_id',
        'visit_date', 'visit_type', 'discussed_points', 'notes', 'score',
        'supervisor_signature', 'teacher_signature', 'is_approved'
    ];

    protected $casts = [
        'visit_date' => 'date',
        'is_approved' => 'boolean',
    ];

    /** الفرع */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

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

    /** الصف */
    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    /** الشعبة */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
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
