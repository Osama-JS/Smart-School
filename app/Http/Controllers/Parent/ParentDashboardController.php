<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ClassAttendance;
use App\Models\StudentViolation;
use App\Models\ExamScheduleItem;
use App\Models\MasterTimetable;
use App\Models\News;
use App\Traits\ResolvesStudent;

class ParentDashboardController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        $user = auth()->user();

        $latestNews = News::with('attachments')
            ->where('is_published', true)
            ->where('published_at', '<=', now())
            ->whereHas('author', function ($q) use ($user) {
                $q->whereNull('branch_id')
                  ->orWhere('branch_id', $user->branch_id);
            })
            ->latest('published_at')
            ->take(5)
            ->get()
            ->map(function ($news) {
                return [
                    'id' => $news->id,
                    'title' => $news->title,
                    'category' => $news->category,
                    'image_url' => $news->image_url,
                    'published_at' => $news->published_at ? $news->published_at->diffForHumans() : '',
                    'excerpt' => \Illuminate\Support\Str::limit(strip_tags($news->content), 80),
                ];
            });

        // 1. Fetch children of this parent
        $children = $user->children()->with(['currentEnrollment.division.grade.section', 'user'])->get();

        if ($children->isEmpty()) {
            return Inertia::render('Dashboards/ParentDashboard', [
                'children' => [],
                'activeChild' => null,
                'stats' => [],
                'todayTimetable' => [],
                'upcomingExams' => [],
                'recentHomeworks' => [],
                'recentGrades' => [],
                'pendingPledgesCount' => 0,
                'latestNews' => $latestNews,
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
            'achievements.type',
            'medicalRecord',
            'currentEnrollment.division.grade.section',
        ]);

        // 2. Fetch Dashboard Widgets Data for Active Child
        $todayTimetable = collect();
        $upcomingExams = collect();
        $currentEnrollment = $activeChild->currentEnrollment;
        $portalMetrics = $this->buildStudentPortalMetrics($activeChild, $currentEnrollment, true);

        $stats = [
            'totalPoints' => (int) $activeChild->achievements->sum('points'),
            'absentDays' => $portalMetrics['absentDays'],
            'attendanceRate' => $portalMetrics['attendanceRate'],
            'violationsCount' => StudentViolation::where('student_id', $activeChild->id)->count(),
        ];

        if ($currentEnrollment && $currentEnrollment->division_id) {
            $divisionId = $currentEnrollment->division_id;

            $todayTimetable = MasterTimetable::with(['subject', 'teacher', 'period'])
                ->where('division_id', $divisionId)
                ->today()
                ->get()
                ->sortBy(fn($t) => $t->period->start_time ?? '')
                ->values();

            // Upcoming Exams
            $upcomingExams = ExamScheduleItem::with(['subject', 'schedule'])
                ->where('division_id', $divisionId)
                ->where('exam_date', '>=', now()->toDateString())
                ->orderBy('exam_date', 'asc')
                ->take(3)
                ->get();
        }

        return Inertia::render('Dashboards/ParentDashboard', [
            'children' => $children,
            'activeChild' => $activeChild,
            'todayTimetable' => $todayTimetable,
            'upcomingExams' => $upcomingExams,
            'stats' => $stats,
            'recentHomeworks' => $portalMetrics['recentHomeworks'],
            'recentGrades' => $portalMetrics['recentGrades'],
            'pendingPledgesCount' => $portalMetrics['pendingPledgesCount'],
            'latestNews' => $latestNews,
        ]);
    }
}
