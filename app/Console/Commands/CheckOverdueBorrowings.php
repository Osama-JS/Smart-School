<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Borrowing;
use App\Notifications\OverdueBorrowingNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CheckOverdueBorrowings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'library:check-overdue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for overdue library borrowings, mark them as overdue, and notify students';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting overdue borrowings check...');
        
        // Find all borrowings where status is 'borrowed' and due_date has passed
        $overdueBorrowings = Borrowing::with(['student', 'book'])
            ->where('status', 'borrowed')
            ->where('due_date', '<', Carbon::today())
            ->get();

        if ($overdueBorrowings->isEmpty()) {
            $this->info('No new overdue borrowings found.');
            return;
        }

        $count = 0;
        foreach ($overdueBorrowings as $borrowing) {
            // Update the status
            $borrowing->status = 'overdue';
            $borrowing->save();

            // Notify the student
            if ($borrowing->student) {
                $borrowing->student->notify(new OverdueBorrowingNotification($borrowing));
            }

            $count++;
        }

        Log::info("Library: Checked and marked {$count} borrowings as overdue.");
        $this->info("Successfully processed {$count} overdue borrowings.");
    }
}
