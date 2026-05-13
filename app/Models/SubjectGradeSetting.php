<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubjectGradeSetting extends Model
{
    protected $fillable = [
        'subject_id', 'written_weight', 'homework_weight', 'oral_weight', 'attendance_weight'
    ];

    public function subject(): BelongsTo {
        return $this->belongsTo(Subject::class);
    }
}
