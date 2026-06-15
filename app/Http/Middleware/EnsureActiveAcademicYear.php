<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AcademicYear;

class EnsureActiveAcademicYear
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        if (!$user || !$user->branch_id) {
            return $next($request);
        }

        // Allow routes that shouldn't be blocked
        if ($request->is('academic/years*') || $request->is('logout') || $request->is('login') || $request->is('install*')) {
            return $next($request);
        }

        $activeYear = AcademicYear::currentForBranch($user->branch_id);

        if (!$activeYear) {
            $isManager = $user->role && in_array($user->role->name, ['مدير الفرع', 'مدير النظام']);
            
            if ($isManager) {
                return redirect()->route('academic.years')->with('error', 'يجب إعداد وتفعيل سنة دراسية للفرع قبل البدء باستخدام النظام.');
            } else {
                abort(403, 'النظام قيد الإعداد. يرجى الانتظار حتى يقوم مدير الفرع بإعداد وتفعيل السنة الدراسية.');
            }
        }

        return $next($request);
    }
}
