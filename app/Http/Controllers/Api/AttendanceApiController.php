<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class AttendanceApiController extends Controller
{
    /**
     * تسجيل دخول الموظف (Check-In)
     * يتحقق من الموقع الجغرافي ووجود شفت مجدول
     */
    public function checkIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'latitude'    => 'required|numeric|between:-90,90',
            'longitude'   => 'required|numeric|between:-180,180',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $now      = Carbon::now();
        $today    = $now->toDateString();
        $time     = $now->toTimeString();

        // التحقق من عدم وجود تسجيل حضور مسبق لهذا اليوم
        $existing = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->whereNotNull('check_in')
            ->whereNull('check_out')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'لديك تسجيل دخول نشط بالفعل. الرجاء تسجيل الخروج أولاً.',
            ], 422);
        }

        // البحث عن شفت مناسب للموظف في هذا الوقت
        $assignment = \DB::table('branch_employee_shift')
            ->join('shifts', 'branch_employee_shift.shift_id', '=', 'shifts.id')
            ->join('branches', 'branch_employee_shift.branch_id', '=', 'branches.id')
            ->where('branch_employee_shift.employee_id', $employee->id)
            ->where('shifts.is_active', true)
            ->select(
                'branch_employee_shift.branch_id',
                'branch_employee_shift.shift_id',
                'shifts.start_time',
                'shifts.end_time',
                'shifts.grace_period_minutes',
                'branches.latitude',
                'branches.longitude',
                'branches.radius_meters',
                'branches.name as branch_name',
                'shifts.name as shift_name',
            )
            ->get();

        if ($assignment->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد شفت مجدول لك. الرجاء التواصل مع الموارد البشرية.',
            ], 422);
        }

        // إيجاد أقرب فرع ضمن النطاق الجغرافي
        $validAssignment = null;
        foreach ($assignment as $asgn) {
            $branch = new Branch(['latitude' => $asgn->latitude, 'longitude' => $asgn->longitude, 'radius_meters' => $asgn->radius_meters]);
            if ($branch->isWithinRadius($validated['latitude'], $validated['longitude'])) {
                $validAssignment = $asgn;
                break;
            }
        }

        if (!$validAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'أنت خارج النطاق الجغرافي لفرعك. تأكد من وجودك داخل المبنى.',
            ], 422);
        }

        // حساب التأخير
        $shiftStart     = Carbon::parse($today . ' ' . $validAssignment->start_time);
        $gracePeriodEnd = $shiftStart->copy()->addMinutes($validAssignment->grace_period_minutes);
        $lateMinutes    = 0;
        $status         = 'present';

        if ($now->gt($gracePeriodEnd)) {
            $lateMinutes = (int) $now->diffInMinutes($shiftStart);
            $status      = 'late';
        }

        // تسجيل الحضور
        $attendance = Attendance::create([
            'employee_id'  => $employee->id,
            'branch_id'    => $validAssignment->branch_id,
            'shift_id'     => $validAssignment->shift_id,
            'date'         => $today,
            'check_in'     => $time,
            'check_in_lat' => $validated['latitude'],
            'check_in_lng' => $validated['longitude'],
            'status'       => $status,
            'late_minutes' => $lateMinutes,
        ]);

        return response()->json([
            'success'     => true,
            'message'     => $status === 'late'
                ? "تم تسجيل حضورك بنجاح - متأخر {$lateMinutes} دقيقة"
                : 'تم تسجيل حضورك بنجاح في الوقت المحدد',
            'data'        => [
                'attendance_id' => $attendance->id,
                'check_in'      => $time,
                'branch'        => $validAssignment->branch_name,
                'shift'         => $validAssignment->shift_name,
                'status'        => $status,
                'late_minutes'  => $lateMinutes,
            ],
        ]);
    }

    /**
     * تسجيل خروج الموظف (Check-Out)
     */
    public function checkOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'latitude'    => 'required|numeric|between:-90,90',
            'longitude'   => 'required|numeric|between:-180,180',
        ]);

        $today = Carbon::now()->toDateString();
        $time  = Carbon::now()->toTimeString();

        $attendance = Attendance::where('employee_id', $validated['employee_id'])
            ->where('date', $today)
            ->whereNotNull('check_in')
            ->whereNull('check_out')
            ->latest()
            ->first();

        if (!$attendance) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد تسجيل دخول نشط لهذا اليوم.',
            ], 422);
        }

        $attendance->update([
            'check_out'     => $time,
            'check_out_lat' => $validated['latitude'],
            'check_out_lng' => $validated['longitude'],
        ]);

        $checkIn  = Carbon::parse($today . ' ' . $attendance->check_in);
        $checkOut = Carbon::parse($today . ' ' . $time);
        $duration = $checkIn->diffInMinutes($checkOut);
        $hours    = floor($duration / 60);
        $minutes  = $duration % 60;

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل انصرافك بنجاح',
            'data'    => [
                'check_out'         => $time,
                'total_duration'    => "{$hours}س {$minutes}د",
                'total_minutes'     => $duration,
            ],
        ]);
    }

    /**
     * جلب تقرير حضور موظف لشهر محدد
     */
    public function employeeReport(Request $request, int $employeeId): JsonResponse
    {
        $month = $request->get('month', Carbon::now()->month);
        $year  = $request->get('year', Carbon::now()->year);

        $records = Attendance::where('employee_id', $employeeId)
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->with(['branch:id,name', 'shift:id,name,start_time,end_time'])
            ->orderBy('date')
            ->get();

        $summary = [
            'present' => $records->where('status', 'present')->count(),
            'late'    => $records->where('status', 'late')->count(),
            'absent'  => $records->where('status', 'absent')->count(),
            'excused' => $records->where('status', 'excused')->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => [
                'records' => $records,
                'summary' => $summary,
            ],
        ]);
    }
}
