<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubjectGradeSetting extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'subject_id', 'criteria_weights'
    ];

    protected $casts = [
        'criteria_weights' => 'array',
    ];

    public function subject(): BelongsTo {
        return $this->belongsTo(Subject::class);
    }
}
