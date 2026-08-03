<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\EmployeeAchievement;

class EmployeeAchievementNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $achievement;

    /**
     * Create a new notification instance.
     */
    public function __construct(EmployeeAchievement $achievement)
    {
        $this->achievement = $achievement;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // نستخدم الإيميل فقط هنا لتجنب التعارض مع جدول الإشعارات المخصص
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('تهانينا! تم تسجيل إنجاز جديد لك')
                    ->greeting('مرحباً ' . $notifiable->name)
                    ->line('نود إعلامك بأنه تم تسجيل إنجاز جديد لك في النظام بعنوان: ' . $this->achievement->achievementType->name)
                    ->line('النقاط المكتسبة: ' . $this->achievement->points . ' نقطة')
                    ->line('تاريخ الإنجاز: ' . $this->achievement->achievement_date)
                    ->action('عرض الإنجاز في لوحة التحكم', url('/my-achievements'))
                    ->line('شكراً لجهودك وعملك المتميز!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'إنجاز جديد: ' . $this->achievement->achievementType->name,
            'message' => 'تم منحك ' . $this->achievement->points . ' نقطة تقديراً لجهودك.',
            'achievement_id' => $this->achievement->id,
            'points' => $this->achievement->points,
            'icon' => 'Award',
            'type' => 'achievement'
        ];
    }
}
