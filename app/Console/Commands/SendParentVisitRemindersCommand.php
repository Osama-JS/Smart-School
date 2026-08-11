<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ParentVisit;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendParentVisitRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'visits:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send push notifications to parents for scheduled visits happening tomorrow';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService)
    {
        $this->info('Starting to send parent visit reminders...');
        
        $tomorrow = Carbon::tomorrow()->format('Y-m-d');
        
        $visits = ParentVisit::with(['student.parents', 'employee'])
            ->whereDate('visit_date', $tomorrow)
            ->where('status', 'مجدولة')
            ->get();

        $count = 0;
        
        foreach ($visits as $visit) {
            $studentName = $visit->student->user->name ?? 'الطالب';
            $employeeName = $visit->employee->name ?? 'موظف الإدارة';
            $visitTime = $visit->visit_time ? Carbon::parse($visit->visit_time)->format('h:i A') : 'غير محدد';
            
            $title = 'تذكير بموعد زيارة غداً';
            $message = "نذكركم بموعد زيارتكم للمدرسة غداً بخصوص الطالب {$studentName}. ";
            $message .= "المضيف: {$employeeName}. ";
            
            if ($visit->visit_time) {
                $message .= "الوقت: {$visitTime}.";
            }

            if ($visit->student && $visit->student->parents) {
                foreach ($visit->student->parents as $parent) {
                    $notificationService->sendComprehensiveNotification(
                        $parent,
                        $title,
                        $message,
                        'visit_reminder',
                        false // No email
                    );
                    $count++;
                }
            }
        }

        $this->info("Sent {$count} reminders.");
        Log::info("Parent Visit Reminders: Sent {$count} notifications for tomorrow's visits.");
    }
}
