<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobGrade extends Model
{
    protected $fillable = ['name', 'level'];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
