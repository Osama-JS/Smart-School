<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EvaluationCriteria extends Model
{
    protected $fillable = ['name', 'target_type'];

    public function weeklyEvaluations(): HasMany {
        return $this->hasMany(WeeklyEvaluation::class, 'criteria_id');
    }
}
