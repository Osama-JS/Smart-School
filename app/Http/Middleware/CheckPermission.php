<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permission
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!auth()->check() || !auth()->user()->hasPermission($permission)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'status' => false,
                    'message' => 'لا تملك صلاحية للقيام بهذه العملية'
                ], 403);
            }

            abort(403, 'لا تملك صلاحية للقيام بهذه العملية');
        }

        return $next($request);
    }
}
