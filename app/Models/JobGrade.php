<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToBranch;

class JobGrade extends Model
{
    use BelongsToBranch;

    protected $fillable = ['name', 'level', 'branch_id'];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
