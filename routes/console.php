<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
Schedule::command('library:check-overdue')->dailyAt('08:00');
Schedule::command('news:publish-scheduled')->everyMinute();
Schedule::command('followup:generate-expected')->dailyAt('00:01');
Schedule::command('followup:daily-reminders')->everyMinute();
Schedule::command('followup:weekly-reports')->thursdays()->at('15:00');
