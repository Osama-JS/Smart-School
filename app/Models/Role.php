<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use \App\Traits\LogsActivity;
    use HasFactory;

    protected $fillable = ['name'];

    /**
     * جلب المستخدمين الذين يحملون هذا الدور
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * الصلاحيات الممنوحة لهذا الدور
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role')
                    ->withTimestamps();
    }
}
