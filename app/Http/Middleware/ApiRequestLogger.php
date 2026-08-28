<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ApiRequestLogger
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        Log::info(">>> [INCOMING API REQUEST] {$request->method()} {$request->path()}", [
            'ip' => $request->ip(),
            'has_auth_header' => $request->hasHeader('Authorization'),
            'auth_header_preview' => substr($request->header('Authorization') ?? '', 0, 20) . '...',
            'query' => $request->all(),
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
            ] : 'Guest/Pre-Auth',
        ]);

        $response = $next($request);

        $duration = round((microtime(true) - $start) * 1000, 2);

        Log::info("<<< [API RESPONSE] {$request->method()} {$request->path()} -> Status: {$response->getStatusCode()} ({$duration}ms)", [
            'status' => $response->getStatusCode(),
            'user' => $request->user() ? $request->user()->id : 'Guest',
        ]);

        return $response;
    }
}
