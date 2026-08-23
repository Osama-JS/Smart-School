<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class MobileQuickTaskController extends Controller
{
    /**
     * Get the user's quick tasks.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $tasks = Task::where('assigned_to', $user->id)
            ->latest()
            // We can return a paginated list or all tasks (limited for performance)
            // Typically quick tasks are meant to be short, so paginate(20) is good.
            ->paginate(20)
            ->through(function ($task) {
                return [
                    'id' => $task->id,
                    'text' => $task->title,
                    'completed' => $task->status === 'completed',
                    'created_at_formatted' => $task->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $tasks
        ]);
    }

    /**
     * Store a new quick task.
     */
    public function store(Request $request)
    {
        $request->validate([
            'text' => 'required|string|max:255'
        ]);

        $user = $request->user();

        $task = Task::create([
            'branch_id' => $user->branch_id ?? 1,
            'title' => $request->text,
            'status' => 'todo',
            'priority' => 'medium',
            'assigned_to' => $user->id,
            'assigned_by' => $user->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تم إضافة المهمة بنجاح',
            'data' => [
                'id' => $task->id,
                'text' => $task->title,
                'completed' => false,
                'created_at_formatted' => $task->created_at->diffForHumans(),
            ]
        ], 201);
    }

    /**
     * Toggle the status of a quick task.
     */
    public function toggle(Request $request, $id)
    {
        $user = $request->user();
        $task = Task::findOrFail($id);

        if ($task->assigned_to !== $user->id) {
            return response()->json(['message' => 'غير مصرح لك بتعديل هذه المهمة'], 403);
        }

        $task->update([
            'status' => $task->status === 'completed' ? 'todo' : 'completed'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث حالة المهمة',
            'data' => [
                'id' => $task->id,
                'text' => $task->title,
                'completed' => $task->status === 'completed',
            ]
        ]);
    }

    /**
     * Delete a quick task.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $task = Task::findOrFail($id);

        if ($task->assigned_to !== $user->id) {
            return response()->json(['message' => 'غير مصرح لك بحذف هذه المهمة'], 403);
        }

        $task->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف المهمة بنجاح'
        ]);
    }
}
