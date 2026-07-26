<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudentAchievementType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentAchievementTypeController extends Controller
{
    public function index(Request $request)
    {
        abort_if(!auth()->user()->hasPermission('إدارة أنواع الإنجازات'), 403, 'غير مصرح لك.');

        $branchId = auth()->user()->branch_id;

        $types = StudentAchievementType::where('branch_id', $branchId)
            ->latest()
            ->get();

        return Inertia::render('Academic/StudentAchievementTypes/Index', [
            'achievementTypes' => $types,
        ]);
    }

    public function store(Request $request)
    {
        abort_if(!auth()->user()->hasPermission('إدارة أنواع الإنجازات'), 403, 'غير مصرح لك.');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'default_points' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;
        $validated['is_active'] = $request->has('is_active') ? $request->is_active : true;

        StudentAchievementType::create($validated);

        return redirect()->back()->with('success', 'تمت إضافة نوع الإنجاز بنجاح.');
    }

    public function update(Request $request, StudentAchievementType $achievement_type)
    {
        abort_if(!auth()->user()->hasPermission('إدارة أنواع الإنجازات'), 403, 'غير مصرح لك.');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'default_points' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $achievement_type->update($validated);

        return redirect()->back()->with('success', 'تم تعديل نوع الإنجاز بنجاح.');
    }

    public function destroy(StudentAchievementType $achievement_type)
    {
        abort_if(!auth()->user()->hasPermission('إدارة أنواع الإنجازات'), 403, 'غير مصرح لك.');

        if ($achievement_type->achievements()->exists()) {
            return redirect()->back()->with('error', 'لا يمكن حذف نوع الإنجاز لوجود إنجازات مرتبطة به. يمكنك تعطيله بدلاً من الحذف.');
        }

        $achievement_type->delete();

        return redirect()->back()->with('success', 'تم حذف نوع الإنجاز بنجاح.');
    }
}
