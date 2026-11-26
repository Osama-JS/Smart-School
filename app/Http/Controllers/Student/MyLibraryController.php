<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LibraryItem;
use App\Models\Subject;

use App\Traits\ResolvesStudent;

class MyLibraryController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        $user = auth()->user();
        [$student, $children] = $this->resolveStudent($request);
        
        if (!$student) {
            return Inertia::render('Student/Library/Index', [
                'items' => collect(),
                'subjects' => [],
                'stats' => ['total' => 0, 'bookmarked' => 0],
                'children' => $children,
                'activeChildId' => null,
            ]);
        }
        $enrollment = $student->currentEnrollment()->with('division')->first();
        $studentGradeId = $enrollment && $enrollment->division ? $enrollment->division->grade_id : null;

        if (!$studentGradeId) {
            return Inertia::render('Student/Library/Index', [
                'items' => collect(),
                'subjects' => [],
                'stats' => ['total' => 0, 'bookmarked' => 0],
                'children' => $children,
                'activeChildId' => $student->id,
            ]);
        }

        $audienceFilter = function ($q) {
            $q->where('target_audience', 'all')
              ->orWhere('target_audience', 'like', '%students%')
              ->orWhere('target_audience', 'like', '%parents%')
              ->orWhereNull('target_audience');
        };

        $query = LibraryItem::with(['subject', 'uploader', 'bookmarks'])
            ->where('grade_id', $studentGradeId)
            ->where($audienceFilter);

        if ($request->filled('subject_id') && $request->subject_id !== 'all') {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }
        
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('item_type', $request->type);
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->boolean('bookmarked')) {
            $query->whereHas('bookmarks', fn($q) => $q->where('users.id', $user->id));
        }

        $items = $query->latest()->paginate(12)->withQueryString();

        // Subjects for filter (only subjects that have materials in this grade)
        $subjectIds = LibraryItem::where('grade_id', $studentGradeId)
            ->where($audienceFilter)
            ->pluck('subject_id')
            ->unique();
        $subjects = Subject::whereIn('id', $subjectIds)->get();

        $stats = [
            'total' => LibraryItem::where('grade_id', $studentGradeId)->where($audienceFilter)->count(),
            'bookmarked' => $user->bookmarkedLibraryItems()->where('grade_id', $studentGradeId)->where($audienceFilter)->count(),
        ];

        return Inertia::render('Student/Library/Index', [
            'items' => $items,
            'subjects' => $subjects,
            'stats' => $stats,
            'filters' => $request->only(['subject_id', 'search', 'type', 'category', 'bookmarked']),
            'children' => $children,
            'activeChildId' => $student->id,
        ]);
    }
}
