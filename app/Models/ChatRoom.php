<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatRoom extends Model
{
    protected $fillable = ['title', 'type'];

    // المستخدمين المشاركين في هذه الغرفة (معلم وولي أمر مثلاً)
    public function users(): BelongsToMany {
        return $this->belongsToMany(User::class, 'chat_room_user');
    }

    // الرسائل داخل الغرفة
    public function messages(): HasMany {
        return $this->hasMany(ChatMessage::class);
    }
}
