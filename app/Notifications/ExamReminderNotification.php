<?php

namespace App\Notifications;

use App\Models\ExamScheduleItem;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Carbon\Carbon;

class ExamReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $examItem;
    protected $isParent;

    /**
     * Create a new notification instance.
     *
     * @param ExamScheduleItem $examItem
     * @param bool $isParent Indicates if the notification is for a parent.
     */
    public function __construct(ExamScheduleItem $examItem, bool $isParent = false)
    {
        $this->examItem = $examItem;
        $this->isParent = $isParent;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // TODO: SMS Service integration can be added here in the future
        // return ['database', 'sms'];
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $subjectName = $this->examItem->subject->name ?? 'مادة غير محددة';
        $startTime = $this->examItem->start_time ? Carbon::parse($this->examItem->start_time)->format('h:i A') : '';
        $syllabus = $this->examItem->syllabus ? "لا تنسَ مراجعة [{$this->examItem->syllabus}]" : "نتمنى لك التوفيق";

        if ($this->isParent) {
            $message = "تذكير: لدى ابنك/ابنتك غداً اختبار في مادة [{$subjectName}] يبدأ الساعة {$startTime}. {$syllabus}";
        } else {
            $message = "تذكير: لديك غداً اختبار في مادة [{$subjectName}] يبدأ الساعة {$startTime}. {$syllabus}";
        }

        return [
            'exam_item_id' => $this->examItem->id,
            'subject_name' => $subjectName,
            'exam_date' => $this->examItem->exam_date,
            'message' => $message,
            'type' => 'exam_reminder',
            'icon' => 'BellRing',
            'link' => '/student/exam-schedules'
        ];
    }
}
