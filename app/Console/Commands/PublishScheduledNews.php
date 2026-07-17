<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\News;
use App\Services\NotificationService;
use Illuminate\Support\Str;

class PublishScheduledNews extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'news:publish-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish scheduled news and send notifications if urgent';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService)
    {
        $now = now();
        
        // Find news that are scheduled to be published, are 'عاجل', and haven't been notified yet
        $newsToNotify = News::where('is_published', true)
                            ->where('category', 'عاجل')
                            ->where('is_notified', false)
                            ->where('published_at', '<=', $now)
                            ->get();

        foreach ($newsToNotify as $news) {
            $notificationService->sendBroadcastNotification(
                "خبر عاجل: " . $news->title,
                Str::limit(strip_tags($news->content), 100),
                'important', // Type
                $news->author_id, // Sender
                null, // Branch
                'all' // Target Type
            );
            
            $news->update(['is_notified' => true]);
            $this->info("Notified for news ID: {$news->id}");
        }

        $this->info('Checked scheduled news successfully.');
    }
}
