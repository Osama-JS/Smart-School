<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SystemAdminOnly
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        if (!$user || !$user->role || !in_array($user->role->name, ['مدير عام', 'مدير النظام'])) {
            abort(403, 'غير مصرح لك بالوصول لهذه الصفحة. هذه الصفحة مخصصة لمدير النظام فقط.');
        }

        return $next($request);
    }
}
