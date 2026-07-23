<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'user_id',
        'visited_at',
        'symptoms',
        'action_taken',
        'status',
    ];

    protected $casts = [
        'visited_at' => 'datetime',
    ];

    /**
     * Get the student who visited the clinic.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the user (nurse/doctor) who handled the visit.
     */
    public function nurse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
