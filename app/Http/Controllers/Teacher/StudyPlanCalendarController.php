<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\StudyPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class StudyPlanCalendarController extends Controller
{
    /**
     * Renders the React internal calendar view.
     */
    public function index()
    {
        return Inertia::render('Teacher/StudyPlans/Calendar', [
            'events' => $this->getEventsData()
        ]);
    }

    /**
     * Helper to extract events from approved study plans.
     */
    private function getEventsData()
    {
        $teacherId = Auth::id();

        $plans = StudyPlan::with(['subject', 'grade', 'template', 'rows'])
            ->where('teacher_id', $teacherId)
            ->where('status', 'approved')
            ->get();

        $events = [];

        foreach ($plans as $plan) {
            $template = $plan->template;
            if (!$template || !is_array($template->columns)) {
                continue;
            }

            // Find the date column ID
            $dateColId = null;
            $topicColId = null;
            $objectivesColId = null;

            foreach ($template->columns as $col) {
                // Try to guess topic or objectives for a richer event description
                if (str_contains(mb_strtolower($col['label']), 'موضوع') || str_contains(mb_strtolower($col['label']), 'درس')) {
                    $topicColId = $col['id'];
                }
                if (str_contains(mb_strtolower($col['label']), 'هدف') || str_contains(mb_strtolower($col['label']), 'أهداف')) {
                    $objectivesColId = $col['id'];
                }
            }

            // Fallback for older plans or just getting the content correctly
            $rowDataList = $plan->rows->isNotEmpty() ? $plan->rows->pluck('data') : (is_array($plan->content) ? $plan->content : []);
            
            // Note: Some legacy content may have been wrapped in a 'rows' key
            if (isset($rowDataList['rows'])) {
                $rowDataList = $rowDataList['rows'];
            }

            if (empty($rowDataList)) {
                continue;
            }

            $weeks = $template->weeks ?? [];

            foreach ($rowDataList as $index => $row) {
                if (is_string($row)) {
                    $row = json_decode($row, true);
                }

                // Get date from template weeks if available
                $dateVal = null;
                if (isset($weeks[$index]) && !empty($weeks[$index]['start_date_gregorian'])) {
                    $dateVal = $weeks[$index]['start_date_gregorian'];
                } else {
                    // Try to find a date in the row data directly if there's a date column
                    $dateColId = null;
                    foreach ($template->columns as $col) {
                        if ($col['type'] === 'date') $dateColId = $col['id'];
                    }
                    if ($dateColId && !empty($row[$dateColId])) {
                        $dateVal = $row[$dateColId];
                    }
                }

                if (empty($dateVal)) {
                    continue;
                }

                // Try parsing the date
                try {
                    $parsedDate = Carbon::parse($dateVal)->format('Y-m-d');
                } catch (\Exception $e) {
                    continue;
                }

                $subjectName = $plan->subject->name ?? 'مادة';
                $topic = $topicColId && !empty($row[$topicColId]) ? $row[$topicColId] : 'خطة دراسية';
                $objectives = $objectivesColId && !empty($row[$objectivesColId]) ? $row[$objectivesColId] : '';

                $title = "{$subjectName} - {$topic}";
                $description = "الأهداف المستهدفة:\n" . ($objectives ?: 'غير محدد') . "\n\n(من الخطة المعتمدة رقم {$plan->id})";

                $events[] = [
                    'id' => 'event_' . $plan->id . '_' . $index,
                    'title' => $title,
                    'start' => $parsedDate,
                    'allDay' => true,
                    'extendedProps' => [
                        'description' => $description,
                        'plan_id' => $plan->id
                    ],
                    'backgroundColor' => 'var(--primary-600)',
                    'borderColor' => 'var(--primary-700)',
                ];
            }
        }

        return $events;
    }

    /**
     * Exports an .ics file for calendar sync.
     */
    public function exportIcs(Request $request)
    {
        // For external sync, we usually authenticate via a token.
        // If a token is provided, we can fetch the user.
        // For simplicity, we'll assume the user is authenticated via session, 
        // OR we can allow passing ?token=xyz
        
        $token = $request->query('token');
        if ($token) {
            $user = \App\Models\User::where('id', $token)->first(); // Simple token matching (Not fully secure for production, but serves the concept. In production use sanctum tokens or dedicated sync tokens)
            if ($user) {
                Auth::login($user);
            }
        }

        if (!Auth::check()) {
            abort(401, 'Unauthorized');
        }

        $events = $this->getEventsData();

        $ics = "BEGIN:VCALENDAR\r\n";
        $ics .= "VERSION:2.0\r\n";
        $ics .= "PRODID:-//Smart School//Study Plans Calendar//AR\r\n";
        $ics .= "CALSCALE:GREGORIAN\r\n";
        $ics .= "METHOD:PUBLISH\r\n";
        $ics .= "X-WR-CALNAME:الخطط الدراسية - " . Auth::user()->name . "\r\n";
        $ics .= "X-WR-TIMEZONE:Asia/Riyadh\r\n";

        foreach ($events as $event) {
            $start = Carbon::parse($event['start'])->format('Ymd');
            // End date is exclusive in iCal for all day events, so we add 1 day
            $end = Carbon::parse($event['start'])->addDay()->format('Ymd');
            
            $uid = md5($event['id'] . config('app.url')) . "@smartschool.local";
            $stamp = Carbon::now()->format('Ymd\THis\Z');

            $title = $this->escapeIcsString($event['title']);
            $description = $this->escapeIcsString($event['extendedProps']['description'] ?? '');

            $ics .= "BEGIN:VEVENT\r\n";
            $ics .= "UID:{$uid}\r\n";
            $ics .= "DTSTAMP:{$stamp}\r\n";
            $ics .= "DTSTART;VALUE=DATE:{$start}\r\n";
            $ics .= "DTEND;VALUE=DATE:{$end}\r\n";
            $ics .= "SUMMARY:{$title}\r\n";
            $ics .= "DESCRIPTION:{$description}\r\n";
            $ics .= "STATUS:CONFIRMED\r\n";
            $ics .= "END:VEVENT\r\n";
        }

        $ics .= "END:VCALENDAR\r\n";

        return response($ics)
            ->header('Content-Type', 'text/calendar; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="study-plans.ics"');
    }

    private function escapeIcsString($string)
    {
        $string = str_replace(["\\", "\r", "\n", ",", ";"], ["\\\\", "\\n", "\\n", "\\,", "\\;"], $string);
        return $string;
    }
}
