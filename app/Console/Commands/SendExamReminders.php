<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ExamScheduleItem;
use Carbon\Carbon;
use App\Notifications\ExamReminderNotification;

class SendExamReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exams:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send proactive exam reminders to students and parents 24 hours before the exam.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tomorrow = Carbon::tomorrow()->toDateString();
        
        $this->info("Starting to send exam reminders for date: {$tomorrow}");

        $examItems = ExamScheduleItem::where('exam_date', $tomorrow)
            ->with(['subject', 'division.enrollments.student.user', 'division.enrollments.student.parents'])
            ->get();

        $count = 0;

        foreach ($examItems as $item) {
            if (!$item->division) continue;

            $activeEnrollments = $item->division->enrollments->where('status', 'active');
            
            foreach ($activeEnrollments as $enrollment) {
                $student = $enrollment->student;
                if (!$student) continue;

                // Notify Student
                if ($student->user) {
                    $student->user->notify(new ExamReminderNotification($item, false));
                    $count++;
                }

                // Notify Parents
                if ($student->parents) {
                    foreach ($student->parents as $parent) {
                        $parent->notify(new ExamReminderNotification($item, true));
                        $count++;
                    }
                }
            }
        }

        $this->info("Successfully sent {$count} exam reminders.");
        return 0;
    }
}
