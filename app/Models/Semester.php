<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    use \App\Traits\LogsActivity;

    use HasFactory;

    protected $fillable = [
        'academic_year_id', 'name', 'term_number', 'start_date', 'end_date', 'is_active'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'is_active'  => 'boolean',
    ];

    // ── العلاقات ──

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function divisionSubjectTeachers()
    {
        return $this->hasMany(DivisionSubjectTeacher::class);
    }

    public function masterTimetables()
    {
        return $this->hasMany(MasterTimetable::class);
    }

    public function resultPeriods()
    {
        return $this->hasMany(ResultPeriod::class);
    }

    public function monthlyGrades()
    {
        return $this->hasMany(MonthlyGrade::class);
    }

    public function lessonPreparations()
    {
        return $this->hasMany(LessonPreparation::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Helpers ──

    /**
     * جلب الفصل النشط للسنة الدراسية المحددة
     */
    public static function currentForYear($academicYearId): ?self
    {
        return static::where('academic_year_id', $academicYearId)
            ->where('is_active', true)
            ->first();
    }

    /**
     * الحصول على اسم الفصل مع اسم السنة
     */
    public function getFullNameAttribute(): string
    {
        return $this->academicYear->name . ' - ' . $this->name;
    }
}
