<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckInstallation
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Allow access to installation routes and assets
        if ($request->is('install*') || $request->is('build/*') || $request->is('build*') || $request->is('images/*')) {
            return $next($request);
        }

        // Check if DB is configured and table exists (to avoid errors on fresh clones)
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('users')) {
                // If no users exist, system is not installed
                if (\App\Models\User::count() === 0) {
                    return redirect('/install');
                }
            }
        } catch (\Exception $e) {
            // DB not connected or no tables
            return redirect('/install');
        }

        return $next($request);
    }
}
