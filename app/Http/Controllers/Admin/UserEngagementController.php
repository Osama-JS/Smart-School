<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserLoginLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class UserEngagementController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->get('filter', 'all'); // all, active_today, ghosts
        $search = $request->get('search', '');
        
        // Base query
        $query = User::with('role')
            ->select('users.id', 'users.name', 'users.email', 'users.last_login_at', 'users.created_at', 'users.role_id')
            ->withCount([
                'loginLogs as total_logins',
                'loginLogs as today_logins' => function ($query) {
                    $query->whereDate('created_at', now()->toDateString());
                }
            ]);

        // Apply filters
        if ($filter === 'active_today') {
            $query->whereDate('last_login_at', now()->toDateString());
        } elseif ($filter === 'ghosts') {
            $query->whereNull('last_login_at');
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        // Apply sorting
        if ($filter === 'ghosts') {
            $query->orderBy('created_at', 'desc');
        } else {
            $query->orderBy('last_login_at', 'desc');
        }

        $users = $query->paginate(20)->withQueryString();

        // Get overall stats
        $totalUsers = User::count();
        $ghostsCount = User::whereNull('last_login_at')->count();
        $activeTodayCount = User::whereDate('last_login_at', now()->toDateString())->count();
        
        return Inertia::render('Admin/Engagement/Index', [
            'users' => $users,
            'filters' => [
                'filter' => $filter,
                'search' => $search,
            ],
            'stats' => [
                'total_users' => $totalUsers,
                'ghosts' => $ghostsCount,
                'active_today' => $activeTodayCount,
            ]
        ]);
    }
}
