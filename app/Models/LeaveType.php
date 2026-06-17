<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    protected $fillable = ['branch_id', 'name', 'default_days'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function balances()
    {
        return $this->hasMany(LeaveBalance::class);
    }
}
