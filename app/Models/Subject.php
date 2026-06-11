<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $fillable = ['name', 'icon', 'branch_id'];

    // الفرع الذي تتبعه المادة
    public function branch() {
        return $this->belongsTo(Branch::class);
    }

    // الدرجات المرتبطة بهذه المادة
    public function monthlyGrades(): HasMany { 
        return $this->hasMany(MonthlyGrade::class); 
    }

    // دفاتر التحضير الخاصة بهذه المادة
    public function lessonPreparations(): HasMany { 
        return $this->hasMany(LessonPreparation::class); 
    }

    // جلب الصفوف التي تدرس هذه المادة
    public function grades()
    {
        return $this->belongsToMany(Grade::class, 'grade_subjects')
                    ->withTimestamps();
    }
}
