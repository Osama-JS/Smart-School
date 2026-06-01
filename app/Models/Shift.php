<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'start_time', 'end_time', 'grace_period_minutes', 'is_active',
    ];

    protected $casts = [
        'is_active'            => 'boolean',
        'grace_period_minutes' => 'integer',
    ];

    /**
     * الموظفون المعيّنون لهذا الشفت (عبر جدول التوزيع)
     */
    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'branch_employee_shift')
                    ->withPivot('branch_id')
                    ->withTimestamps();
    }

    /**
     * الفروع المرتبطة بهذا الشفت
     */
    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'branch_employee_shift')
                    ->withPivot('employee_id')
                    ->withTimestamps();
    }

    /**
     * سجلات الحضور لهذا الشفت
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
