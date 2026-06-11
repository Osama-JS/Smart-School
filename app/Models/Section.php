<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Section extends Model
{
    protected $fillable = ['branch_id', 'name'];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** جلب جميع الصفوف التابعة لهذه المرحلة */
    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
