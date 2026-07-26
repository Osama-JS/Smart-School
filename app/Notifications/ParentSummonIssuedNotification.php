<?php

namespace App\Notifications;

use App\Models\ParentSummon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Channels\WhatsAppChannel;

class ParentSummonIssuedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $summon;

    public function __construct(ParentSummon $summon)
    {
        $this->summon = $summon;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail', WhatsAppChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $studentName = $this->summon->student->user->name ?? 'الطالب';
        $date = $this->summon->summon_date ? $this->summon->summon_date->format('Y-m-d') : 'غير محدد';
        $reason = $this->summon->reason ?? 'مراجعة الإدارة';
        
        return (new MailMessage)
                    ->subject('إشعار استدعاء ولي أمر - ' . config('app.name'))
                    ->greeting('المكرم ولي أمر الطالب / ' . $studentName)
                    ->line('نأمل منكم التكرم بزيارة إدارة المدرسة يوم ' . $date)
                    ->line('السبب: ' . $reason)
                    ->line('نظراً لأهمية الأمر، نرجو عدم التأخر.')
                    ->action('عرض التفاصيل في النظام', url('/'))
                    ->salutation('مع تحيات إدارة التوجيه والإرشاد');
    }

    public function toArray(object $notifiable): array
    {
        $studentName = $this->summon->student->user->name ?? 'الطالب';
        $date = $this->summon->summon_date ? $this->summon->summon_date->format('Y-m-d') : 'غير محدد';
        $reason = $this->summon->reason ?? 'مراجعة الإدارة';
        
        return [
            'title' => 'استدعاء ولي أمر',
            'message' => "نأمل زيارة المدرسة يوم {$date} بخصوص الطالب {$studentName}.",
            'summon_id' => $this->summon->id,
        ];
    }

    public function toWhatsApp(object $notifiable): string
    {
        $studentName = $this->summon->student->user->name ?? 'الطالب';
        $date = $this->summon->summon_date ? $this->summon->summon_date->format('Y-m-d') : 'غير محدد';
        $reason = $this->summon->reason ?? 'مراجعة الإدارة';
        
        return "المكرم ولي أمر الطالب/ {$studentName}،\nنأمل منكم التكرم بزيارة المدرسة يوم {$date} لمناقشة وضع الطالب.\nسبب الاستدعاء: {$reason}\nمع تحيات إدارة المدرسة.";
    }
}
