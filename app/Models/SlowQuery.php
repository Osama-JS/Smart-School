<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SlowQuery extends Model
{
    use HasFactory;

    protected $fillable = [
        'sql_query',
        'bindings',
        'execution_time_ms',
        'path',
    ];

    protected $casts = [
        'bindings' => 'array',
        'execution_time_ms' => 'float',
    ];
}
