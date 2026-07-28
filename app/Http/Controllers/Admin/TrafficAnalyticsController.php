<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TrafficAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $range = $request->get('range', '15m');
        
        switch ($range) {
            case '5m':
                $activeUsersThreshold = now()->subMinutes(5)->timestamp;
                break;
            case 'today':
                $activeUsersThreshold = now()->startOfDay()->timestamp;
                break;
            case 'week':
                $activeUsersThreshold = now()->startOfWeek()->timestamp;
                break;
            case '15m':
            default:
                $activeUsersThreshold = now()->subMinutes(15)->timestamp;
                $range = '15m'; // ensure clean default
                break;
        }

        // Fetch Active Concurrent Users (Last 15 minutes)
        
        $activeUsers = DB::table('sessions')
            ->whereNotNull('sessions.user_id')
            ->where('last_activity', '>=', $activeUsersThreshold)
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
            ->select(
                DB::raw('COALESCE(roles.name, "غير محدد") as role_name'), 
                DB::raw('COALESCE(branches.name, "الفرع الرئيسي") as branch_name'), 
                DB::raw('IF(sessions.user_agent REGEXP "(Mobile|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile)", "mobile", "desktop") as device_type'),
                DB::raw('
                    CASE 
                        WHEN sessions.user_agent REGEXP "(iPhone|iPad|iPod)" THEN "ios"
                        WHEN sessions.user_agent REGEXP "Android" THEN "android"
                        WHEN sessions.user_agent REGEXP "Windows" THEN "windows"
                        WHEN sessions.user_agent REGEXP "Mac OS X" THEN "mac"
                        WHEN sessions.user_agent REGEXP "Linux" THEN "linux"
                        ELSE "other"
                    END as os_name
                '),
                DB::raw('count(distinct sessions.user_id) as count')
            )
            ->groupBy('role_name', 'branch_name', 'device_type', 'os_name')
            ->get();
            
        $totalActiveUsers = $activeUsers->sum('count');

        // Fetch Peak Hours Traffic
        $trafficData = [];
        $todayTraffic = [];
        $yesterdayTraffic = [];
        try {
            $trafficData = DB::table('traffic_analytics')
                ->select('day_of_week', 'hour', 'role_name', 'branch_name', 'device_type', 'os_name', 'request_count')
                ->get()
                ->toArray();
                
            $todayTraffic = DB::table('traffic_analytics')
                ->where('date', now()->toDateString())
                ->select('hour', 'role_name', 'branch_name', 'device_type', 'os_name', 'request_count')
                ->get()
                ->toArray();
                
            $yesterdayTraffic = DB::table('traffic_analytics')
                ->where('date', now()->subDay()->toDateString())
                ->select('hour', 'role_name', 'branch_name', 'device_type', 'os_name', 'request_count')
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            // Table might not exist yet or role_name is missing
        }

        // Fetch Branch Traffic (Heatmap Nodes)
        $branchTraffic = DB::table('sessions')
            ->whereNotNull('sessions.user_id')
            ->where('last_activity', '>=', $activeUsersThreshold)
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->join('branches', 'users.branch_id', '=', 'branches.id')
            ->select(
                'branches.name as branch_name', 
                DB::raw('COALESCE(roles.name, "غير محدد") as role_name'), 
                DB::raw('IF(sessions.user_agent REGEXP "(Mobile|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile)", "mobile", "desktop") as device_type'),
                DB::raw('
                    CASE 
                        WHEN sessions.user_agent REGEXP "(iPhone|iPad|iPod)" THEN "ios"
                        WHEN sessions.user_agent REGEXP "Android" THEN "android"
                        WHEN sessions.user_agent REGEXP "Windows" THEN "windows"
                        WHEN sessions.user_agent REGEXP "Mac OS X" THEN "mac"
                        WHEN sessions.user_agent REGEXP "Linux" THEN "linux"
                        ELSE "other"
                    END as os_name
                '),
                DB::raw('count(distinct sessions.user_id) as count')
            )
            ->groupBy('branches.name', 'roles.name', 'device_type', 'os_name')
            ->get();

        // Search Users (Live Spotlight)
        $searchResults = [];
        if ($request->has('search') && strlen($request->get('search')) >= 2) {
            $searchTerm = $request->get('search');
            $searchResults = DB::table('users')
                ->where('users.name', 'like', "%{$searchTerm}%")
                ->leftJoin('sessions', 'users.id', '=', 'sessions.user_id')
                ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
                ->select(
                    'users.id',
                    'users.name',
                    DB::raw('COALESCE(roles.name, "غير محدد") as role_name'),
                    DB::raw('COALESCE(branches.name, "الفرع الرئيسي") as branch_name'),
                    'sessions.last_activity'
                )
                ->orderByDesc('sessions.last_activity')
                ->limit(10)
                ->get()
                ->map(function($user) use ($activeUsersThreshold) {
                    $isOnline = $user->last_activity && $user->last_activity >= $activeUsersThreshold;
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'role_name' => $user->role_name,
                        'branch_name' => $user->branch_name,
                        'is_online' => $isOnline,
                        'last_activity' => $user->last_activity ? \Carbon\Carbon::createFromTimestamp($user->last_activity)->diffForHumans() : 'غير متوفر'
                    ];
                });
        }

        return Inertia::render('Admin/Traffic/Index', [
            'activeUsers' => $activeUsers,
            'totalActiveUsers' => $totalActiveUsers,
            'trafficData' => $trafficData,
            'todayTraffic' => $todayTraffic,
            'yesterdayTraffic' => $yesterdayTraffic,
            'branchTraffic' => $branchTraffic,
            'currentRange' => $range,
            'searchResults' => $searchResults,
        ]);
    }
}
