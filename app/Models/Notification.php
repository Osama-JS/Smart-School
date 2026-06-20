<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Notification extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'user_id', 
        'sender_id', 
        'branch_id',
        'title', 
        'message', 
        'type', 
        'target_type', 
        'target_role', 
        'target_users',
        'is_read'
    ];

    protected $casts = [
        'target_users' => 'array',
    ];

    public function user(): BelongsTo { 
        return $this->belongsTo(User::class); 
    }

    public function sender(): BelongsTo {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function branch(): BelongsTo {
        return $this->belongsTo(Branch::class);
    }

    public function reads(): HasMany {
        return $this->hasMany(UserNotificationRead::class);
    }

    /**
     * Check if the notification is read by the given user
     */
    public function isReadBy(User $user): bool
    {
        // للإشعارات الشخصية القديمة
        if ($this->user_id === $user->id && $this->is_read) {
            return true;
        }

        if ($this->relationLoaded('reads')) {
            return $this->reads->contains('user_id', $user->id);
        }

        // للإشعارات العامة عبر جدول القراءات
        return $this->reads()->where('user_id', $user->id)->exists();
    }
}
