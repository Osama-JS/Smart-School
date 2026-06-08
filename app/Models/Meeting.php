<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToBranch;

class Meeting extends Model
{
    use HasFactory, BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'supervisor_id',
        'title',
        'date',
        'time',
        'type',
        'status',
        'agendas',
        'outcomes',
        'recommendations'
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime:H:i',
        'agendas' => 'array',
    ];

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function participants()
    {
        return $this->hasMany(MeetingParticipant::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
