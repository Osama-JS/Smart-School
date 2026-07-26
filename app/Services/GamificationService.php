<?php

namespace App\Services;

use App\Models\GamificationTier;
use App\Models\GamificationBadge;
use Illuminate\Support\Facades\Cache;

class GamificationService
{
    /**
     * حساب المستوى بناءً على عدد النقاط من قاعدة البيانات
     */
    public function calculateTier(int $totalPoints): array
    {
        $branchId = auth()->user()->branch_id;
        
        $tiers = Cache::rememberForever("gamification_tiers_{$branchId}", function () use ($branchId) {
            return GamificationTier::where('branch_id', $branchId)->orderByDesc('min_points')->get();
        });

        foreach ($tiers as $tier) {
            if ($totalPoints >= $tier->min_points) {
                return [
                    'name' => $tier->name,
                    'icon' => $tier->icon,
                    'color_class' => $tier->color_class,
                ];
            }
        }

        return [
            'name' => 'أساسي',
            'icon' => 'Award',
            'color_class' => 'bg-slate-100 text-slate-700 border-slate-300',
        ];
    }

    /**
     * منح الشارات التخصصية من قاعدة البيانات بناءً على الفئات المحققة
     * $categoryCounts = ['أكاديمي' => 3, 'رياضي' => 1, ...]
     */
    public function calculateBadges(array $categoryCounts): array
    {
        $branchId = auth()->user()->branch_id;

        $availableBadges = Cache::rememberForever("gamification_badges_{$branchId}", function () use ($branchId) {
            return GamificationBadge::where('branch_id', $branchId)->get();
        });

        $badges = [];

        foreach ($availableBadges as $badge) {
            $target = $badge->category_target;
            if (($categoryCounts[$target] ?? 0) >= $badge->required_count) {
                $badges[] = [
                    'name' => $badge->name,
                    'icon' => $badge->icon,
                    'color_class' => $badge->color_class, // This is combined bg and text color
                    'bg' => '', // Backwards compatibility for UI
                    'color' => $badge->color_class,
                    'description' => $badge->description
                ];
            }
        }

        return $badges;
    }

    /**
     * جلب بيانات التلعيب لطالب محدد
     */
    public function getStudentGamificationData(int $studentId, int $branchId): array
    {
        $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            return [
                'total_points' => 0,
                'achievements_count' => 0,
                'current_tier' => $this->calculateTier(0),
                'badges' => [],
            ];
        }

        $achievements = \App\Models\StudentAchievement::with('type')
            ->where('student_id', $studentId)
            ->where('academic_year_id', $activeYear->id)
            ->where('branch_id', $branchId)
            ->where('status', 'approved')
            ->get();

        $totalPoints = $achievements->sum('points');

        $categoryCounts = [];
        foreach ($achievements as $ach) {
            $category = $ach->type->category ?? 'أخرى';
            if (!isset($categoryCounts[$category])) {
                $categoryCounts[$category] = 0;
            }
            $categoryCounts[$category]++;
        }

        return [
            'total_points' => $totalPoints,
            'achievements_count' => $achievements->count(),
            'current_tier' => $this->calculateTier($totalPoints),
            'badges' => $this->calculateBadges($categoryCounts),
        ];
    }
}
