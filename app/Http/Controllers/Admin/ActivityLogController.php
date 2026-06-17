<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Branch;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::withoutGlobalScope('branch_isolation')->with(['user:id,name,role_id', 'user.role:id,name', 'branch:id,name']);

        // Only System Admin can see all branches. Others only see their branch.
        $user = auth()->user();
        if (!$user->role || $user->role->name !== 'مدير النظام') {
            $query->where('activity_logs.branch_id', $user->branch_id);
        }

        // Apply filters
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('department_id')) {
            $query->whereHas('user.employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        if ($request->filled('table_name')) {
            $query->where('table_name', $request->table_name);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('user', function($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%");
                })->orWhere('table_name', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%");
            });
        }

        $logs = $query->latest()->paginate(15)->withQueryString();

        // Get unique table names for the filter dropdown
        $tables = ActivityLog::select('table_name')->distinct()->pluck('table_name');

        $branches = [];
        $departments = [];
        
        if ($user->role->name === 'مدير النظام') {
            $branches = Branch::select('id', 'name')->get();
            $departments = Department::select('id', 'name')->get();
        } else {
            $departments = Department::where('branch_id', $user->branch_id)->select('id', 'name')->get();
        }

        return Inertia::render('Admin/ActivityLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'action', 'table_name', 'date_from', 'date_to', 'branch_id', 'department_id']),
            'tables' => $tables,
            'branches' => $branches,
            'departments' => $departments,
            'isSystemAdmin' => $user->role->name === 'مدير النظام'
        ]);
    }
}
