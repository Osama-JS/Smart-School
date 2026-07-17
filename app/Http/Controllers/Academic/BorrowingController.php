<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Borrowing;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class BorrowingController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSystemAdmin = $user->role && $user->role->name === 'مدير النظام';

        $borrowings = Borrowing::with(['book', 'student'])
            ->when(!$isSystemAdmin, function ($query) use ($user) {
                return $query->whereHas('book', function($q) use ($user) {
                    $q->where('branch_id', $user->branch_id);
                });
            })
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->search, function ($query, $search) {
                $query->whereHas('student', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhereHas('book', function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%");
                });
            })
            ->when($request->date_from, function ($query, $date) {
                return $query->whereDate('borrowed_at', '>=', $date);
            })
            ->when($request->date_to, function ($query, $date) {
                return $query->whereDate('borrowed_at', '<=', $date);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $books = Book::where('available_copies', '>', 0)
            ->when(!$isSystemAdmin, function ($query) use ($user) {
                return $query->where('branch_id', $user->branch_id);
            })->get();
            
        // Get users with student role or just general students
        $students = User::whereHas('role', function($q){
            $q->where('name', 'طالب');
        })->when(!$isSystemAdmin, function ($query) use ($user) {
            return $query->where('branch_id', $user->branch_id);
        })->get();

        // If no student role is strictly enforced, maybe just load users
        if ($students->isEmpty()) {
            $students = User::when(!$isSystemAdmin, function ($query) use ($user) {
                return $query->where('branch_id', $user->branch_id);
            })->get(); // Fallback for testing
        }

        return Inertia::render('Academic/Library/Borrowings/Index', [
            'borrowings' => $borrowings,
            'books' => $books,
            'students' => $students,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
            'student_id' => 'required|exists:users,id',
            'borrowed_at' => 'required|date',
            'due_date' => 'required|date|after_or_equal:borrowed_at',
        ]);

        $book = Book::findOrFail($validated['book_id']);

        if ($book->available_copies <= 0) {
            return back()->withErrors(['book_id' => 'لا توجد نسخ متاحة من هذا الكتاب حالياً.']);
        }

        $validated['status'] = 'borrowed';

        Borrowing::create($validated);

        $book->decrement('available_copies');

        return redirect()->back()->with('success', 'تم تسجيل الإعارة بنجاح.');
    }

    public function returnBook(Request $request, Borrowing $borrowing)
    {
        if ($borrowing->status === 'returned') {
            return back()->withErrors(['error' => 'تم إرجاع هذا الكتاب مسبقاً.']);
        }

        $borrowing->update([
            'status' => 'returned',
            'returned_at' => Carbon::now(),
        ]);

        $borrowing->book->increment('available_copies');

        return redirect()->back()->with('success', 'تم تسجيل إرجاع الكتاب بنجاح.');
    }

    public function destroy(Borrowing $borrowing)
    {
        if ($borrowing->status === 'borrowed') {
            $borrowing->book->increment('available_copies');
        }

        $borrowing->delete();

        return redirect()->back()->with('success', 'تم حذف سجل الإعارة بنجاح.');
    }
}
