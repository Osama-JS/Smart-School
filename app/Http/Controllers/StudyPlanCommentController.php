<?php

namespace App\Http\Controllers;

use App\Models\StudyPlan;
use App\Models\StudyPlanComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudyPlanCommentController extends Controller
{
    /**
     * Get all comments for a study plan.
     */
    public function index(StudyPlan $studyPlan)
    {
        // Both Teacher and Supervisor should be able to view comments.
        // We'll rely on basic auth and route grouping.
        $comments = $studyPlan->comments()->with('user:id,name,role')->latest()->get();
        return response()->json($comments);
    }

    /**
     * Store a new comment.
     */
    public function store(Request $request, StudyPlan $studyPlan)
    {
        $validated = $request->validate([
            'cell_key' => 'required|string|max:255',
            'comment' => 'required|string',
        ]);

        $comment = $studyPlan->comments()->create([
            'user_id' => Auth::id(),
            'cell_key' => $validated['cell_key'],
            'comment' => $validated['comment'],
            'is_resolved' => false,
        ]);

        $comment->load('user:id,name,role');

        return response()->json($comment, 201);
    }

    /**
     * Resolve a comment.
     */
    public function resolve(StudyPlanComment $studyPlanComment)
    {
        // Ensure the user has the right to resolve. 
        // Only the teacher (plan owner) or supervisor should resolve.
        $studyPlanComment->update(['is_resolved' => true]);

        return response()->json(['success' => true]);
    }
}
