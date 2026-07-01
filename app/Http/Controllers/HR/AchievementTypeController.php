<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\AchievementType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AchievementTypeController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض أنواع الإنجازات', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة نوع إنجاز', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل نوع إنجاز', only: ['edit', 'update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف نوع إنجاز', only: ['destroy']),
        ];
    }
    
    public function index()
    {
        $types = AchievementType::query()
            ->orderBy('name')
            ->get();

        $stats = [
            'total' => AchievementType::count(),
            'active' => AchievementType::where('is_active', true)->count(),
            'inactive' => AchievementType::where('is_active', false)->count(),
        ];

        return Inertia::render('HR/Achievements/Types', [
            'types' => $types,
            'stats' => $stats
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'reward' => 'nullable|string|max:255',
            'points' => 'nullable|integer|min:0',
            'badge_icon' => 'nullable|string|max:255',
            'badge_color' => 'nullable|string|max:255',
            'is_active' => 'boolean'
        ]);

        AchievementType::create($validated);

        return back()->with('success', 'تم إضافة نوع الإنجاز بنجاح.');
    }

    public function update(Request $request, AchievementType $achievementType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'reward' => 'nullable|string|max:255',
            'points' => 'nullable|integer|min:0',
            'badge_icon' => 'nullable|string|max:255',
            'badge_color' => 'nullable|string|max:255',
            'is_active' => 'boolean'
        ]);

        $achievementType->update($validated);

        return back()->with('success', 'تم تحديث نوع الإنجاز بنجاح.');
    }

    public function destroy(AchievementType $achievementType)
    {
        $hasAchievements = \App\Models\EmployeeAchievement::where('achievement_type_id', $achievementType->id)->exists();

        if ($hasAchievements) {
            return back()->with('error', 'لا يمكن حذف هذا النوع لارتباطه بإنجازات مسجلة لموظفين.');
        }

        $achievementType->delete();
        return back()->with('success', 'تم حذف نوع الإنجاز بنجاح.');
    }
}
