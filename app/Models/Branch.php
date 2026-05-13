<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = ['name'];

    /**
     * جلب جميع المستخدمين المنتمين لهذا الفرع
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
