<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentMedicalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'height',
        'weight',
        'blood_type',
        'allergies',
        'chronic_diseases',
        'regular_medications',
        'past_surgeries',
        'consent_given',
    ];

    protected $casts = [
        'height' => 'float',
        'weight' => 'float',
        'consent_given' => 'boolean',
    ];

    /**
     * Get the student that owns the medical record.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Calculate BMI (Body Mass Index).
     * Formula: weight (kg) / [height (m)]^2
     */
    public function getBmiAttribute(): ?float
    {
        if ($this->weight && $this->height) {
            $heightInMeters = $this->height / 100;
            if ($heightInMeters > 0) {
                return round($this->weight / ($heightInMeters * $heightInMeters), 2);
            }
        }
        return null;
    }
}
