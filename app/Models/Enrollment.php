<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    // is_result_blocked هو الحقل الذي يتحكم به النظام المالي لحجب النتائج
    protected $fillable = ['student_id', 'division_id', 'academic_year', 'is_result_blocked'];

    public function student(): BelongsTo { 
        return $this->belongsTo(Student::class); 
    }

    public function division(): BelongsTo { 
        return $this->belongsTo(Division::class); 
    }

    // درجات الطالب الشهرية لهذا العام
    public function monthlyGrades(): HasMany { 
        return $this->hasMany(MonthlyGrade::class); 
    }

    // التقييمات الأسبوعية (السلوك والمشاركة)
    public function weeklyEvaluations(): HasMany { 
        return $this->hasMany(WeeklyEvaluation::class); 
    }
}
