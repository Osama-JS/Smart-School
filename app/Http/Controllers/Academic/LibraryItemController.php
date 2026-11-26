<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\LibraryItem;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LibraryItemController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSystemAdmin = $user->role && $user->role->name === 'مدير النظام';
        $branchId = $user->branch_id ?? null;
        $isTeacher = $user->role && $user->role->name === 'معلم';
        $isStudent = $user->role && $user->role->name === 'طالب';

        $studentGradeId = null;
        if ($isStudent && $user->student) {
            $enrollment = $user->student->currentEnrollment()->with('division')->first();
            if ($enrollment && $enrollment->division) {
                $studentGradeId = $enrollment->division->grade_id;
            }
        }

        $applyFilters = function ($query) use ($request, $user, $studentGradeId) {
            return $query
                ->when($request->filled('search'), function ($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%');
                })
                ->when(!$studentGradeId && $request->filled('grade_id') && $request->grade_id !== 'all', function ($q) use ($request) {
                    $q->where('grade_id', $request->grade_id);
                })
                ->when($request->filled('subject_id') && $request->subject_id !== 'all', function ($q) use ($request) {
                    $q->where('subject_id', $request->subject_id);
                })
                ->when($request->filled('item_type') && $request->item_type !== 'all', function ($q) use ($request) {
                    $q->where('item_type', $request->item_type);
                })
                ->when($request->filled('category') && $request->category !== 'all', function ($q) use ($request) {
                    $q->where('category', $request->category);
                })
                ->when($request->filled('target_audience') && $request->target_audience !== 'all', function ($q) use ($request) {
                    $audience = $request->target_audience;
                    $q->where(function ($aq) use ($audience) {
                        $aq->where('target_audience', 'all')
                           ->orWhere('target_audience', 'like', '%' . $audience . '%');
                    });
                })
                ->when($request->boolean('bookmarked'), function ($q) use ($user) {
                    $q->whereHas('bookmarks', fn($bq) => $bq->where('users.id', $user->id));
                });
        };

        $itemsQuery = LibraryItem::with(['grade', 'subject', 'uploader', 'ratings', 'bookmarks']);

        if ($studentGradeId) {
            $itemsQuery->where('grade_id', $studentGradeId)
                ->where(function ($q) {
                    $q->where('target_audience', 'all')
                      ->orWhere('target_audience', 'like', '%students%')
                      ->orWhereNull('target_audience');
                });
        } elseif (!$isSystemAdmin) {
            $itemsQuery->whereHas('uploader', function ($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }

        $items = $applyFilters($itemsQuery)
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $gradesQuery = Grade::query();
        if ($branchId) {
            $gradesQuery->where('branch_id', $branchId);
        }

        $subjectsQuery = Subject::query();
        if ($branchId) {
            $subjectsQuery->where('branch_id', $branchId);
        }

        if ($studentGradeId) {
            $gradesQuery->where('id', $studentGradeId);
        }

        if ($isTeacher) {
            $divisionTeacherIds = \App\Models\DivisionSubjectTeacher::where('teacher_id', $user->id)->pluck('division_id')->toArray();
            $timetableDivisionIds = \App\Models\MasterTimetable::where('teacher_id', $user->id)->pluck('division_id')->toArray();
            $allDivisionIds = array_unique(array_merge($divisionTeacherIds, $timetableDivisionIds));

            $divisionsAssigned = \App\Models\Division::whereIn('id', $allDivisionIds)->get();
            $teacherGradeIds = $divisionsAssigned->pluck('grade_id')->unique()->filter()->toArray();

            if (!empty($teacherGradeIds)) {
                $gradesQuery->whereIn('id', $teacherGradeIds);
            }
            
            $teacherSubjectIds1 = \App\Models\DivisionSubjectTeacher::where('teacher_id', $user->id)->pluck('subject_id')->toArray();
            $teacherSubjectIds2 = \App\Models\MasterTimetable::where('teacher_id', $user->id)->pluck('subject_id')->toArray();
            $allSubjectIds = array_unique(array_merge($teacherSubjectIds1, $teacherSubjectIds2));

            if (!empty($allSubjectIds)) {
                $subjectsQuery->whereIn('id', $allSubjectIds);
            }
        }

        $grades = $gradesQuery->get();
        $subjects = $subjectsQuery->get();

        return Inertia::render('Academic/Library/Digital/Index', [
            'items' => $items,
            'grades' => $grades,
            'subjects' => $subjects,
            'filters' => $request->only(['grade_id', 'subject_id', 'item_type', 'category', 'target_audience', 'search', 'bookmarked']),
        ]);
    }

    private function normalizeTargetAudience($raw): string
    {
        $allowed = ['all', 'students', 'teachers', 'parents'];
        $items = is_array($raw) ? $raw : explode(',', (string) $raw);
        $values = array_values(array_unique(array_filter(
            array_map(fn($v) => trim((string) $v), $items),
            fn($v) => in_array($v, $allowed, true)
        )));

        if (in_array('all', $values, true) || count(array_intersect(['students', 'teachers', 'parents'], $values)) === 3) {
            return 'all';
        }

        return !empty($values) ? implode(',', $values) : 'students';
    }

    public function store(Request $request)
    {
        if (auth()->user()->role && auth()->user()->role->name === 'طالب') abort(403);

        $request->validate([
            'title' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'subject_id' => 'required|exists:subjects,id',
            'file' => 'required_without:external_url|nullable|file|max:204800', // 200MB max
            'external_url' => 'required_without:file|nullable|url|max:1000',
            'item_type' => 'required|string',
            'category' => 'nullable|string',
            'target_audience' => 'required',
            'thumbnail' => 'nullable|image|max:10240', // 10MB max
        ]);

        $path = null;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('library_items', 'public');
        }
        
        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('library_thumbnails', 'public');
        }

        LibraryItem::create([
            'title' => $request->title,
            'grade_id' => $request->grade_id,
            'subject_id' => $request->subject_id,
            'item_type' => $request->item_type,
            'category' => $request->category,
            'target_audience' => $this->normalizeTargetAudience($request->input('target_audience')),
            'uploader_id' => auth()->id(),
            'file_path' => $path,
            'external_url' => $request->external_url,
            'thumbnail_path' => $thumbnailPath,
        ]);

        return redirect()->back()->with('success', 'تم إضافة المورد التعليمي بنجاح.');
    }

    public function update(Request $request, LibraryItem $libraryItem)
    {
        $user = auth()->user();
        if ($user->role && $user->role->name === 'طالب') {
            abort(403);
        }
        if ($user->role && $user->role->name === 'معلم' && $libraryItem->uploader_id !== $user->id) {
            abort(403, 'لا يمكنك تعديل مورد لم تقم برفعه.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'subject_id' => 'required|exists:subjects,id',
            'file' => 'nullable|file|max:204800', // 200MB max
            'external_url' => 'nullable|url|max:1000',
            'item_type' => 'required|string',
            'category' => 'nullable|string',
            'target_audience' => 'required',
            'thumbnail' => 'nullable|image|max:10240', // 10MB max
        ]);

        $data = $request->only(['title', 'grade_id', 'subject_id', 'item_type', 'category', 'external_url']);
        $data['target_audience'] = $this->normalizeTargetAudience($request->input('target_audience'));

        if ($request->hasFile('file')) {
            if ($libraryItem->file_path && Storage::disk('public')->exists($libraryItem->file_path)) {
                Storage::disk('public')->delete($libraryItem->file_path);
            }
            $data['file_path'] = $request->file('file')->store('library_items', 'public');
            $data['external_url'] = null; // Clear external url if a new file is uploaded
        }

        if ($request->hasFile('thumbnail')) {
            if ($libraryItem->thumbnail_path && Storage::disk('public')->exists($libraryItem->thumbnail_path)) {
                Storage::disk('public')->delete($libraryItem->thumbnail_path);
            }
            $data['thumbnail_path'] = $request->file('thumbnail')->store('library_thumbnails', 'public');
        }

        $libraryItem->update($data);

        return redirect()->back()->with('success', 'تم تعديل المورد التعليمي بنجاح.');
    }

    public function destroy(LibraryItem $libraryItem)
    {
        $user = auth()->user();
        if ($user->role && ($user->role->name === 'طالب' || ($user->role->name === 'معلم' && $libraryItem->uploader_id !== $user->id))) {
            abort(403, 'غير مصرح لك بحذف الموارد من المكتبة الرقمية. الرجاء الرجوع للإدارة.');
        }

        if ($libraryItem->file_path && Storage::disk('public')->exists($libraryItem->file_path)) {
            Storage::disk('public')->delete($libraryItem->file_path);
        }
        if ($libraryItem->thumbnail_path && Storage::disk('public')->exists($libraryItem->thumbnail_path)) {
            Storage::disk('public')->delete($libraryItem->thumbnail_path);
        }

        $libraryItem->delete();

        return redirect()->back()->with('success', 'تم حذف المورد التعليمي بنجاح.');
    }

    public function incrementViews(LibraryItem $libraryItem)
    {
        $libraryItem->increment('views_count');
        return response()->json(['success' => true]);
    }

    public function incrementDownloads(LibraryItem $libraryItem)
    {
        $libraryItem->increment('downloads_count');
        return response()->json(['success' => true]);
    }

    public function toggleBookmark(LibraryItem $libraryItem)
    {
        $user = auth()->user();
        if ($user->bookmarkedLibraryItems()->where('library_item_id', $libraryItem->id)->exists()) {
            $user->bookmarkedLibraryItems()->detach($libraryItem->id);
            $isBookmarked = false;
        } else {
            $user->bookmarkedLibraryItems()->attach($libraryItem->id);
            $isBookmarked = true;
        }

        return redirect()->back();
    }

    public function submitRating(Request $request, LibraryItem $libraryItem)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5'
        ]);

        $user = auth()->user();
        $user->libraryRatings()->syncWithoutDetaching([
            $libraryItem->id => ['rating' => $request->rating]
        ]);

        return redirect()->back();
    }
}
