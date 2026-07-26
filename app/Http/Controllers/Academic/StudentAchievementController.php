<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudentAchievement;
use App\Models\Grade;
use App\Models\Student;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Services\GamificationService;

class StudentAchievementController extends Controller
{
    protected $gamificationService;

    public function __construct(GamificationService $gamificationService)
    {
        $this->gamificationService = $gamificationService;
    }

    public function index(Request $request)
    {
        abort_if(!auth()->user()->hasPermission('عرض إنجازات الطلاب'), 403, 'غير مصرح لك.');

        $activeYear = AcademicYear::where('is_active', true)->firstOrFail();
        $branchId = auth()->user()->branch_id;

        $achievements = StudentAchievement::with(['student.user', 'awardedBy', 'type'])
            ->where('academic_year_id', $activeYear->id)
            ->where('branch_id', $branchId)
            ->orderByDesc('date_awarded')
            ->get();

        $students = Student::with('user')
            ->whereHas('user', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            })
            ->whereHas('enrollments', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            })
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->user->name,
                ];
            });

        $grades = Grade::with(['divisions' => function ($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        }])->where('branch_id', $branchId)->get();

        $achievementTypes = \App\Models\StudentAchievementType::where('branch_id', $branchId)
            ->where('is_active', true)
            ->get();

        // Calculate Leaderboard (Top 3 students by points this year)
        $leaderboard = StudentAchievement::with(['student.user', 'type'])
            ->where('academic_year_id', $activeYear->id)
            ->where('branch_id', $branchId)
            ->where('status', 'approved')
            ->get()
            ->groupBy('student_id')
            ->map(function ($studentAchievements, $studentId) {
                $totalPoints = $studentAchievements->sum('points');
                
                // Group by category to calculate badges
                $categoryCounts = [];
                foreach ($studentAchievements as $ach) {
                    $category = $ach->type->category ?? 'أخرى';
                    if (!isset($categoryCounts[$category])) $categoryCounts[$category] = 0;
                    $categoryCounts[$category]++;
                }

                $student = $studentAchievements->first()->student;
                return [
                    'student_id' => $studentId,
                    'student_name' => $student->user->name ?? 'غير معروف',
                    'total_points' => $totalPoints,
                    'achievements_count' => $studentAchievements->count(),
                    'tier' => $this->gamificationService->calculateTier($totalPoints),
                    'badges' => $this->gamificationService->calculateBadges($categoryCounts),
                ];
            })
            ->sortByDesc('total_points')
            ->take(3)
            ->values();

        return Inertia::render('Academic/StudentAchievements/Index', [
            'achievements' => $achievements,
            'students' => $students,
            'grades' => $grades,
            'leaderboard' => $leaderboard,
            'achievementTypes' => $achievementTypes,
            'activeYearId' => $activeYear->id,
        ]);
    }

    public function store(Request $request)
    {
        abort_if(!auth()->user()->hasPermission('إضافة إنجاز لطالب'), 403, 'غير مصرح لك.');

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'student_achievement_type_id' => 'required|exists:student_achievement_types,id',
            'description' => 'nullable|string',
            'points' => 'required|integer|min:0',
            'date_awarded' => 'required|date',
        ]);

        $activeYear = AcademicYear::where('is_active', true)->firstOrFail();

        $gamificationService = app(\App\Services\GamificationService::class);
        $beforeData = $gamificationService->getStudentGamificationData($validated['student_id'], auth()->user()->branch_id);
        $beforeTierName = $beforeData['current_tier'] ? $beforeData['current_tier']['name'] : null;

        StudentAchievement::create([
            'student_id' => $validated['student_id'],
            'academic_year_id' => $activeYear->id,
            'branch_id' => auth()->user()->branch_id,
            'student_achievement_type_id' => $validated['student_achievement_type_id'],
            'description' => $validated['description'],
            'points' => $validated['points'],
            'date_awarded' => $validated['date_awarded'],
            'awarded_by' => auth()->id(),
            'status' => 'approved', // Auto approved for now
        ]);

        $afterData = $gamificationService->getStudentGamificationData($validated['student_id'], auth()->user()->branch_id);
        $afterTier = $afterData['current_tier'];
        
        if ($afterTier && $beforeTierName !== $afterTier['name']) {
            $student = \App\Models\Student::with('user')->find($validated['student_id']);
            if ($student && $student->user) {
                $student->user->notify(new \App\Notifications\StudentTierUpgradedNotification($student, $afterTier['name']));
            }
        }

        return redirect()->back()->with('success', 'تم تسجيل الإنجاز بنجاح وإضافة النقاط للطالب.');
    }

    public function update(Request $request, StudentAchievement $achievement)
    {
        abort_if(!auth()->user()->hasPermission('تعديل إنجاز طالب'), 403, 'غير مصرح لك.');

        $validated = $request->validate([
            'student_achievement_type_id' => 'required|exists:student_achievement_types,id',
            'description' => 'nullable|string',
            'points' => 'required|integer|min:0',
            'date_awarded' => 'required|date',
        ]);

        $achievement->update($validated);

        return redirect()->back()->with('success', 'تم تعديل الإنجاز بنجاح.');
    }

    public function destroy(StudentAchievement $achievement)
    {
        abort_if(!auth()->user()->hasPermission('حذف إنجاز طالب'), 403, 'غير مصرح لك.');

        $achievement->delete();

        return redirect()->back()->with('success', 'تم حذف الإنجاز بنجاح.');
    }

    public function certificate($student_id)
    {
        abort_if(!auth()->user()->hasPermission('إدارة إنجازات الطلاب'), 403, 'غير مصرح لك.');

        $student = \App\Models\Student::with(['user', 'currentEnrollment.division.grade'])->findOrFail($student_id);
        
        $gamificationService = app(\App\Services\GamificationService::class);
        $gamificationData = $gamificationService->getStudentGamificationData($student_id, auth()->user()->branch_id);

        return Inertia::render('Academic/StudentAchievements/Certificate', [
            'student' => $student,
            'gamification' => $gamificationData,
            'schoolName' => config('app.name', 'Smart School'),
        ]);
    }
}
