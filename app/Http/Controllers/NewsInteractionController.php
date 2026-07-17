<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Models\NewsComment;
use Illuminate\Http\Request;

class NewsInteractionController extends Controller
{
    public function toggleLike(News $news)
    {
        $userId = auth()->id();
        
        $like = $news->likes()->where('user_id', $userId)->first();
        
        if ($like) {
            $like->delete();
        } else {
            $news->likes()->create(['user_id' => $userId]);
        }
        
        return back();
    }

    public function storeComment(Request $request, News $news)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $news->comments()->create([
            'user_id' => auth()->id(),
            'content' => $request->content,
        ]);

        return back()->with('success', 'تم إضافة التعليق بنجاح.');
    }

    public function destroyComment(NewsComment $comment)
    {
        // Only author or admin can delete
        $user = auth()->user();
        if ($user->id !== $comment->user_id && optional($user->role)->name !== 'مدير النظام' && !$user->hasPermission('إدارة الأخبار')) {
            abort(403, 'Unauthorized action.');
        }

        $comment->delete();

        return back()->with('success', 'تم حذف التعليق.');
    }
}
