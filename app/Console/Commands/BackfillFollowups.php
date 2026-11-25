<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AcademicYear;
use App\Models\FollowupBook;
use App\Models\MasterTimetable;
use App\Models\Semester;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class BackfillFollowups extends Command
{
    protected $signature = 'followup:backfill {--start=} {--end=}';
    protected $description = 'Backfill expected followup records for past dates based on current timetable.';

    public function handle()
    {
        $startStr = $this->option('start');
        $endStr = $this->option('end');

        if (!$startStr) {
            // Default to start of current week
            $start = now()->startOfWeek(Carbon::SUNDAY);
        } else {
            $start = Carbon::parse($startStr);
        }

        $end = $endStr ? Carbon::parse($endStr) : now();
        $period = CarbonPeriod::create($start, $end);
        $activeYearId = AcademicYear::where('is_active', true)->value('id');
        $activeSemester = Semester::where('is_active', true)->first();

        $this->info("Backfilling expected followups from {$start->format('Y-m-d')} to {$end->format('Y-m-d')}...");

        $timetables = MasterTimetable::with(['teacher'])
            ->when($activeSemester, fn ($q) => $q->where('semester_id', $activeSemester->id))
            ->get();

        $count = 0;
        foreach ($period as $date) {
            $englishDay = $date->format('l');

            $dailyLessons = $timetables->filter(function ($tt) use ($englishDay) {
                return FollowupBook::matchesDayOfWeek($tt->day_of_week, $englishDay);
            });

            foreach ($dailyLessons as $tt) {
                $followup = FollowupBook::firstOrCreate([
                    'teacher_id' => $tt->teacher_id,
                    'subject_id' => $tt->subject_id,
                    'division_id' => $tt->division_id,
                    'date' => $date->format('Y-m-d'),
                ], [
                    'branch_id' => $tt->teacher->branch_id ?? null,
                    'academic_year_id' => $activeYearId,
                    'upload_source' => 'dashboard',
                ]);

                if ($followup->wasRecentlyCreated) {
                    $count++;
                }
            }
        }

        $this->info("Backfilled $count expected followup records.");
    }
}
