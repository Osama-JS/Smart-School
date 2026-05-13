<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Section extends Model
{
    protected $fillable = ['name'];

    /**
     * جلب جميع الصفوف التابعة لهذا القسم
     */
    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }
}
