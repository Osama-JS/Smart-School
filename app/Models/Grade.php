<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Grade extends Model
{
    protected $fillable = ['section_id', 'name'];

    // القسم الذي ينتمي إليه هذا الصف
    public function section(): BelongsTo { 
        return $this->belongsTo(Section::class); 
    }

    // جميع الشعب الموجودة داخل هذا الصف
    public function divisions(): HasMany { 
        return $this->hasMany(Division::class); 
    }

    // جلب المواد المقررة على هذا الصف
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'grade_subjects')
                    ->withTimestamps();
    }

    // دفاتر التحضير المرتبطة بهذا الصف
    public function lessonPreparations(): HasMany {
        return $this->hasMany(LessonPreparation::class);
    }
}
