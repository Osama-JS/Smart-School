<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Models\NewsAttachment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSystemAdmin = $user && optional($user->role)->name === 'مدير النظام';

        $branchScope = function ($query) use ($user) {
            return $query->whereHas('author', function($q) use ($user) {
                $q->whereNull('branch_id')
                  ->orWhere('branch_id', $user->branch_id);
            });
        };

        $news = News::with(['author', 'likes', 'comments.user', 'attachments'])
            ->withCount(['likes', 'comments'])
            ->when(!$isSystemAdmin, $branchScope)
            ->when($request->search, function ($query, $search) {
                return $query->where('title', 'like', "%{$search}%")
                             ->orWhere('content', 'like', "%{$search}%");
            })
            ->when($request->category && $request->category !== 'all', function ($query) use ($request) {
                return $query->where('category', $request->category);
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $stats = [
            'total_news' => News::when(!$isSystemAdmin, $branchScope)->count(),
            'total_views' => News::when(!$isSystemAdmin, $branchScope)->sum('views_count') ?? 0,
            'urgent_news' => News::where('category', 'عاجل')->when(!$isSystemAdmin, $branchScope)->count(),
            'scheduled_news' => News::where('is_published', true)->where('published_at', '>', now())->when(!$isSystemAdmin, $branchScope)->count(),
        ];

        $user = auth()->user();
        $canManageNews = $user ? (optional($user->role)->name === 'مدير النظام' || $user->hasPermission('إدارة الأخبار')) : false;

        return Inertia::render('News/Index', [
            'news' => $news,
            'stats' => $stats,
            'filters' => $request->only(['search', 'category']),
            'canManageNews' => $canManageNews,
        ]);
    }

    public function show(News $news)
    {
        $news->load(['author', 'likes', 'comments.user', 'attachments']);
        $news->loadCount(['likes', 'comments']);

        // Record view if not viewed in this session
        $viewedKey = 'viewed_news_' . $news->id;
        if (!session()->has($viewedKey)) {
            $news->increment('views_count');
            session()->put($viewedKey, true);
        }

        return Inertia::render('News/Show', [
            'newsItem' => $news,
        ]);
    }

    public function store(Request $request, \App\Services\NotificationService $notificationService)
    {
        $user = auth()->user();
        abort_if(optional($user->role)->name !== 'مدير النظام' && !$user->hasPermission('إدارة الأخبار'), 403, 'غير مصرح لك بإدارة الأخبار');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string',
            'images.*' => 'nullable|image|max:5120', // Up to 5MB per image
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
        ]);

        $validated['author_id'] = auth()->id() ?? 1; // Fallback to 1 if testing unauthenticated
        $validated['is_published'] = $request->boolean('is_published', true);
        $validated['published_at'] = $request->published_at ? \Carbon\Carbon::parse($request->published_at) : now();

        $news = News::create($validated);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('news', 'public');
                $news->attachments()->create([
                    'file_path' => $path,
                    'file_type' => 'image',
                    'file_name' => $file->getClientOriginalName(),
                ]);
            }
        }

        if ($news->category === 'عاجل' && $news->is_published && $news->published_at <= now()) {
            $notificationService->sendBroadcastNotification(
                "خبر عاجل: " . $news->title,
                \Illuminate\Support\Str::limit(strip_tags($news->content), 100),
                'important', // Type
                auth()->id(), // Sender
                null, // Branch
                'all' // Target Type
            );
            $news->update(['is_notified' => true]);
        }

        return redirect()->back()->with('success', 'تم إضافة الخبر بنجاح.');
    }

    public function update(Request $request, News $news)
    {
        $user = auth()->user();
        abort_if(optional($user->role)->name !== 'مدير النظام' && !$user->hasPermission('إدارة الأخبار'), 403, 'غير مصرح لك بإدارة الأخبار');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string',
            'images.*' => 'nullable|image|max:5120',
            'deleted_attachments' => 'nullable|array',
            'deleted_attachments.*' => 'integer|exists:news_attachments,id',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
        ]);

        $validated['is_published'] = $request->boolean('is_published', $news->is_published);
        if ($request->has('published_at')) {
            $validated['published_at'] = $request->published_at ? \Carbon\Carbon::parse($request->published_at) : null;
        }

        $news->update($validated);

        // Delete requested attachments
        if ($request->has('deleted_attachments') && is_array($request->deleted_attachments)) {
            $attachmentsToDelete = $news->attachments()->whereIn('id', $request->deleted_attachments)->get();
            foreach ($attachmentsToDelete as $attachment) {
                Storage::disk('public')->delete($attachment->file_path);
                $attachment->delete();
            }
        }

        // Handle newly uploaded images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('news', 'public');
                $news->attachments()->create([
                    'file_path' => $path,
                    'file_type' => 'image',
                    'file_name' => $file->getClientOriginalName(),
                ]);
            }
        }

        return redirect()->back()->with('success', 'تم تحديث الخبر بنجاح.');
    }

    public function destroy(News $news)
    {
        $user = auth()->user();
        abort_if(optional($user->role)->name !== 'مدير النظام' && !$user->hasPermission('إدارة الأخبار'), 403, 'غير مصرح لك بإدارة الأخبار');

        if ($news->image_path) {
            Storage::disk('public')->delete($news->image_path);
        }

        foreach ($news->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
        }
        
        $news->delete();

        return redirect()->back()->with('success', 'تم حذف الخبر بنجاح.');
    }

    public function recordView(News $news)
    {
        // Simple view increment without session check for speed and simplicity. 
        // Real-world might use session/cookie to prevent duplicates.
        $news->increment('views_count');
        return back();
    }
}
