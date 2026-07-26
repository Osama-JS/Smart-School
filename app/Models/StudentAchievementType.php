<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentAchievementType extends Model
{
    use HasFactory;
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'branch_id',
        'name',
        'category',
        'description',
        'default_points',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'default_points' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function achievements(): HasMany
    {
        return $this->hasMany(StudentAchievement::class);
    }
}
