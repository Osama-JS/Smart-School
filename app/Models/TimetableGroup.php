<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimetableGroup extends Model
{
    protected $fillable = ['name', 'branch_id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function grades()
    {
        return $this->belongsToMany(Grade::class, 'timetable_group_grades');
    }

    public function periods()
    {
        return $this->hasMany(DailyPeriod::class);
    }
}
