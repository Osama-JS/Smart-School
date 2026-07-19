<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\FollowupBook;
use App\Models\MasterTimetable;
use App\Models\Notification;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class FollowupWeeklyReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'followup:weekly-reports';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a weekly report of negligent teachers and notify supervisors.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Generating weekly followup report...");

        $startOfWeek = now()->startOfWeek(Carbon::SUNDAY);
        $endOfWeek = now()->endOfWeek(Carbon::THURSDAY);
        
        $period = CarbonPeriod::create($startOfWeek, $endOfWeek);
        $daysInPeriod = [];
        foreach ($period as $date) {
            $daysInPeriod[] = strtolower($date->format('l'));
        }

        $teachers = User::whereHas('role', function ($query) {
                $query->where('name', 'معلم');
            })->where('is_active', true)->get();

        $negligentTeachers = [];

        foreach ($teachers as $teacher) {
            $followups = FollowupBook::where('teacher_id', $teacher->id)
                ->whereBetween('date', [$startOfWeek, $endOfWeek])
                ->get();

            $expectedLessons = $followups->count();

            if ($expectedLessons === 0) {
                continue;
            }

            $uploads = $followups->whereNotNull('uploaded_at')->count();

            $negligence = max(0, $expectedLessons - $uploads);

            if ($negligence > 0) {
                $negligentTeachers[] = [
                    'name' => $teacher->name,
                    'negligence' => $negligence
                ];
            }
        }

        if (count($negligentTeachers) === 0) {
            $this->info("No negligent teachers this week. Excellent!");
            return;
        }

        // Sort by negligence descending
        usort($negligentTeachers, function($a, $b) {
            return $b['negligence'] <=> $a['negligence'];
        });

        // Take top 5 for the message
        $topNegligent = array_slice($negligentTeachers, 0, 5);
        $messageLines = ["نلفت انتباهكم بوجود بعض التقصير في رفع دفاتر المتابعة لهذا الأسبوع، وأبرز المقصرين هم:"];
        foreach ($topNegligent as $t) {
            $messageLines[] = "- {$t['name']} (تقصير في {$t['negligence']} حصة)";
        }
        if (count($negligentTeachers) > 5) {
            $messageLines[] = "... وغيرهم.";
        }
        $messageLines[] = "يرجى مراجعة صفحة إدارة دفاتر المتابعة لمزيد من التفاصيل.";

        $message = implode("\n", $messageLines);

        // Notify Supervisors and Admins
        Notification::create([
            'user_id' => null,
            'sender_id' => null,
            'branch_id' => null,
            'title' => 'التقرير الأسبوعي: المعلمون المقصرون في دفاتر المتابعة',
            'message' => $message,
            'type' => 'system',
            'target_type' => 'roles',
            'target_role' => ['مشرف تربوي', 'مدير النظام', 'مدير الفرع'],
            'is_read' => false
        ]);

        $this->info("Weekly report generated and supervisors notified.");
    }
}
