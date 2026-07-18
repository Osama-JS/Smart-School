<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyPlan extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['teacher_id', 'grade_id', 'subject_id', 'division_ids', 'title', 'notes', 'attachment_path', 'status', 'admin_feedback'];

    protected $casts = [
        'division_ids' => 'array',
    ];

    public function teacher(): BelongsTo { return $this->belongsTo(User::class, 'teacher_id'); }
    public function grade(): BelongsTo { return $this->belongsTo(Grade::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
}
