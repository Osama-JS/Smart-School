<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudyPlan extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['teacher_id', 'grade_id', 'subject_id', 'division_ids', 'title', 'notes', 'attachment_path', 'status', 'admin_feedback', 'template_id', 'content', 'month'];

    protected $casts = [
        'division_ids' => 'array',
        'content' => 'array',
    ];

    protected $appends = ['verification_url'];

    public function getVerificationUrlAttribute()
    {
        $hash = md5($this->id . config('app.key'));
        return url("/verify/study-plan/{$this->id}?hash={$hash}");
    }

    public function teacher(): BelongsTo { return $this->belongsTo(User::class, 'teacher_id'); }
    public function grade(): BelongsTo { return $this->belongsTo(Grade::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function template(): BelongsTo
    {
        return $this->belongsTo(StudyPlanTemplate::class, 'template_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(StudyPlanComment::class);
    }
}
