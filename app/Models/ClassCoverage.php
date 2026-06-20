<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassCoverage extends Model
{
    use \App\Traits\LogsActivity;

    protected $table = 'class_coverages';

    protected $fillable = [
        'coverage_date',
        'period_id',
        'division_id',
        'semester_id',
        'subject_id',
        'branch_id',
        'absent_teacher_id',
        'substitute_teacher_id',
        'recorded_by',
        'coverage_type',
        'notes',
        'substitute_notified',
    ];

    protected $casts = [
        'coverage_date'       => 'date',
        'substitute_notified' => 'boolean',
    ];

    // ── Relationships ────────────────────────────────────────────────

    public function absentTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'absent_teacher_id');
    }

    public function substituteTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'substitute_teacher_id');
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(DailyPeriod::class, 'period_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    // ── Helpers ──────────────────────────────────────────────────────

    /**
     * Notify the substitute teacher.
     * Placeholder — will be wired to Firebase/Email when notification
     * service is built.
     */
    public function notifySubstitute(): void
    {
        // TODO: dispatch notification to $this->substituteTeacher
        // NotificationService::send($this->substituteTeacher, new CoverageAssignedNotification($this));
        $this->update(['substitute_notified' => true]);
    }

    // ── Scopes ───────────────────────────────────────────────────────

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForDate($query, $date)
    {
        return $query->whereDate('coverage_date', $date);
    }

    public function scopeForAbsentTeacher($query, $teacherId)
    {
        return $query->where('absent_teacher_id', $teacherId);
    }

    public function scopeForSubstitute($query, $userId)
    {
        return $query->where('substitute_teacher_id', $userId);
    }
}
