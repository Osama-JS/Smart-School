<?php

namespace App\Notifications;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Channels\WhatsAppChannel;

class StudentTierUpgradedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $student;
    protected $tierName;

    public function __construct(Student $student, $tierName)
    {
        $this->student = $student;
        $this->tierName = $tierName;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail', WhatsAppChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $studentName = $this->student->user->name ?? 'الطالب';
        
        return (new MailMessage)
                    ->subject('تهنئة بارتقاء المستوى - ' . config('app.name'))
                    ->greeting('يسعدنا إبلاغكم بهذا الإنجاز!')
                    ->line('نبارك للطالب / ' . $studentName . ' ارتقاءه في نظام التميز السلوكي.')
                    ->line('لقد وصل الطالب الآن إلى مستوى: ' . $this->tierName)
                    ->line('نتمنى له المزيد من التميز والنجاح.')
                    ->action('عرض شهادة التميز', url('/academic/achievements/certificate/' . $this->student->id))
                    ->salutation('مع تحيات إدارة التوجيه والإرشاد');
    }

    public function toArray(object $notifiable): array
    {
        $studentName = $this->student->user->name ?? 'الطالب';
        
        return [
            'title' => 'ارتقاء مستوى الطالب',
            'message' => "نبارك للطالب {$studentName} ارتقاءه إلى {$this->tierName}.",
            'student_id' => $this->student->id,
        ];
    }

    public function toWhatsApp(object $notifiable): string
    {
        $studentName = $this->student->user->name ?? 'الطالب';
        
        return "تهنئة من مدرسة القيم الأهلية 🌟\nنبارك للطالب/ {$studentName} ارتقاءه في نظام التميز السلوكي ووصوله إلى مستوى: {$this->tierName}.\nنتمنى له دوام التوفيق.";
    }
}
