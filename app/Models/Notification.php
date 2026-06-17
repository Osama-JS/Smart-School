<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Notification extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['user_id', 'title', 'message', 'type', 'is_read'];

    public function user(): BelongsTo { 
        return $this->belongsTo(User::class); 
    }

    // نطاق لجلب الإشعارات غير المقروءة فقط
    public function scopeUnread(Builder $query): void {
        $query->where('is_read', false);
    }
}
