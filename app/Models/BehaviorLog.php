<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BehaviorLog extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'targeted_user_id', 'supervisor_id', 'record_type', 'title', 'notes'
    ];

    // الطالب (أو المستخدم) المستهدف بالمخالفة/الإنجاز
    public function targetedUser(): BelongsTo { 
        return $this->belongsTo(User::class, 'targeted_user_id'); 
    }

    // الإداري الذي سجل الحالة
    public function supervisor(): BelongsTo { 
        return $this->belongsTo(User::class, 'supervisor_id'); 
    }
}
