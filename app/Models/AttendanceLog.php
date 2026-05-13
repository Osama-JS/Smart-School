<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class AttendanceLog extends Model
{
    protected $fillable = ['user_id', 'attendance_date', 'status'];

    protected $casts = [
        'attendance_date' => 'date',
    ];

    // المستخدم أو الطالب المرتبط بهذا السجل
    public function user(): BelongsTo { 
        return $this->belongsTo(User::class); 
    }

    /**
     * نطاق برمجي: لجلب الغائبين فقط
     * الاستخدام: AttendanceLog::absent()->get();
     */
    public function scopeAbsent(Builder $query): void
    {
        $query->where('status', 'absent');
    }

    /**
     * نطاق برمجي: لجلب سجلات اليوم فقط
     * الاستخدام: AttendanceLog::today()->get();
     */
    public function scopeToday(Builder $query): void
    {
        $query->whereDate('attendance_date', today());
    }
}
