<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Setting;
use App\Models\FollowupBook;
use App\Models\MasterTimetable;
use App\Models\Notification;
use Carbon\Carbon;

class FollowupDailyReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'followup:daily-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily reminders to teachers who have missing follow-up book uploads.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $timeLimit = Setting::where('key', 'followup_upload_time_limit')->value('value') ?: '14:00';
        $limitTime = Carbon::parse(now()->format('Y-m-d') . ' ' . $timeLimit);

        // Check if the current time has reached or passed the limit time
        if (now()->lt($limitTime)) {
            return;
        }

        // Check if we already ran the reminders today
        $cacheKey = 'followup_daily_reminders_ran_today_' . now()->format('Y-m-d');
        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return;
        }

        $this->info("Time limit reached ($timeLimit). Checking for negligent teachers...");
        
        // Mark as ran for today
        \Illuminate\Support\Facades\Cache::put($cacheKey, true, now()->endOfDay());

        $today = now()->format('Y-m-d');
        $dayOfWeek = strtolower(now()->format('l'));

        $teachers = User::whereHas('role', function ($query) {
                $query->where('name', 'معلم');
            })->where('is_active', true)->get();

        foreach ($teachers as $teacher) {
            $followupsToday = FollowupBook::where('teacher_id', $teacher->id)
                ->whereDate('date', $today)
                ->get();
                
            $expectedLessons = $followupsToday->count();

            if ($expectedLessons === 0) {
                continue; // No lessons today
            }

            // How many uploaded today?
            $uploadsToday = $followupsToday->whereNotNull('uploaded_at')->count();

            if ($uploadsToday < $expectedLessons) {
                // Send Notification
                Notification::create([
                    'user_id' => $teacher->id,
                    'sender_id' => null, // System
                    'branch_id' => $teacher->branch_id,
                    'title' => 'تذكير: لم تكتمل دفاتر المتابعة اليوم',
                    'message' => 'لديك حصص اليوم لم تقم برفع دفتر المتابعة الخاص بها حتى الآن، يرجى استكمالها لتفادي تسجيل التقصير.',
                    'type' => 'system',
                    'target_type' => 'specific_users',
                    'target_users' => [$teacher->id],
                    'is_read' => false
                ]);
                $this->info("Reminder sent to {$teacher->name}");
            }
        }

        $this->info('Daily followup check completed.');
    }
}
