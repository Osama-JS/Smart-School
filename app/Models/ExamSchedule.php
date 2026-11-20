<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSchedule extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['period_id', 'title', 'details', 'status', 'published_at', 'published_by'];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function period(): BelongsTo { return $this->belongsTo(ResultPeriod::class, 'period_id'); }
    public function items(): HasMany { return $this->hasMany(ExamScheduleItem::class, 'schedule_id'); }
    public function publisher(): BelongsTo { return $this->belongsTo(User::class, 'published_by'); }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
