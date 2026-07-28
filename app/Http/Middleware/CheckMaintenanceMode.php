<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Setting;
use Inertia\Inertia;

class CheckMaintenanceMode
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Allow installation and authentication routes to ensure admins can log in
        if ($request->is('install*') || $request->is('login') || $request->is('logout') || $request->is('sanctum/csrf-cookie')) {
            return $next($request);
        }

        $maintenanceMode = filter_var(Setting::get('maintenance_mode', false), FILTER_VALIDATE_BOOLEAN);

        if ($maintenanceMode) {
            $isSystemAdmin = auth()->check() && auth()->user()->role && auth()->user()->role->name === 'مدير النظام';
            
            // Allow system admin to access the system
            if (!$isSystemAdmin) {
                if ($request->expectsJson()) {
                    return response()->json(['message' => 'النظام في وضع الصيانة حالياً.'], 503);
                }
                
                return Inertia::render('Maintenance', [
                    'message' => 'النظام مغلق مؤقتاً لأغراض الصيانة والتحديث. يرجى المحاولة لاحقاً.'
                ])->toResponse($request)->setStatusCode(503);
            }
        }

        return $next($request);
    }
}
