<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['sync_type', 'status', 'error_details'];
}
