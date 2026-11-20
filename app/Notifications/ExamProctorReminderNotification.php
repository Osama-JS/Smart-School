<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Models\ExamScheduleItem;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ExamProctorReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected ExamScheduleItem $examItem;

    public function __construct(ExamScheduleItem $examItem)
    {
        $this->examItem = $examItem;
    }

    public function via(object $notifiable): array
    {
        return ['database', WhatsAppChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        $subjectName = $this->examItem->subject->name ?? 'مادة غير محددة';
        $gradeName = $this->examItem->division?->grade?->name ?? '';
        $divisionName = $this->examItem->division?->name ?? '';
        $classLabel = trim($gradeName . ($divisionName ? " - {$divisionName}" : ''));
        $startTime = $this->examItem->start_time ? Carbon::parse($this->examItem->start_time)->format('h:i A') : 'غير محدد';
        $room = $this->examItem->room ?: 'غير محددة';

        $message = "تذكير بمهمة مراقبة غداً: اختبار مادة [{$subjectName}]"
            . ($classLabel ? " ({$classLabel})" : '')
            . " الساعة {$startTime} - القاعة: {$room}.";

        return [
            'exam_item_id' => $this->examItem->id,
            'subject_name' => $subjectName,
            'room' => $room,
            'exam_date' => $this->examItem->exam_date,
            'message' => $message,
            'type' => 'exam_proctor_reminder',
            'icon' => 'ShieldCheck',
            'link' => '/teacher/my-exam-schedules',
        ];
    }

    public function toWhatsApp(object $notifiable): string
    {
        $subjectName = $this->examItem->subject->name ?? 'مادة غير محددة';
        $gradeName = $this->examItem->division?->grade?->name ?? '';
        $divisionName = $this->examItem->division?->name ?? '';
        $classLabel = trim($gradeName . ($divisionName ? " - {$divisionName}" : ''));
        $startTime = $this->examItem->start_time ? Carbon::parse($this->examItem->start_time)->format('h:i A') : 'غير محدد';
        $room = $this->examItem->room ?: 'غير محددة';

        return "🛡️ *تذكير بمهمة مراقبة اختبار*\n\n"
            . "عزيزي المعلم،\n"
            . "لديك غداً مهمة مراقبة في مادة *{$subjectName}*"
            . ($classLabel ? " ({$classLabel})" : '') . ".\n"
            . "⏰ الوقت: {$startTime}\n"
            . "📍 القاعة: *{$room}*\n\n"
            . "يرجى التواجد قبل موعد الاختبار بـ 15 دقيقة.";
    }
}
