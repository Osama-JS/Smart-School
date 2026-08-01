<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MasterTimetable;

use App\Traits\ResolvesStudent;

class MyTimetableController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        [$student, $children] = $this->resolveStudent($request);
        
        if (!$student) {
            return Inertia::render('Student/Timetable/Index', [
                'timetable' => [],
                'children' => $children,
                'activeChildId' => null,
            ]);
        }
        $currentEnrollment = $student->currentEnrollment()->with('division.grade.section')->first();
        
        $timetable = collect();
        if ($currentEnrollment && $currentEnrollment->division_id) {
            $daysMap = [
                'Sunday' => 'الأحد',
                'Monday' => 'الإثنين',
                'Tuesday' => 'الثلاثاء',
                'Wednesday' => 'الأربعاء',
                'Thursday' => 'الخميس',
                'Friday' => 'الجمعة',
                'Saturday' => 'السبت',
            ];
            
            $timetable = MasterTimetable::with(['period', 'subject', 'teacher'])
                ->where('division_id', $currentEnrollment->division_id)
                ->get()
                ->groupBy(function($item) use ($daysMap) {
                    return $daysMap[$item->day_of_week] ?? $item->day_of_week;
                });
        }

        return Inertia::render('Student/Timetable/Index', [
            'timetable' => $timetable,
            'enrollment' => $currentEnrollment,
            'children' => $children,
            'activeChildId' => $student->id,
        ]);
    }
}
