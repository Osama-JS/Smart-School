<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\AppraisalCycle;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppraisalCycleController extends Controller
{
    public function index()
    {
        $cycles = AppraisalCycle::latest()->get();

        return Inertia::render('HR/Appraisals/Cycles/Index', [
            'cycles' => $cycles
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:monthly,semi-annual,annual',
            'requires_self_appraisal' => 'boolean',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:draft,active,closed',
        ]);

        $cycle = AppraisalCycle::create($validated);

        if ($cycle->status === 'active') {
            $this->notifyEmployees($cycle);
        }

        return redirect()->back()->with('success', 'تم إنشاء دورة التقييم بنجاح.');
    }

    public function update(Request $request, AppraisalCycle $cycle)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:monthly,semi-annual,annual',
            'requires_self_appraisal' => 'boolean',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:draft,active,closed',
        ]);

        $oldStatus = $cycle->status;
        $cycle->update($validated);

        if ($oldStatus !== 'active' && $cycle->status === 'active') {
            $this->notifyEmployees($cycle);
        }

        return redirect()->back()->with('success', 'تم تحديث دورة التقييم بنجاح.');
    }

    private function notifyEmployees(AppraisalCycle $cycle)
    {
        $employees = \App\Models\Employee::with(['user', 'manager.user'])->get();
        $notificationService = new \App\Services\NotificationService();
        $senderId = \Illuminate\Support\Facades\Auth::id();

        if ($cycle->requires_self_appraisal) {
            foreach ($employees as $employee) {
                if ($employee->user && (!$cycle->branch_id || $employee->user->branch_id === $cycle->branch_id)) {
                    $notificationService->sendInternalNotification(
                        $employee->user->id,
                        'دورة تقييم جديدة',
                        "تم فتح دورة تقييم جديدة ({$cycle->title})، يرجى تقديم تقييمك الذاتي.",
                        'hr',
                        $senderId
                    );
                }
            }
            return;
        }

        $notifiedManagerIds = [];
        foreach ($employees as $employee) {
            if ($cycle->branch_id && $employee->user && $employee->user->branch_id !== $cycle->branch_id) {
                continue;
            }
            $managerUser = $employee->manager?->user;
            if ($managerUser && !in_array($managerUser->id, $notifiedManagerIds, true)) {
                $notifiedManagerIds[] = $managerUser->id;
                $notificationService->sendInternalNotification(
                    $managerUser->id,
                    'دورة تقييم جديدة بانتظار تقييم المدير',
                    "تم تفعيل دورة التقييم ({$cycle->title}) بدون مرحلة تقييم ذاتي، يرجى البدء في تقييم مرؤوسيك.",
                    'hr',
                    $senderId
                );
            }
        }
    }

    public function destroy(AppraisalCycle $cycle)
    {
        $cycle->delete();
        return redirect()->back()->with('success', 'تم حذف دورة التقييم بنجاح.');
    }
}
