<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassroomVisit extends Model
{
    protected $fillable = ['supervisor_id', 'teacher_id', 'visit_date', 'score', 'notes'];

    protected $casts = [
        'visit_date' => 'date',
    ];

    // المشرف الذي قام بالزيارة
    public function supervisor(): BelongsTo { 
        return $this->belongsTo(User::class, 'supervisor_id'); 
    }

    // المعلم الذي تم تقييمه
    public function teacher(): BelongsTo { 
        return $this->belongsTo(User::class, 'teacher_id'); 
    }
}
