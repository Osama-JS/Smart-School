<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GamificationBadge extends Model
{
    use HasFactory;
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'branch_id',
        'name',
        'description',
        'category_target',
        'required_count',
        'icon',
        'color_class',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
