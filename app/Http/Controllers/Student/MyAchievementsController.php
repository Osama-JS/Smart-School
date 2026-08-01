<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\StudentAchievement;
use Illuminate\Support\Carbon;

use App\Traits\ResolvesStudent;

class MyAchievementsController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        [$student, $children] = $this->resolveStudent($request);
        
        if (!$student) {
            return Inertia::render('Student/Achievements/Index', [
                'achievements' => [],
                'groupedAchievements' => [],
                'stats' => [],
                'children' => $children,
                'activeChildId' => null,
            ]);
        }

        $achievements = StudentAchievement::with(['type', 'awardedBy'])
            ->where('student_id', $student->id)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($achievement) {
                return [
                    'id' => $achievement->id,
                    'title' => $achievement->type ? $achievement->type->name : 'إنجاز',
                    'category' => $achievement->type ? $achievement->type->category : 'عام',
                    'points' => $achievement->points,
                    'date' => Carbon::parse($achievement->created_at)->format('Y-m-d'),
                    'awarded_by' => $achievement->awardedBy ? $achievement->awardedBy->name : 'النظام',
                    'description' => $achievement->description,
                ];
            });

        // Group achievements by category
        $groupedAchievements = $achievements->groupBy('category');

        return Inertia::render('Student/Achievements/Index', [
            'achievements' => $achievements,
            'groupedAchievements' => $groupedAchievements,
            'stats' => [
                'totalPoints' => $achievements->sum('points'),
                'totalCount' => $achievements->count(),
            ],
            'children' => $children,
            'activeChildId' => $student->id,
        ]);
    }
}
