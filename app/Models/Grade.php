<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Grade extends Model
{
    protected $fillable = ['section_id', 'branch_id', 'name'];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** القسم (المرحلة) الذي ينتمي إليه هذا الصف */
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    /** جميع الشعب في هذا الصف (في أي سنة دراسية) */
    public function divisions(): HasMany
    {
        return $this->hasMany(Division::class);
    }

    /** شعب السنة الدراسية المحددة */
    public function divisionsForYear($academicYearId): HasMany
    {
        return $this->hasMany(Division::class)->where('academic_year_id', $academicYearId);
    }

    /** المواد المقررة على هذا الصف */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'grade_subjects')->withTimestamps();
    }

    /** دفاتر التحضير المرتبطة بهذا الصف */
    public function lessonPreparations(): HasMany
    {
        return $this->hasMany(LessonPreparation::class);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
