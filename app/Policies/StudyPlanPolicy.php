<?php

namespace App\Policies;

use App\Models\StudyPlan;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class StudyPlanPolicy
{
    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, StudyPlan $studyPlan): bool
    {
        return $user->id === $studyPlan->teacher_id && in_array($studyPlan->status, ['draft', 'rejected']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, StudyPlan $studyPlan): bool
    {
        if ($user->id === $studyPlan->teacher_id) {
            return in_array($studyPlan->status, ['draft', 'rejected']);
        }

        if (empty($user->branch_id)) {
            return true;
        }

        return $studyPlan->teacher ? $studyPlan->teacher->branch_id === $user->branch_id : false;
    }

    /**
     * Determine whether the user can review the model (Academic only)
     */
    public function review(User $user, StudyPlan $studyPlan): bool
    {
        if (empty($user->branch_id)) {
            return true;
        }
        return $studyPlan->teacher ? $studyPlan->teacher->branch_id === $user->branch_id : false;
    }

    /**
     * Determine whether the user can download the model.
     */
    public function download(User $user, StudyPlan $studyPlan): bool
    {
        if ($user->id === $studyPlan->teacher_id) {
            return true;
        }

        if (empty($user->branch_id)) {
            return true;
        }
        
        return $studyPlan->teacher ? $studyPlan->teacher->branch_id === $user->branch_id : false;
    }
}
