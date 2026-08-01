<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ClassAttendance;
use App\Models\StudentViolation;
use App\Models\ExamScheduleItem;
use App\Models\Timetable;
use App\Models\News;

class ParentDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // 1. Fetch children of this parent
        $children = $user->children()->with(['currentEnrollment.division.grade.section', 'user'])->get();

        if ($children->isEmpty()) {
            return Inertia::render('Dashboards/ParentDashboard', [
                'children' => [],
                'activeChild' => null,
                'stats' => [],
                'todayTimetable' => [],
                'upcomingExams' => [],
                'latestNews' => News::latest()->take(3)->get() ?? [],
            ]);
        }

        // If a specific child is selected, otherwise default to first child
        $selectedChildId = $request->query('child_id');
        $activeChild = null;

        if ($selectedChildId) {
            $activeChild = $children->firstWhere('id', $selectedChildId);
        }
        
        if (!$activeChild) {
            $activeChild = $children->first();
        }

        // Load additional data for the active child
        $activeChild->load([
            'achievements.achievementType',
            'medicalRecord'
        ]);

        // 2. Fetch Dashboard Widgets Data for Active Child
        $todayTimetable = [];
        $upcomingExams = [];
        $stats = [
            'totalPoints' => 0,
            'absentDays' => 0,
            'violationsCount' => 0
        ];

        if ($activeChild && $activeChild->currentEnrollment) {
            $divisionId = $activeChild->currentEnrollment->division_id;
            
            // Timetable for today
            $today = strtolower(now()->englishDayOfWeek); // e.g., 'monday'
            
            $todayTimetable = Timetable::with(['subject', 'teacher', 'period'])
                ->where('division_id', $divisionId)
                ->where('day_of_week', $today)
                ->orderBy('period_id')
                ->get();

            // Upcoming Exams
            $upcomingExams = ExamScheduleItem::with(['subject', 'schedule'])
                ->whereHas('schedule', function ($q) use ($activeChild) {
                    $q->where('grade_id', $activeChild->currentEnrollment->grade_id);
                })
                ->where('exam_date', '>=', now()->toDateString())
                ->orderBy('exam_date', 'asc')
                ->take(3)
                ->get();

            // Stats
            $stats['totalPoints'] = $activeChild->achievements->sum('points');
            
            // Calculate unique days absent
            $absentClasses = ClassAttendance::where('student_id', $activeChild->id)
                                    ->whereIn('status', ['absent', 'unexcused'])
                                    ->get();
            $stats['absentDays'] = $absentClasses->pluck('date')->map(fn($d) => $d->format('Y-m-d'))->unique()->count();
            
            $stats['violationsCount'] = StudentViolation::where('student_id', $activeChild->id)->count();
        }

        return Inertia::render('Dashboards/ParentDashboard', [
            'children' => $children,
            'activeChild' => $activeChild,
            'todayTimetable' => $todayTimetable,
            'upcomingExams' => $upcomingExams,
            'stats' => $stats,
            'latestNews' => News::latest()->take(3)->get() ?? [],
        ]);
    }
}
