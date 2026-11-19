<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppraisalKpi extends Model
{
    protected $fillable = [
        'template_id', 'name', 'category', 'evaluator_roles', 'description', 'weight', 'order'
    ];

    protected $casts = [
        'evaluator_roles' => 'array',
    ];

    public function template()
    {
        return $this->belongsTo(AppraisalTemplate::class, 'template_id');
    }

    public function scores()
    {
        return $this->hasMany(EmployeeAppraisalScore::class, 'kpi_id');
    }

    public function allowsRole(string $roleType): bool
    {
        $roles = $this->evaluator_roles;
        if (empty($roles) || !is_array($roles) || in_array('all', $roles, true)) {
            return true;
        }

        return in_array($roleType, $roles, true);
    }
}
