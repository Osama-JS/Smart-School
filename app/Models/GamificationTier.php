<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GamificationTier extends Model
{
    use HasFactory;
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'branch_id',
        'name',
        'min_points',
        'icon',
        'color_class',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
