<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class MasterTimetable extends Model
{
    // تحديد اسم الجدول لتجنب خطأ التسمية التلقائية في Laravel
    protected $table = 'master_timetable'; 

    protected $fillable = ['division_id', 'period_id', 'subject_id', 'teacher_id', 'day_of_week'];

    public function division(): BelongsTo { return $this->belongsTo(Division::class); }
    public function period(): BelongsTo { return $this->belongsTo(DailyPeriod::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function teacher(): BelongsTo { return $this->belongsTo(User::class, 'teacher_id'); }

    /**
     * نطاق برمجي (Scope): لجلب جدول اليوم الحالي فقط
     * الاستخدام لاحقاً: MasterTimetable::today()->get();
     */
    public function scopeToday(Builder $query): void
    {
        // تحويل تاريخ اليوم إلى اسم اليوم بالإنجليزية لمطابقة قاعدة البيانات
        $today = now()->format('l'); 
        $query->where('day_of_week', $today);
    }
}
