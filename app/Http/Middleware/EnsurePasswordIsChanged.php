<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsChanged
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && !empty($user->must_change_password)) {
            // Allow access to logout and the force password change routes
            if ($request->routeIs('password.force_change', 'password.force_change.update', 'logout')) {
                return $next($request);
            }

            return redirect()->route('password.force_change');
        }

        return $next($request);
    }
}
