<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklyEvaluation extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'enrollment_id', 'criteria_id', 'subject_id', 'week_name', 'grade'
    ];

    public function enrollment(): BelongsTo { return $this->belongsTo(Enrollment::class); }
    public function criteria(): BelongsTo { return $this->belongsTo(EvaluationCriteria::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
}
