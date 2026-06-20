<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class SystemNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $title;
    public $messageText;
    public $actionText;
    public $actionUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, $title, $messageText, $actionText = null, $actionUrl = null)
    {
        $this->user = $user;
        $this->title = $title;
        $this->messageText = $messageText;
        $this->actionText = $actionText;
        $this->actionUrl = $actionUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->title,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.system_notification',
            with: [
                'user' => $this->user,
                'title' => $this->title,
                'messageText' => $this->messageText,
                'actionText' => $this->actionText,
                'actionUrl' => $this->actionUrl,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
