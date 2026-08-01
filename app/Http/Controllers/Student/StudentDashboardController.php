<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MasterTimetable;
use App\Models\ClassAttendance;
use App\Models\StudentAchievement;
use App\Models\News;
use App\Models\Enrollment;
use App\Models\ExamScheduleItem;
use App\Models\LibraryItem;
use App\Models\StudentViolation;
use App\Traits\ResolvesStudent;

class StudentDashboardController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        $user = auth()->user();

        // ── Parent Overview Logic ──
        if ($user->role?->name === 'ولي أمر' && !$request->has('child_id')) {
            $children = $user->children()->with(['user', 'currentEnrollment.division.grade'])->get();
            
            $overviewData = $children->map(function($child) {
                $absences = ClassAttendance::where('student_id', $child->id)
                    ->whereIn('status', ['absent', 'unexcused'])
                    ->count();
                    
                $violations = StudentViolation::where('student_id', $child->id)->count();
                $achievements = StudentAchievement::where('student_id', $child->id)->sum('points');
                
                return [
                    'id' => $child->id,
                    'stats' => [
                        'absences' => $absences,
                        'violations' => $violations,
                        'points' => $achievements
                    ]
                ];
            });

            // Unified Timeline
            $childIds = $children->pluck('id');
            $recentViolations = StudentViolation::with('violationType', 'student.user')
                ->whereIn('student_id', $childIds)->latest()->take(5)->get()
                ->map(fn($v) => [
                    'id' => 'v_'.$v->id,
                    'type' => 'violation',
                    'title' => $v->violationType ? $v->violationType->name : 'مخالفة غير محددة',
                    'student_name' => optional(optional($v->student)->user)->name ?? 'غير معروف',
                    'student_id' => $v->student_id,
                    'date' => $v->created_at->format('Y-m-d H:i'),
                    'icon' => 'AlertTriangle',
                    'color' => 'text-rose-500',
                    'bg' => 'bg-rose-100 dark:bg-rose-900/30'
                ]);

            $recentAchievements = StudentAchievement::with('type', 'student.user')
                ->whereIn('student_id', $childIds)->latest()->take(5)->get()
                ->map(fn($a) => [
                    'id' => 'a_'.$a->id,
                    'type' => 'achievement',
                    'title' => $a->type ? $a->type->name : 'إنجاز غير محدد',
                    'student_name' => optional(optional($a->student)->user)->name ?? 'غير معروف',
                    'student_id' => $a->student_id,
                    'date' => $a->created_at->format('Y-m-d H:i'),
                    'icon' => 'Trophy',
                    'color' => 'text-amber-500',
                    'bg' => 'bg-amber-100 dark:bg-amber-900/30'
                ]);

            $timeline = $recentViolations->concat($recentAchievements)
                ->sortByDesc('date')
                ->take(10)
                ->values();

            return Inertia::render('Dashboards/ParentOverview', [
                'children' => $children,
                'overviewData' => $overviewData,
                'timeline' => $timeline
            ]);
        }
        // ── End Parent Overview Logic ──

        [$student, $children] = $this->resolveStudent($request);
        
        if (!$student) {
            return Inertia::render('Dashboards/StudentDashboard', [
                'latestNews' => News::where('is_published', true)->latest()->take(5)->get(),
                'children' => $children,
                'activeChildId' => null,
            ]);
        }
        $currentEnrollment = $student->currentEnrollment()->with('division.grade.section')->first();
        
        // Get today's classes
        $todayTimetable = collect();
        if ($currentEnrollment && $currentEnrollment->division_id) {
            $todayTimetable = MasterTimetable::with(['period', 'subject', 'teacher'])
                ->where('division_id', $currentEnrollment->division_id)
                ->today()
                ->get()
                ->sortBy(function($t) { return $t->period->start_time ?? ''; })
                ->values();
        }

        // Get attendance summary (e.g. absent days this semester)
        $absentDays = ClassAttendance::where('student_id', $student->id)
            ->whereIn('status', ['absent', 'unexcused'])
            ->count();

        // Gamification
        $achievements = StudentAchievement::with('achievementType')
            ->where('student_id', $student->id)
            ->take(5)
            ->get();
            
        $totalPoints = StudentAchievement::where('student_id', $student->id)->sum('points');

        // Get latest news
        $latestNews = News::where('is_published', true)
            ->where('published_at', '<=', now())
            ->whereHas('author', function($q) use ($user) {
                $q->whereNull('branch_id')
                  ->orWhere('branch_id', $user->branch_id);
            })
            ->latest('published_at')
            ->take(5)
            ->get()
            ->map(function($news) {
                return [
                    'id' => $news->id,
                    'title' => $news->title,
                    'category' => $news->category,
                    'image_url' => $news->image_url,
                    'published_at' => $news->published_at ? $news->published_at->diffForHumans() : '',
                    'excerpt' => \Illuminate\Support\Str::limit(strip_tags($news->content), 80)
                ];
            });

        // Get division IDs
        $divisionIds = [];
        if ($student) {
            $divisionIds = Enrollment::where('student_id', $student->id)->pluck('division_id')->toArray();
        }

        // Upcoming exams
        $upcomingExams = collect();
        if (!empty($divisionIds)) {
            $upcomingExams = ExamScheduleItem::with(['subject', 'schedule'])
                ->whereIn('division_id', $divisionIds)
                ->where('exam_date', '>=', now()->toDateString())
                ->orderBy('exam_date')
                ->take(3)
                ->get();
        }

        // Library items
        $studentGradeId = $currentEnrollment && $currentEnrollment->division ? $currentEnrollment->division->grade_id : null;
        $libraryItems = collect();
        if ($studentGradeId) {
            $libraryItems = LibraryItem::with(['subject', 'uploader'])
                ->where('grade_id', $studentGradeId)
                ->latest()
                ->take(6)
                ->get();
        }

        return Inertia::render('Dashboards/StudentDashboard', [
            'latestNews' => $latestNews,
            'todayTimetable' => $todayTimetable,
            'currentEnrollment' => $currentEnrollment,
            'stats' => [
                'absentDays' => $absentDays,
                'totalPoints' => $totalPoints
            ],
            'achievements' => $achievements,
            'upcomingExams' => $upcomingExams,
            'libraryItems' => $libraryItems,
            'children' => $children,
            'activeChildId' => $student->id,
        ]);
    }
}
