<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToBranch;

class Department extends Model
{
    use \App\Traits\LogsActivity;
    use BelongsToBranch;

    protected $fillable = ['name', 'parent_id', 'branch_id'];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function parent()
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Department::class, 'parent_id');
    }
}
