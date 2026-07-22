<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ExamSchedule;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExamScheduleController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Find if user is an employee (teacher)
        $employee = Employee::where('user_id', $user->id)->first();
        
        $isTeacher = $employee ? true : false;

        if (!$isTeacher) {
            return Inertia::render('Teacher/MyExamSchedules', [
                'schedules' => collect([]),
                'isTeacher' => false,
            ]);
        }

        // Fetch the schedules that have items where the user is assigned as a proctor.
        $schedules = ExamSchedule::with([
            'period.semester.academicYear',
            'items' => function($query) use ($user) {
                // Load only items where the user is a proctor
                $query->with(['subject', 'division.grade', 'proctors'])
                      ->whereHas('proctors', function($q) use ($user) {
                          $q->where('users.id', $user->id);
                      })
                      ->orderBy('exam_date')
                      ->orderBy('start_time');
            }
        ])
        // Only get schedules where the teacher is a proctor in AT LEAST ONE item
        ->whereHas('items.proctors', function($query) use ($user) {
            $query->where('users.id', $user->id);
        })
        ->latest()
        ->get();

        return Inertia::render('Teacher/MyExamSchedules', [
            'schedules' => $schedules,
            'isTeacher' => true,
        ]);
    }

    public function print(ExamSchedule $examSchedule, Request $request)
    {
        $user = auth()->user();
        
        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            abort(403);
        }

        // Validate the teacher is actually a proctor in this schedule
        $isProctorInSchedule = $examSchedule->items()->whereHas('proctors', function($query) use ($user) {
            $query->where('users.id', $user->id);
        })->exists();

        if (!$isProctorInSchedule) {
            abort(403, 'غير مصرح لك باستعراض أو طباعة هذا الجدول لعدم وجودك ضمن المراقبين.');
        }

        $examSchedule->load([
            'period.semester.academicYear',
            'items' => function($query) use ($user) {
                // Load items where the user is a proctor
                $query->with(['subject', 'division.grade', 'proctors'])
                      ->whereHas('proctors', function($q) use ($user) {
                          $q->where('users.id', $user->id);
                      })
                      ->orderBy('exam_date')
                      ->orderBy('start_time');
            }
        ]);

        return Inertia::render('Teacher/PrintMyExamSchedule', [
            'schedule' => $examSchedule,
        ]);
    }
}
