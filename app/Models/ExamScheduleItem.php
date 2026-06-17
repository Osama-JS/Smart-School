<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamScheduleItem extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['schedule_id', 'division_id', 'subject_id', 'exam_date', 'syllabus'];

    protected $casts = ['exam_date' => 'date'];

    public function schedule(): BelongsTo { return $this->belongsTo(ExamSchedule::class, 'schedule_id'); }
    public function division(): BelongsTo { return $this->belongsTo(Division::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
}
