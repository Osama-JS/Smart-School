<?php

namespace App\Notifications;

use App\Models\Borrowing;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OverdueBorrowingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $borrowing;

    /**
     * Create a new notification instance.
     */
    public function __construct(Borrowing $borrowing)
    {
        $this->borrowing = $borrowing;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // For now, we will send this to the database.
        // It can be expanded to ['mail', 'database'] later if email is configured.
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('تنبيه: تأخر إرجاع كتاب')
                    ->greeting("مرحباً {$notifiable->name}،")
                    ->line("نود تذكيرك بأن موعد إرجاع كتاب ({$this->borrowing->book->title}) قد انتهى.")
                    ->line("تاريخ الاستحقاق كان في: " . \Carbon\Carbon::parse($this->borrowing->due_date)->format('Y-m-d'))
                    ->line('نرجو منك إرجاع الكتاب للمكتبة في أقرب وقت ممكن لتجنب أي غرامات.')
                    ->action('عرض استعاراتي', url('/academic/library/borrowings'))
                    ->line('شكراً لتعاونك!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'borrowing_id' => $this->borrowing->id,
            'book_title' => $this->borrowing->book->title,
            'due_date' => $this->borrowing->due_date,
            'message' => "تأخر إرجاع كتاب: {$this->borrowing->book->title}",
            'type' => 'library_overdue'
        ];
    }
}
