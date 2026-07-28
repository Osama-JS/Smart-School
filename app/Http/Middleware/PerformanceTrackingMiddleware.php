<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;

class PerformanceTrackingMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * Handle tasks after the response has been sent to the browser.
     */
    public function terminate(Request $request, Response $response): void
    {
        if (!defined('LARAVEL_START')) {
            return;
        }

        $durationMs = (microtime(true) - LARAVEL_START) * 1000;
        
        $date = now()->format('Y-m-d');
        
        try {
            Cache::increment("perf_req_count_{$date}");
            Cache::increment("perf_req_time_{$date}", (int) round($durationMs));

            // Peak Hours Traffic (Increment DB)
            try {
                $roleName = 'زائر';
                $branchName = 'الفرع الرئيسي';
                $deviceType = 'desktop';
                
                if (auth()->check() && auth()->user()->role) {
                    $roleName = auth()->user()->role->name;
                }
                
                if (auth()->check() && auth()->user()->branch_id) {
                    // Cache the branch name to avoid queries on every request
                    $branchName = \Illuminate\Support\Facades\Cache::remember("user_branch_name_" . auth()->user()->branch_id, 3600, function () {
                        $branch = \Illuminate\Support\Facades\DB::table('branches')->where('id', auth()->user()->branch_id)->first();
                        return $branch ? $branch->name : 'الفرع الرئيسي';
                    });
                }
                
                $userAgent = $request->userAgent() ?? '';
                $deviceType = 'desktop';
                $osName = 'other';
                
                // Device Type
                if (preg_match('/(Mobile|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile)/i', $userAgent)) {
                    $deviceType = 'mobile';
                }
                
                // OS Name
                if (preg_match('/iPhone|iPad|iPod|Mac OS X/i', $userAgent)) {
                    $osName = preg_match('/iPhone|iPad|iPod/i', $userAgent) ? 'ios' : 'mac';
                } elseif (preg_match('/Android/i', $userAgent)) {
                    $osName = 'android';
                } elseif (preg_match('/Windows/i', $userAgent)) {
                    $osName = 'windows';
                } elseif (preg_match('/Linux/i', $userAgent)) {
                    $osName = 'linux';
                }

                \Illuminate\Support\Facades\DB::table('traffic_analytics')
                    ->updateOrInsert(
                        [
                            'date' => now()->toDateString(),
                            'day_of_week' => now()->dayOfWeek,
                            'hour' => now()->hour,
                            'role_name' => $roleName,
                            'branch_name' => $branchName,
                            'device_type' => $deviceType,
                            'os_name' => $osName,
                        ],
                        [
                            'request_count' => \Illuminate\Support\Facades\DB::raw('request_count + 1'),
                            'updated_at' => now(),
                        ]
                    );
            } catch (\Exception $dbException) {
                // Silently fail if table doesn't exist yet
            }

        } catch (\Exception $e) {
            // Ignore cache errors
        }
    }
}
