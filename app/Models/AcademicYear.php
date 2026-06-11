<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id', 'name', 'start_date', 'end_date', 'is_active', 'notes'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'is_active'  => 'boolean',
    ];

    // ── العلاقات ──

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function semesters()
    {
        return $this->hasMany(Semester::class)->orderBy('term_number');
    }

    public function activeSemester()
    {
        return $this->hasOne(Semester::class)->where('is_active', true);
    }

    public function divisions()
    {
        return $this->hasMany(Division::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    // ── Helpers ──

    /**
     * جلب السنة الدراسية النشطة للفرع الحالي
     */
    public static function currentForBranch($branchId): ?self
    {
        return static::where('branch_id', $branchId)->where('is_active', true)->first();
    }
}
