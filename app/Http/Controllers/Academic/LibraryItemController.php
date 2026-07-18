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

        $items = LibraryItem::with(['grade', 'subject', 'uploader', 'ratings', 'bookmarks'])
            ->when(!$isSystemAdmin, function ($query) use ($user) {
                return $query->whereHas('uploader', function($q) use ($user) {
                    $q->where('branch_id', $user->branch_id);
                });
            })
            ->when($request->grade_id, function ($query, $grade_id) {
                return $query->where('grade_id', $grade_id);
            })
            ->when($request->subject_id, function ($query, $subject_id) {
                return $query->where('subject_id', $subject_id);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $branchId = $user->branch_id ?? null;
        $isTeacher = $user->role && $user->role->name === 'معلم';

        $gradesQuery = Grade::query();
        if ($branchId) {
            $gradesQuery->where('branch_id', $branchId);
        }

        $subjectsQuery = Subject::query();
        if ($branchId) {
            $subjectsQuery->where('branch_id', $branchId);
        }

        if ($isTeacher) {
            $divisionTeacherIds = \App\Models\DivisionSubjectTeacher::where('teacher_id', $user->id)->pluck('division_id')->toArray();
            $timetableDivisionIds = \App\Models\MasterTimetable::where('teacher_id', $user->id)->pluck('division_id')->toArray();
            $allDivisionIds = array_unique(array_merge($divisionTeacherIds, $timetableDivisionIds));

            $divisionsAssigned = \App\Models\Division::whereIn('id', $allDivisionIds)->get();
            $teacherGradeIds = $divisionsAssigned->pluck('grade_id')->unique()->filter()->toArray();

            if (empty($teacherGradeIds)) {
                $gradesQuery->whereRaw('1 = 0');
            } else {
                $gradesQuery->whereIn('id', $teacherGradeIds);
            }
            
            $teacherSubjectIds1 = \App\Models\DivisionSubjectTeacher::where('teacher_id', $user->id)->pluck('subject_id')->toArray();
            $teacherSubjectIds2 = \App\Models\MasterTimetable::where('teacher_id', $user->id)->pluck('subject_id')->toArray();
            $allSubjectIds = array_unique(array_merge($teacherSubjectIds1, $teacherSubjectIds2));

            if (empty($allSubjectIds)) {
                $subjectsQuery->whereRaw('1 = 0');
            } else {
                $subjectsQuery->whereIn('id', $allSubjectIds);
            }
        }

        $grades = $gradesQuery->get();
        $subjects = $subjectsQuery->get();

        return Inertia::render('Academic/Library/Digital/Index', [
            'items' => $items,
            'grades' => $grades,
            'subjects' => $subjects,
            'filters' => $request->only(['grade_id', 'subject_id', 'item_type', 'category', 'target_audience', 'search']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'subject_id' => 'required|exists:subjects,id',
            'file' => 'required_without:external_url|nullable|file|max:20480', // 20MB max
            'external_url' => 'required_without:file|nullable|url|max:1000',
            'item_type' => 'required|string',
            'category' => 'nullable|string',
            'target_audience' => 'required|string',
            'thumbnail' => 'nullable|image|max:5120', // 5MB max
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
            'target_audience' => $request->target_audience,
            'uploader_id' => auth()->id(),
            'file_path' => $path,
            'external_url' => $request->external_url,
            'thumbnail_path' => $thumbnailPath,
        ]);

        return redirect()->back()->with('success', 'تم إضافة المورد التعليمي بنجاح.');
    }

    public function update(Request $request, LibraryItem $libraryItem)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'subject_id' => 'required|exists:subjects,id',
            'file' => 'nullable|file|max:20480', // 20MB max
            'external_url' => 'nullable|url|max:1000',
            'item_type' => 'required|string',
            'category' => 'nullable|string',
            'target_audience' => 'required|string',
            'thumbnail' => 'nullable|image|max:5120', // 5MB max
        ]);

        $data = $request->only(['title', 'grade_id', 'subject_id', 'item_type', 'category', 'target_audience', 'external_url']);

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
        if ($user->role && $user->role->name === 'معلم') {
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
