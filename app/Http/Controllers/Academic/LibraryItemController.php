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

        $items = LibraryItem::with(['grade', 'subject', 'uploader'])
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

        $grades = Grade::all();
        $subjects = Subject::all();

        return Inertia::render('Academic/Library/Digital/Index', [
            'items' => $items,
            'grades' => $grades,
            'subjects' => $subjects,
            'filters' => $request->only(['grade_id', 'subject_id']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'subject_id' => 'required|exists:subjects,id',
            'file' => 'required|file|max:20480', // 20MB max
        ]);

        $path = $request->file('file')->store('library_items', 'public');

        LibraryItem::create([
            'title' => $request->title,
            'grade_id' => $request->grade_id,
            'subject_id' => $request->subject_id,
            'uploader_id' => auth()->id(),
            'file_path' => $path,
        ]);

        return redirect()->back()->with('success', 'تم إضافة المورد التعليمي بنجاح.');
    }

    public function destroy(LibraryItem $libraryItem)
    {
        if (Storage::disk('public')->exists($libraryItem->file_path)) {
            Storage::disk('public')->delete($libraryItem->file_path);
        }

        $libraryItem->delete();

        return redirect()->back()->with('success', 'تم الحذف بنجاح.');
    }
}
