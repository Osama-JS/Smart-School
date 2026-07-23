<?php

namespace App\Http\Controllers;

use App\Models\StudyPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudyPlanVerificationController extends Controller
{
    /**
     * Show the public verification page for a study plan.
     */
    public function show($id, Request $request)
    {
        $hash = $request->query('hash');
        $expectedHash = md5($id . config('app.key'));

        if ($hash !== $expectedHash) {
            abort(403, 'رابط التحقق غير صالح أو تم التلاعب به.');
        }

        $studyPlan = StudyPlan::with(['teacher', 'subject', 'grade', 'template', 'branch'])
            ->findOrFail($id);

        return Inertia::render('Public/Verify', [
            'studyPlan' => $studyPlan,
            'isVerified' => $studyPlan->status === 'approved',
            'verifiedAt' => $studyPlan->updated_at->toIso8601String(), // Using updated_at as approval date for simplicity
        ]);
    }

    /**
     * Generate the verification URL for a given study plan.
     */
    public static function generateUrl(StudyPlan $plan)
    {
        $hash = md5($plan->id . config('app.key'));
        return url("/verify/study-plan/{$plan->id}?hash={$hash}");
    }
}
