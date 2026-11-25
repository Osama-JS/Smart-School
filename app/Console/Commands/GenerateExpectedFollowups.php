<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AcademicYear;
use App\Models\FollowupBook;
use App\Models\MasterTimetable;
use App\Models\Semester;
use Carbon\Carbon;

class GenerateExpectedFollowups extends Command
{
    protected $signature = 'followup:generate-expected {--date=}';
    protected $description = 'Pre-generate empty followup book records for the given date (defaults to today) based on the Master Timetable.';

    public function handle()
    {
        $dateStr = $this->option('date');
        $date = $dateStr ? Carbon::parse($dateStr) : now();
        $englishDay = $date->format('l');
        $activeYearId = AcademicYear::where('is_active', true)->value('id');
        $activeSemester = Semester::where('is_active', true)->first();

        $this->info("Generating expected followups for {$date->format('Y-m-d')} ($englishDay)...");

        $timetables = MasterTimetable::with(['teacher'])
            ->when($activeSemester, fn ($q) => $q->where('semester_id', $activeSemester->id))
            ->get();

        $count = 0;
        foreach ($timetables as $tt) {
            if (!FollowupBook::matchesDayOfWeek($tt->day_of_week, $englishDay)) {
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
                'academic_year_id' => $activeYearId,
                'upload_source' => 'dashboard',
            ]);

            if ($followup->wasRecentlyCreated) {
                $count++;
            }
        }

        $this->info("Generated $count expected followup records.");
    }
}
