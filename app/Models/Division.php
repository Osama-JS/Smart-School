<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Division extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'grade_id', 'branch_id', 'academic_year_id',
        'name', 'max_students', 'homeroom_teacher_id'
    ];

    // ── العلاقات ──

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** السنة الدراسية التي تنتمي إليها هذه الشعبة */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /** المعلم المسؤول (Homeroom Teacher) */
    public function homeroomTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'homeroom_teacher_id');
    }

    /** سجلات الطلاب المسجلين في هذه الشعبة */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /** عدد الطلاب الحاليين */
    public function getStudentsCountAttribute(): int
    {
        return $this->enrollments()->where('status', 'active')->count();
    }

    /** هل الشعبة ممتلئة؟ */
    public function getIsFullAttribute(): bool
    {
        return $this->students_count >= $this->max_students;
    }

    /** جدول الحصص الخاص بهذه الشعبة */
    public function timetables(): HasMany
    {
        return $this->hasMany(MasterTimetable::class);
    }

    /** توزيع المعلمين والمواد على هذه الشعبة */
    public function subjectTeachers(): HasMany
    {
        return $this->hasMany(DivisionSubjectTeacher::class);
    }

    // ── Scopes ──

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForYear($query, $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->whereHas('timetables', fn($q) => $q->where('semester_id', $semesterId));
    }
}
