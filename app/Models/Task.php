<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;
    use \App\Traits\BelongsToBranch;
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'branch_id',
        'title',
        'description',
        'status',
        'priority',
        'due_date',
        'assigned_to',
        'assigned_by',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
