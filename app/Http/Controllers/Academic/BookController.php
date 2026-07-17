<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSystemAdmin = $user->role && $user->role->name === 'مدير النظام';

        $books = Book::when(!$isSystemAdmin, function ($query) use ($user) {
                return $query->where('branch_id', $user->branch_id);
            })
            ->when($request->search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('author', 'like', "%{$search}%")
                      ->orWhere('isbn', 'like', "%{$search}%");
                });
            })
            ->when($request->available_only === 'true', function ($query) {
                return $query->where('available_copies', '>', 0);
            })
            ->when($request->sort_by, function ($query, $sort_by) {
                if ($sort_by === 'newest') return $query->latest();
                if ($sort_by === 'most_copies') return $query->orderByDesc('total_copies');
                if ($sort_by === 'title_asc') return $query->orderBy('title');
                return $query->latest();
            }, function ($query) {
                return $query->latest();
            })
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Academic/Library/Books/Index', [
            'books' => $books,
            'filters' => $request->only(['search', 'available_only', 'sort_by']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'nullable|string|max:255',
            'isbn' => 'nullable|string|max:255|unique:books,isbn',
            'shelf_location' => 'nullable|string|max:255',
            'total_copies' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|image|max:2048',
        ]);

        $validated['available_copies'] = $validated['total_copies'];

        if ($request->hasFile('cover_image')) {
            $validated['cover_image'] = $request->file('cover_image')->store('books/covers', 'public');
        }

        $user = auth()->user();
        if ($user->role && $user->role->name !== 'مدير النظام') {
            $validated['branch_id'] = $user->branch_id;
        }

        Book::create($validated);

        return redirect()->back()->with('success', 'تم إضافة الكتاب بنجاح.');
    }

    public function update(Request $request, Book $book)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'nullable|string|max:255',
            'isbn' => 'nullable|string|max:255|unique:books,isbn,' . $book->id,
            'shelf_location' => 'nullable|string|max:255',
            'total_copies' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|image|max:2048',
        ]);

        $difference = $validated['total_copies'] - $book->total_copies;
        $validated['available_copies'] = $book->available_copies + $difference;

        if ($validated['available_copies'] < 0) {
            return back()->withErrors(['total_copies' => 'عدد النسخ الإجمالي لا يمكن أن يكون أقل من عدد النسخ المستعارة حالياً.']);
        }

        if ($request->hasFile('cover_image')) {
            if ($book->cover_image && Storage::disk('public')->exists($book->cover_image)) {
                Storage::disk('public')->delete($book->cover_image);
            }
            $validated['cover_image'] = $request->file('cover_image')->store('books/covers', 'public');
        }

        $book->update($validated);

        return redirect()->back()->with('success', 'تم تحديث بيانات الكتاب بنجاح.');
    }

    public function destroy(Book $book)
    {
        if ($book->borrowings()->where('status', 'borrowed')->exists()) {
            return back()->withErrors(['error' => 'لا يمكن حذف الكتاب لأنه معار حالياً.']);
        }

        if ($book->cover_image && Storage::disk('public')->exists($book->cover_image)) {
            Storage::disk('public')->delete($book->cover_image);
        }

        $book->delete();

        return redirect()->back()->with('success', 'تم حذف الكتاب بنجاح.');
    }
}
