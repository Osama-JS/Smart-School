<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToBranch;

class ActivityLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'user_id', 'branch_id', 'action', 'table_name', 'old_values', 'new_values'
    ];

    // تحويل حقول القيم إلى مصفوفات JSON تلقائياً لسهولة التعامل معها
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * جلب المستخدم الذي قام بهذا الإجراء
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
