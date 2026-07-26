<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\GamificationTier;
use App\Models\GamificationBadge;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;

class GamificationSettingsController extends Controller
{
    public function index()
    {
        abort_if(!auth()->user()->hasPermission('إعدادات التلعيب والشارات'), 403, 'غير مصرح لك.');

        $branchId = auth()->user()->branch_id;

        $tiers = GamificationTier::where('branch_id', $branchId)->orderByDesc('min_points')->get();
        $badges = GamificationBadge::where('branch_id', $branchId)->get();

        return Inertia::render('Academic/GamificationSettings/Index', [
            'tiers' => $tiers,
            'badges' => $badges,
        ]);
    }

    // Tiers CRUD
    public function storeTier(Request $request)
    {
        abort_if(!auth()->user()->hasPermission('إعدادات التلعيب والشارات'), 403, 'غير مصرح لك.');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'min_points' => 'required|integer|min:0',
            'icon' => 'required|string|max:50',
            'color_class' => 'required|string|max:100',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;
        GamificationTier::create($validated);
        
        Cache::forget("gamification_tiers_{$validated['branch_id']}");

        return redirect()->back()->with('success', 'تمت إضافة المستوى بنجاح.');
    }

    public function updateTier(Request $request, GamificationTier $tier)
    {
        abort_if(!auth()->user()->hasPermission('إعدادات التلعيب والشارات'), 403, 'غير مصرح لك.');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'min_points' => 'required|integer|min:0',
            'icon' => 'required|string|max:50',
            'color_class' => 'required|string|max:100',
        ]);

        $tier->update($validated);
        Cache::forget("gamification_tiers_{$tier->branch_id}");

        return redirect()->back()->with('success', 'تم تعديل المستوى بنجاح.');
    }

    public function destroyTier(GamificationTier $tier)
    {
        abort_if(!auth()->user()->hasPermission('إعدادات التلعيب والشارات'), 403, 'غير مصرح لك.');

        $branchId = $tier->branch_id;
        $tier->delete();
        Cache::forget("gamification_tiers_{$branchId}");

        return redirect()->back()->with('success', 'تم حذف المستوى بنجاح.');
    }

    // Badges CRUD
    public function storeBadge(Request $request)
    {
        abort_if(!auth()->user()->hasPermission('إعدادات التلعيب والشارات'), 403, 'غير مصرح لك.');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'category_target' => 'required|string|max:100',
            'required_count' => 'required|integer|min:1',
            'icon' => 'required|string|max:50',
            'color_class' => 'required|string|max:100',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;
        GamificationBadge::create($validated);
        
        Cache::forget("gamification_badges_{$validated['branch_id']}");

        return redirect()->back()->with('success', 'تمت إضافة الشارة بنجاح.');
    }

    public function updateBadge(Request $request, GamificationBadge $badge)
    {
        abort_if(!auth()->user()->hasPermission('إعدادات التلعيب والشارات'), 403, 'غير مصرح لك.');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'category_target' => 'required|string|max:100',
            'required_count' => 'required|integer|min:1',
            'icon' => 'required|string|max:50',
            'color_class' => 'required|string|max:100',
        ]);

        $badge->update($validated);
        Cache::forget("gamification_badges_{$badge->branch_id}");

        return redirect()->back()->with('success', 'تم تعديل الشارة بنجاح.');
    }

    public function destroyBadge(GamificationBadge $badge)
    {
        abort_if(!auth()->user()->hasPermission('إعدادات التلعيب والشارات'), 403, 'غير مصرح لك.');

        $branchId = $badge->branch_id;
        $badge->delete();
        Cache::forget("gamification_badges_{$branchId}");

        return redirect()->back()->with('success', 'تم حذف الشارة بنجاح.');
    }
}
