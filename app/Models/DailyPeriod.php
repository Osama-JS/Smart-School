<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyPeriod extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['period_name', 'start_time', 'end_time', 'branch_id', 'timetable_group_id', 'is_break'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function group()
    {
        return $this->belongsTo(TimetableGroup::class, 'timetable_group_id');
    }

    // الحصص الموزعة في الجدول الأساسي المرتبطة بهذا التوقيت
    public function timetables(): HasMany {
        return $this->hasMany(MasterTimetable::class, 'period_id');
    }

    // سجلات حصص الاحتياط (التغطيات) التي حدثت في هذا التوقيت
    public function coverages(): HasMany {
        return $this->hasMany(ClassCoverage::class, 'period_id');
    }
}
