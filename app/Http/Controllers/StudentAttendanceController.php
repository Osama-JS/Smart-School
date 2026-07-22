<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AttendanceLog;
use App\Models\ClassAttendance;
use App\Models\Division;

class StudentAttendanceController extends Controller
{
    /**
     * تقارير الغياب اليومي للمدرسة
     */
    public function index(Request $request)
    {
        $query = AttendanceLog::with('user')
            ->whereHas('user.role', function($q) {
                $q->where('name', 'طالب');
            });

        if ($request->filled('date')) {
            $query->whereDate('attendance_date', $request->date);
        } else {
            $query->whereDate('attendance_date', today());
        }

        $logs = $query->paginate(20);

        return Inertia::render('Academic/Attendances/Index', [
            'logs' => $logs,
            'filters' => $request->only(['date']),
        ]);
    }

    /**
     * تقارير الغياب التفصيلية في الحصص
     */
    public function classReports(Request $request)
    {
        $query = ClassAttendance::with(['student', 'division', 'subject', 'period', 'teacher']);

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        } else {
            $query->whereDate('date', today());
        }

        if ($request->filled('division_id')) {
            $query->where('division_id', $request->division_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $attendances = $query->paginate(20);
        $divisions = Division::with('grade')->get();

        return Inertia::render('Academic/Attendances/ClassReports', [
            'attendances' => $attendances,
            'divisions' => $divisions,
            'filters' => $request->only(['date', 'division_id', 'status']),
        ]);
    }
}
