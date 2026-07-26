<?php

namespace App\Notifications;

use App\Models\StudentPledge;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Channels\WhatsAppChannel;

class StudentPledgeIssuedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $pledge;

    public function __construct(StudentPledge $pledge)
    {
        $this->pledge = $pledge;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail', WhatsAppChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $studentName = $this->pledge->student->user->name ?? 'الطالب';
        $date = $this->pledge->date ? $this->pledge->date->format('Y-m-d') : 'غير محدد';
        
        return (new MailMessage)
                    ->subject('إشعار تسجيل تعهد - ' . config('app.name'))
                    ->greeting('المكرم ولي أمر الطالب / ' . $studentName)
                    ->line('نود إشعاركم بأنه تم تسجيل تعهد على الطالب بتاريخ ' . $date)
                    ->line('يرجى الاطلاع على تفاصيل التعهد من خلال حسابكم في النظام.')
                    ->action('عرض التفاصيل', url('/'))
                    ->salutation('مع تحيات إدارة التوجيه والإرشاد');
    }

    public function toArray(object $notifiable): array
    {
        $studentName = $this->pledge->student->user->name ?? 'الطالب';
        $date = $this->pledge->date ? $this->pledge->date->format('Y-m-d') : 'غير محدد';
        
        return [
            'title' => 'تسجيل تعهد',
            'message' => "تم تسجيل تعهد على الطالب {$studentName} بتاريخ {$date}.",
            'pledge_id' => $this->pledge->id,
        ];
    }

    public function toWhatsApp(object $notifiable): string
    {
        $studentName = $this->pledge->student->user->name ?? 'الطالب';
        $date = $this->pledge->date ? $this->pledge->date->format('Y-m-d') : 'غير محدد';
        
        return "المكرم ولي أمر الطالب/ {$studentName}،\nنود إشعاركم بأنه تم تسجيل تعهد سلوكي على الطالب بتاريخ {$date}.\nيرجى الدخول للنظام للاطلاع على التفاصيل.\nمع تحيات إدارة المدرسة.";
    }
}
