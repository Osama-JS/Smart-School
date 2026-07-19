<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MasterTimetable;
use App\Models\FollowupBook;
use Carbon\Carbon;

class GenerateExpectedFollowups extends Command
{
    protected $signature = 'followup:generate-expected {--date=}';
    protected $description = 'Pre-generate empty followup book records for the given date (defaults to today) based on the Master Timetable.';

    public function handle()
    {
        $dateStr = $this->option('date');
        $date = $dateStr ? Carbon::parse($dateStr) : now();
        $dayOfWeek = strtolower($date->format('l'));

        $this->info("Generating expected followups for {$date->format('Y-m-d')} ($dayOfWeek)...");

        $timetables = MasterTimetable::with(['teacher'])->get();

        $count = 0;
        foreach ($timetables as $tt) {
            if (strtolower($tt->day_of_week) !== $dayOfWeek) {
                continue;
            }

            // We only need one followup per subject per division per day
            $followup = FollowupBook::firstOrCreate([
                'teacher_id' => $tt->teacher_id,
                'subject_id' => $tt->subject_id,
                'division_id' => $tt->division_id,
                'date' => $date->format('Y-m-d'),
            ], [
                // Set default fields, uploaded_at is null
                'branch_id' => $tt->teacher->branch_id ?? null,
                'upload_source' => 'dashboard', 
            ]);

            if ($followup->wasRecentlyCreated) {
                $count++;
            }
        }

        $this->info("Generated $count expected followup records.");
    }
}
