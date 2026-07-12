<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض المهام', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة مهمة', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل مهمة', only: ['edit', 'update', 'updateStatus']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف مهمة', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role && in_array($user->role->name, ['مدير النظام', 'Admin']);

        $query = Task::with(['assignedTo', 'assignedBy'])
            ->latest();

        if (!$isAdmin) {
            $query->where('branch_id', $user->branch_id);
            
            // If not manager, maybe only see tasks assigned TO them or BY them?
            // Usually, HR/Manager can see all tasks in branch. We'll show all tasks for the branch if they have permission to 'عرض المهام'.
            // To be more restricted, we could do:
            // $query->where(function($q) use ($user) {
            //     $q->where('assigned_to', $user->id)
            //       ->orWhere('assigned_by', $user->id);
            // });
            // But since they have the HR permission, they can see all.
        }

        // Get all tasks (not paginated) to display in Kanban board
        $tasks = $query->get();

        // Get users for assignment (everyone except students/parents)
        $employeesQuery = User::whereHas('role', function($q) {
            $q->whereNotIn('name', ['طالب', 'ولي أمر']);
        })->select('id', 'name');

        if (!$isAdmin) {
            $employeesQuery->where('branch_id', $user->branch_id);
        }
        $employees = $employeesQuery->get();

        return Inertia::render('HR/Tasks/Index', [
            'tasks' => $tasks,
            'employees' => $employees,
            'currentUser' => $user->id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high',
            'status' => 'required|in:todo,in_progress,review,completed,cancelled',
            'due_date' => 'nullable|date',
            'assigned_to' => 'required|exists:users,id',
        ]);

        $task = Task::create([
            'branch_id' => Auth::user()->branch_id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'due_date' => $validated['due_date'],
            'assigned_to' => $validated['assigned_to'],
            'assigned_by' => Auth::id(),
        ]);

        return back()->with('success', 'تم إضافة المهمة بنجاح.');
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high',
            'status' => 'required|in:todo,in_progress,review,completed,cancelled',
            'due_date' => 'nullable|date',
            'assigned_to' => 'required|exists:users,id',
        ]);

        $task->update($validated);

        return back()->with('success', 'تم تحديث المهمة بنجاح.');
    }

    public function updateStatus(Request $request, Task $task)
    {
        $validated = $request->validate([
            'status' => 'required|in:todo,in_progress,review,completed,cancelled',
        ]);

        $task->update(['status' => $validated['status']]);

        return back()->with('success', 'تم تحديث حالة المهمة.');
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return back()->with('success', 'تم حذف المهمة بنجاح.');
    }
}
