<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\NewsComment;
use Illuminate\Http\Request;

class MobileNewsController extends Controller
{
    /**
     * Get a paginated list of published news.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Scope to branch if the user has a branch
        $branchScope = function ($query) use ($user) {
            if ($user && $user->branch_id) {
                return $query->whereHas('author', function($q) use ($user) {
                    $q->whereNull('branch_id')
                      ->orWhere('branch_id', $user->branch_id);
                });
            }
            return $query;
        };

        $newsQuery = News::with(['author:id,name', 'attachments'])
            ->withCount(['likes', 'comments'])
            ->where('is_published', true)
            ->where(function($q) {
                $q->whereNull('published_at')
                  ->orWhere('published_at', '<=', now());
            })
            ->where($branchScope)
            ->when($request->category && $request->category !== 'all', function ($query) use ($request) {
                return $query->where('category', $request->category);
            });

        if ($user) {
            $newsQuery->withExists(['likes as is_liked_by_me' => function($likeQ) use ($user) {
                $likeQ->where('user_id', $user->id);
            }]);
        }

        $news = $newsQuery->latest('published_at')->paginate(15);

        // Transform the results
        $news->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'content' => $item->content,
                'category' => $item->category,
                'image_url' => $item->image_url,
                'published_at_formatted' => $item->published_at ? $item->published_at->format('Y-m-d H:i') : $item->created_at->format('Y-m-d H:i'),
                'author_name' => $item->author?->name ?? 'إدارة المدرسة',
                'views_count' => $item->views_count,
                'likes_count' => $item->likes_count,
                'comments_count' => $item->comments_count,
                'is_liked_by_me' => (bool) $item->is_liked_by_me,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $news
        ]);
    }

    /**
     * Get details of a single news item, including comments.
     */
    public function show(Request $request, $id)
    {
        $news = News::with(['author:id,name', 'attachments', 'comments' => function($q) {
            $q->with('user:id,name')->latest();
        }])
        ->withCount(['likes', 'comments'])
        ->where('is_published', true)
        ->findOrFail($id);

        $user = $request->user();

        // Record view if not viewed by this user yet
        if ($user) {
            $viewedKey = 'mobile_viewed_news_' . $news->id . '_user_' . $user->id;
            if (!\Illuminate\Support\Facades\Cache::has($viewedKey)) {
                $news->increment('views_count');
                \Illuminate\Support\Facades\Cache::put($viewedKey, true, now()->addHours(24));
            }
        } else {
            $news->increment('views_count');
        }

        $isLiked = false;
        if ($user) {
            $isLiked = \Illuminate\Support\Facades\DB::table('news_likes')
                ->where('news_id', $news->id)
                ->where('user_id', $user->id)
                ->exists();
        }

        $formattedComments = $news->comments->map(function ($comment) use ($user) {
            return [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at_formatted' => $comment->created_at->diffForHumans(),
                'user_name' => $comment->user?->name ?? 'مستخدم',
                'is_mine' => $user && $comment->user_id === $user->id,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $news->id,
                'title' => $news->title,
                'content' => $news->content,
                'category' => $news->category,
                'image_url' => $news->image_url,
                'published_at_formatted' => $news->published_at ? $news->published_at->format('Y-m-d H:i') : $news->created_at->format('Y-m-d H:i'),
                'author_name' => $news->author?->name ?? 'إدارة المدرسة',
                'views_count' => $news->views_count,
                'likes_count' => $news->likes_count,
                'comments_count' => $news->comments_count,
                'is_liked_by_me' => $isLiked,
                'comments' => $formattedComments,
            ]
        ]);
    }

    /**
     * Toggle Like on a news item.
     */
    public function toggleLike(Request $request, $id)
    {
        $news = News::where('is_published', true)->findOrFail($id);
        $user = $request->user();

        $like = \App\Models\NewsLike::where('news_id', $news->id)
            ->where('user_id', $user->id)
            ->first();

        if ($like) {
            $like->delete();
            $action = 'unliked';
        } else {
            \App\Models\NewsLike::create([
                'news_id' => $news->id,
                'user_id' => $user->id
            ]);
            $action = 'liked';
        }

        return response()->json([
            'status' => 'success',
            'message' => $action === 'liked' ? 'تم الإعجاب بالخبر' : 'تم إزالة الإعجاب',
            'action' => $action,
            'likes_count' => $news->likes()->count()
        ]);
    }

    /**
     * Add a comment to a news item.
     */
    public function addComment(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string|max:1000'
        ]);

        $news = News::where('is_published', true)->findOrFail($id);
        $user = $request->user();

        $comment = \App\Models\NewsComment::create([
            'news_id' => $news->id,
            'user_id' => $user->id,
            'content' => $request->content
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تمت إضافة التعليق بنجاح',
            'data' => [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at_formatted' => $comment->created_at->diffForHumans(),
                'user_name' => $user->name,
                'is_mine' => true,
            ]
        ]);
    }

    /**
     * Delete a comment.
     */
    public function deleteComment(Request $request, $newsId, $commentId)
    {
        $comment = NewsComment::where('news_id', $newsId)->findOrFail($commentId);
        $user = $request->user();

        // Only the owner of the comment can delete it
        if ($comment->user_id !== $user->id) {
            return response()->json(['message' => 'غير مصرح لك بحذف هذا التعليق'], 403);
        }

        $comment->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف التعليق بنجاح'
        ]);
    }
}
