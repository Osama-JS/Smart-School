<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Task;
use Illuminate\Support\Carbon;

use App\Traits\ResolvesStudent;

class MyTasksController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        [$student, $children] = $this->resolveStudent($request);
        
        if (!$student) {
            return Inertia::render('Student/Tasks/Index', [
                'tasks' => [],
                'stats' => [],
                'children' => $children,
                'activeChildId' => null,
            ]);
        }
        
        // Get all tasks assigned to the student (tasks are assigned to users, so use user_id)
        $tasks = Task::with('assignedBy:id,name')
            ->where('assigned_to', $student->user_id)
            ->orderByRaw("FIELD(status, 'todo', 'in_progress', 'review', 'completed', 'cancelled')")
            ->orderBy('due_date', 'asc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'due_date' => $task->due_date ? Carbon::parse($task->due_date)->format('Y-m-d') : null,
                    'is_overdue' => $task->due_date && Carbon::parse($task->due_date)->isPast() && $task->status !== 'completed',
                    'assigned_by' => $task->assignedBy ? $task->assignedBy->name : 'شخصي',
                    'is_personal' => $task->assigned_by === $task->assigned_to,
                    'created_at' => $task->created_at->format('Y-m-d H:i'),
                ];
            });

        return Inertia::render('Student/Tasks/Index', [
            'tasks' => $tasks,
            'stats' => [
                'total' => $tasks->count(),
                'completed' => $tasks->where('status', 'completed')->count(),
                'pending' => $tasks->whereIn('status', ['todo', 'in_progress', 'review'])->count(),
                'overdue' => $tasks->where('is_overdue', true)->count(),
            ],
            'children' => $children,
            'activeChildId' => $student->id,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if ($user->role->name !== 'طالب') abort(403);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|in:low,medium,high'
        ]);

        Task::create([
            'branch_id' => $user->branch_id,
            'title' => $request->title,
            'description' => $request->description,
            'status' => 'todo',
            'priority' => $request->priority ?? 'medium',
            'due_date' => $request->due_date,
            'assigned_to' => $user->id,
            'assigned_by' => $user->id, // Personal task
        ]);

        return back()->with('success', 'تم إضافة المهمة بنجاح');
    }

    public function updateStatus(Request $request, Task $task)
    {
        $user = auth()->user();
        if ($task->assigned_to !== $user->id) abort(403);

        $request->validate([
            'status' => 'required|in:todo,in_progress,review,completed,cancelled'
        ]);

        $task->update(['status' => $request->status]);

        return back()->with('success', 'تم تحديث حالة المهمة');
    }

    public function destroy(Task $task)
    {
        $user = auth()->user();
        // Only allow deleting personal tasks
        if ($task->assigned_to !== $user->id || $task->assigned_by !== $user->id) abort(403);

        $task->delete();

        return back()->with('success', 'تم حذف المهمة');
    }
}
