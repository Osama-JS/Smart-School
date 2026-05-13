<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassCoverage extends Model
{
    protected $fillable = [
        'coverage_date', 'period_id', 'division_id', 
        'absent_teacher_id', 'substitute_teacher_id'
    ];

    // تحويل حقل التاريخ تلقائياً إلى كائن Carbon لتسهيل التعامل معه
    protected $casts = [
        'coverage_date' => 'date',
    ];

    public function period(): BelongsTo { return $this->belongsTo(DailyPeriod::class); }
    public function division(): BelongsTo { return $this->belongsTo(Division::class); }
    
    // المعلم الغائب
    public function absentTeacher(): BelongsTo { 
        return $this->belongsTo(User::class, 'absent_teacher_id'); 
    }

    // المعلم البديل (الذي أخذ حصة الاحتياط)
    public function substituteTeacher(): BelongsTo { 
        return $this->belongsTo(User::class, 'substitute_teacher_id'); 
    }
}
