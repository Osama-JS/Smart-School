<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ExamSchedule;
use App\Models\Student;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;

class ExamScheduleController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Find if user is a student
        $student = Student::where('user_id', $user->id)->first();
        
        $divisionIds = [];
        
        if ($student) {
            // Get active enrollments for this student
            $divisionIds = Enrollment::where('student_id', $student->id)
                ->pluck('division_id')
                ->toArray();
        } else {
            // Fallback for testing: if user is not a student (e.g., admin), 
            // maybe they want to view the page. Let's pass an empty array, 
            // or if requested, we could pass a specific division.
            // For now, we leave it empty, and the UI will show "No schedule assigned".
        }

        if (empty($divisionIds)) {
            $schedules = collect([]);
        } else {
            // Get schedules that contain items for these divisions
            $schedules = ExamSchedule::with(['period.semester.academicYear', 'items' => function($query) use ($divisionIds) {
                $query->whereIn('division_id', $divisionIds)
                      ->with(['subject', 'division.grade'])->orderBy('exam_date');
            }])
            ->whereHas('items', function($query) use ($divisionIds) {
                $query->whereIn('division_id', $divisionIds);
            })
            ->latest()
            ->get();
        }

        return Inertia::render('Student/MyExamSchedule', [
            'schedules' => $schedules,
            'isStudent' => $student ? true : false,
        ]);
    }

    public function exportIcs(Request $request, ExamSchedule $examSchedule)
    {
        $user = auth()->user();
        $student = Student::where('user_id', $user->id)->first();
        
        $divisionIds = [];
        if ($student) {
            $divisionIds = Enrollment::where('student_id', $student->id)->pluck('division_id')->toArray();
        }

        if (empty($divisionIds)) {
            // Return empty if no divisions
            $examSchedule->setRelation('items', collect([]));
        } else {
            $examSchedule->load(['items' => function($query) use ($divisionIds) {
                $query->whereIn('division_id', $divisionIds)
                      ->with(['subject', 'division.grade'])->orderBy('exam_date')->orderBy('start_time');
            }]);
        }

        $ics = "BEGIN:VCALENDAR\r\n";
        $ics .= "VERSION:2.0\r\n";
        $ics .= "PRODID:-//Smart School//Exam Schedule//AR\r\n";
        $ics .= "CALSCALE:GREGORIAN\r\n";
        $ics .= "METHOD:PUBLISH\r\n";
        $ics .= "X-WR-CALNAME:جدول الاختبارات - {$examSchedule->title}\r\n";
        $ics .= "X-WR-TIMEZONE:Asia/Riyadh\r\n";

        foreach ($examSchedule->items as $item) {
            $startDate = \Carbon\Carbon::parse($item->exam_date);
            if ($item->start_time) {
                $startTime = explode(':', $item->start_time);
                $startDate->setHour($startTime[0])->setMinute($startTime[1]);
            } else {
                $startDate->setHour(8)->setMinute(0); // Default to 8 AM
            }

            $endDate = clone $startDate;
            if ($item->end_time) {
                $endTime = explode(':', $item->end_time);
                $endDate->setHour($endTime[0])->setMinute($endTime[1]);
            } else {
                $endDate->addHours(1)->addMinutes(30); // Default 1.5 hours
            }

            $uid = md5($item->id . time()) . "@smartschool.com";
            $dtStamp = gmdate('Ymd\THis\Z');
            $dtStart = gmdate('Ymd\THis\Z', $startDate->timestamp);
            $dtEnd = gmdate('Ymd\THis\Z', $endDate->timestamp);

            $subject = $item->subject ? $item->subject->name : 'اختبار مادة';
            $room = $item->room ? "القاعة: {$item->room}" : "القاعة: غير محدد";
            $syllabus = $item->syllabus ? "المقرر: {$item->syllabus}" : "";
            
            $description = "{$room}\\n{$syllabus}";
            $description = str_replace(["\r", "\n"], ["", "\\n"], $description); // Clean up for ICS format

            $ics .= "BEGIN:VEVENT\r\n";
            $ics .= "UID:{$uid}\r\n";
            $ics .= "DTSTAMP:{$dtStamp}\r\n";
            $ics .= "DTSTART:{$dtStart}\r\n";
            $ics .= "DTEND:{$dtEnd}\r\n";
            $ics .= "SUMMARY:اختبار {$subject}\r\n";
            $ics .= "DESCRIPTION:{$description}\r\n";
            $ics .= "END:VEVENT\r\n";
        }

        $ics .= "END:VCALENDAR\r\n";

        $filename = "exam_schedule_" . date('Ymd_Hi') . ".ics";

        return Response::make($ics, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function printSchedule(Request $request, ExamSchedule $examSchedule)
    {
        $user = auth()->user();
        $student = Student::where('user_id', $user->id)->first();
        
        $divisionIds = [];
        if ($student) {
            $divisionIds = Enrollment::where('student_id', $student->id)->pluck('division_id')->toArray();
        }

        if (empty($divisionIds)) {
            $examSchedule->load(['period.semester.academicYear']);
            $examSchedule->setRelation('items', collect([]));
        } else {
            $examSchedule->load(['period.semester.academicYear', 'items' => function($query) use ($divisionIds) {
                $query->whereIn('division_id', $divisionIds)
                      ->with(['subject', 'division.grade'])->orderBy('exam_date')->orderBy('start_time');
            }]);
        }

        return Inertia::render('Student/PrintExamSchedule', [
            'examSchedule' => $examSchedule,
            'student' => $student,
        ]);
    }
}
