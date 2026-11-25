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

    public function allowsRole(string $roleType, ?User $user = null): bool
    {
        $roles = $this->evaluator_roles;
        if (empty($roles) || !is_array($roles) || in_array('all', $roles, true)) {
            return true;
        }

        if (in_array($roleType, $roles, true)) {
            return true;
        }

        $user = $user ?? auth()->user();
        if (!$user) {
            return false;
        }

        $user->loadMissing(['employee.jobGrade', 'role']);
        $jobGradeName = $user->employee?->jobGrade?->name;
        $jobGradeId = $user->employee?->job_grade_id;
        $roleName = $user->role?->name;
        $normalizedRoles = array_map('strval', $roles);

        if ($jobGradeName && in_array($jobGradeName, $normalizedRoles, true)) {
            return true;
        }
        if ($jobGradeId !== null && in_array((string) $jobGradeId, $normalizedRoles, true)) {
            return true;
        }
        if ($roleName && in_array($roleName, $normalizedRoles, true)) {
            return true;
        }

        // Allow evaluators without a specific job grade assigned (e.g. System Admin / HR)
        if (!$jobGradeId && !$jobGradeName) {
            return true;
        }

        return false;
    }
}
