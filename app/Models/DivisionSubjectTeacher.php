<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DivisionSubjectTeacher extends Model
{
    protected $fillable = ['division_id', 'subject_id', 'teacher_id'];

    public function division(): BelongsTo { return $this->belongsTo(Division::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function teacher(): BelongsTo { return $this->belongsTo(User::class, 'teacher_id'); }
}
