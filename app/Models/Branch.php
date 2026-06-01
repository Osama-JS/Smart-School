<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'address', 'phone', 'is_active',
        'latitude', 'longitude', 'radius_meters',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'latitude'       => 'float',
        'longitude'      => 'float',
        'radius_meters'  => 'integer',
    ];

    /**
     * الموظفون المعيّنون لهذا الفرع (عبر جدول التوزيع)
     */
    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'branch_employee_shift')
                    ->withPivot('shift_id')
                    ->withTimestamps();
    }

    /**
     * الشفتات المرتبطة بهذا الفرع
     */
    public function shifts(): BelongsToMany
    {
        return $this->belongsToMany(Shift::class, 'branch_employee_shift')
                    ->withPivot('employee_id')
                    ->withTimestamps();
    }

    /**
     * سجلات الحضور في هذا الفرع
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * حساب المسافة بين نقطتين جغرافيتين (Haversine Formula) بالمتر
     */
    public function distanceFromMeters(float $lat, float $lng): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat - $this->latitude);
        $dLng = deg2rad($lng - $this->longitude);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($this->latitude)) * cos(deg2rad($lat)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * التحقق إذا كانت الإحداثيات المعطاة ضمن نطاق الفرع
     */
    public function isWithinRadius(float $lat, float $lng): bool
    {
        if (!$this->latitude || !$this->longitude) {
            return true; // إذا لم تُحدَّد إحداثيات، يُقبل الحضور دائماً
        }
        return $this->distanceFromMeters($lat, $lng) <= $this->radius_meters;
    }
}
