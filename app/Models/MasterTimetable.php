<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class MasterTimetable extends Model
{
    use \App\Traits\LogsActivity;

    protected $table = 'master_timetable';

    protected $fillable = [
        'division_id', 'semester_id', 'period_id', 'subject_id', 'teacher_id', 'day_of_week'
    ];

    public function division(): BelongsTo  { return $this->belongsTo(Division::class); }
    public function semester(): BelongsTo  { return $this->belongsTo(Semester::class); }
    public function period(): BelongsTo    { return $this->belongsTo(DailyPeriod::class); }
    public function subject(): BelongsTo   { return $this->belongsTo(Subject::class); }
    public function teacher(): BelongsTo   { return $this->belongsTo(User::class, 'teacher_id'); }

    /** جلب جدول اليوم الحالي */
    public function scopeToday(Builder $query): void
    {
        $query->where('day_of_week', now()->format('l'));
    }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }
}
