<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Division extends Model
{
    protected $fillable = ['grade_id', 'name'];

    public function grade(): BelongsTo { 
        return $this->belongsTo(Grade::class); 
    }

    // سجلات الطلاب المسجلين في هذه الشعبة
    public function enrollments(): HasMany { 
        return $this->hasMany(Enrollment::class); 
    }

    // جدول الحصص الخاص بهذه الشعبة
    public function timetables(): HasMany { 
        return $this->hasMany(MasterTimetable::class); 
    }

    // توزيع المعلمين والمواد على هذه الشعبة
    public function subjectTeachers(): HasMany {
        return $this->hasMany(DivisionSubjectTeacher::class);
    }
}
