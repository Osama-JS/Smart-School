<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToBranch;

class JobGrade extends Model
{
    use \App\Traits\LogsActivity;

    use BelongsToBranch;

    protected $fillable = ['name', 'level', 'branch_id', 'parent_id'];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function parent()
    {
        return $this->belongsTo(JobGrade::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(JobGrade::class, 'parent_id');
    }
}
