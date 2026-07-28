<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use Illuminate\Auth\Events\Login;
use App\Listeners\LogSuccessfulLogin;
use Illuminate\Support\Facades\Event;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(
            Login::class,
            LogSuccessfulLogin::class,
        );

        Vite::prefetch(concurrency: 3);

        try {
            // Load Mail Settings dynamically if configured
            $mailHost = \App\Models\Setting::get('mail_host');
            if ($mailHost) {
                config([
                    'mail.mailers.smtp.host'       => $mailHost,
                    'mail.mailers.smtp.port'       => \App\Models\Setting::get('mail_port', config('mail.mailers.smtp.port')),
                    'mail.mailers.smtp.username'   => \App\Models\Setting::get('mail_username', config('mail.mailers.smtp.username')),
                    'mail.mailers.smtp.password'   => \App\Models\Setting::get('mail_password', config('mail.mailers.smtp.password')),
                    'mail.mailers.smtp.encryption' => \App\Models\Setting::get('mail_encryption', config('mail.mailers.smtp.encryption')),
                    'mail.from.address'            => \App\Models\Setting::get('mail_from_address', config('mail.from.address')),
                    'mail.from.name'               => \App\Models\Setting::get('school_name', config('app.name')),
                ]);
            }
        } catch (\Throwable $e) {
            // Ignore if tables don't exist yet (e.g. during first migration)
        }

        // Log slow queries (> 500ms)
        try {
            DB::listen(function ($query) {
                if ($query->time > 500) {
                    // Prevent logging queries related to the slow_queries table itself to avoid infinite loops
                    if (!str_contains($query->sql, 'insert into `slow_queries`')) {
                        \App\Models\SlowQuery::create([
                            'sql_query' => $query->sql,
                            'bindings' => $query->bindings,
                            'execution_time_ms' => $query->time,
                            'path' => request()->path(),
                        ]);
                    }
                }
            });
        } catch (\Throwable $e) {
            Log::error('Slow Query Logging failed: ' . $e->getMessage());
        }
    }
}
