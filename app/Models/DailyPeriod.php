<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyPeriod extends Model
{
    protected $fillable = ['period_name', 'start_time', 'end_time'];

    // الحصص الموزعة في الجدول الأساسي المرتبطة بهذا التوقيت
    public function timetables(): HasMany {
        return $this->hasMany(MasterTimetable::class, 'period_id');
    }

    // سجلات حصص الاحتياط (التغطيات) التي حدثت في هذا التوقيت
    public function coverages(): HasMany {
        return $this->hasMany(ClassCoverage::class, 'period_id');
    }
}
