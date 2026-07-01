<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeAchievement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MyAchievementController extends Controller
{
    public function index(Request $request)
    {
        $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');

        $query = EmployeeAchievement::with('achievementType')
            ->where('user_id', Auth::id())
            ->where('academic_year_id', $activeYearId);

        if ($request->filled('achievement_type_id')) {
            $query->where('achievement_type_id', $request->achievement_type_id);
        }
        if ($request->filled('start_date')) {
            $query->whereDate('achievement_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('achievement_date', '<=', $request->end_date);
        }
        if ($request->filled('status')) {
            if ($request->status === 'signed') {
                $query->whereNotNull('employee_signature');
            } elseif ($request->status === 'unsigned') {
                $query->whereNull('employee_signature');
            }
        }

        $achievements = $query->latest('achievement_date')->paginate(15)->through(function ($achievement) {
            return [
                'id' => $achievement->id,
                'achievement_date' => $achievement->achievement_date->format('Y-m-d'),
                'achievement_type' => $achievement->achievementType,
                'points' => $achievement->points,
                'details' => $achievement->details,
                'employee_signature' => $achievement->employee_signature,
                'admin_signature' => $achievement->admin_signature,
                'employee_signature_url' => $achievement->employee_signature_url,
                'admin_signature_url' => $achievement->admin_signature_url,
                'attachment_url' => $achievement->attachment_url,
                'attachment_path' => $achievement->attachment_path,
            ];
        });

        $types = \App\Models\AchievementType::where('is_active', true)->get(['id', 'name']);

        $totalPoints = EmployeeAchievement::where('user_id', Auth::id())
            ->where('academic_year_id', $activeYearId)
            ->sum('points');

        $badges = EmployeeAchievement::where('user_id', Auth::id())
            ->where('academic_year_id', $activeYearId)
            ->join('achievement_types', 'employee_achievements.achievement_type_id', '=', 'achievement_types.id')
            ->select('achievement_types.badge_icon', 'achievement_types.badge_color', 'achievement_types.name')
            ->whereNotNull('achievement_types.badge_icon')
            ->distinct()
            ->get();

        return Inertia::render('HR/MyAchievements/Index', [
            'achievements' => $achievements,
            'types' => $types,
            'filters' => $request->only(['achievement_type_id', 'start_date', 'end_date', 'status']),
            'totalPoints' => $totalPoints,
            'badges' => $badges,
        ]);
    }

    public function sign(Request $request, EmployeeAchievement $achievement)
    {
        if ($achievement->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'employee_signature' => 'required|string',
        ]);

        if (Str::startsWith($request->employee_signature, 'data:image')) {
            $achievement->employee_signature = $this->saveBase64Signature($request->employee_signature, 'employee');
            $achievement->save();
        }

        return back()->with('success', 'تم استلام الإنجاز بنجاح.');
    }

    private function saveBase64Signature($base64String, $prefix)
    {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            return null;
        }
        $base64String = substr($base64String, strpos($base64String, ',') + 1);
        $type = strtolower($type[1]);
        $base64String = base64_decode($base64String);
        $fileName = 'achievements/signatures/' . $prefix . '_' . uniqid() . '.' . $type;
        Storage::disk('public')->put($fileName, $base64String);
        return $fileName;
    }
}
