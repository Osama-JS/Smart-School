<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AchievementType extends Model
{
    use \App\Traits\BelongsToBranch;
    use \App\Traits\LogsActivity;
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'description',
        'reward',
        'points',
        'badge_icon',
        'badge_color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function achievements()
    {
        return $this->hasMany(EmployeeAchievement::class);
    }
}
