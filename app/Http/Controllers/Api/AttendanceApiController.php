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
     * جلب شفتات اليوم للموظف
     */
    public function getTodayShifts(Request $request): JsonResponse
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'غير مرتبط بحساب موظف'], 403);
        }

        $todayDayOfWeek = Carbon::now()->dayOfWeek; // 0=Sun, 6=Sat

        $shifts = \DB::table('branch_employee_shift')
            ->join('shifts', 'branch_employee_shift.shift_id', '=', 'shifts.id')
            ->join('branches', 'branch_employee_shift.branch_id', '=', 'branches.id')
            ->where('branch_employee_shift.employee_id', $employee->id)
            ->where('shifts.is_active', true)
            ->select(
                'shifts.id as shift_id',
                'shifts.name as shift_name',
                'shifts.start_time',
                'shifts.end_time',
                'shifts.grace_period_minutes',
                'branches.name as branch_name',
                'branches.id as branch_id',
                'branches.latitude as branch_latitude',
                'branches.longitude as branch_longitude',
                'branches.radius_meters as branch_radius',
                'branch_employee_shift.working_days',
            )
            ->get()
            ->map(function ($shift) use ($todayDayOfWeek) {
                $workingDays = json_decode($shift->working_days ?? '[]', true);
                // true = يوم دوام رسمي, false = سيُسجَّل كحضور إضافي
                $shift->is_working_day = empty($workingDays) || in_array($todayDayOfWeek, $workingDays);
                unset($shift->working_days); // لا ترسل الـ JSON الخام للتطبيق
                return $shift;
            });

        return response()->json([
            'success' => true,
            'data' => $shifts
        ]);
    }
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
            'shift_id'    => 'required|exists:shifts,id',
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
            ->where('branch_employee_shift.shift_id', $validated['shift_id'])
            ->where('shifts.is_active', true)
            ->select(
                'branch_employee_shift.branch_id',
                'branch_employee_shift.shift_id',
                'branch_employee_shift.working_days',
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

        // ① التحقق أن وقت الشفت لم ينتهِ بعد — لا يمكن تسجيل حضور بعد انتهاء الشفت
        $shiftEnd = Carbon::parse($today . ' ' . $validAssignment->end_time);
        if ($now->gt($shiftEnd)) {
            $diffMins = $now->diffInMinutes($shiftEnd);
            return response()->json([
                'success' => false,
                'message' => "لا يمكن تسجيل الحضور. انتهى وقت الشفت منذ {$diffMins} دقيقة.",
            ], 422);
        }

        // ② حساب التأخير من نهاية وقت السماح (وليس من بداية الشفت)
        $shiftStart     = Carbon::parse($today . ' ' . $validAssignment->start_time);
        $gracePeriodEnd = $shiftStart->copy()->addMinutes($validAssignment->grace_period_minutes ?? 0);
        $lateMinutes    = 0;

        // ③ تحديد الحالة: إضافي إذا ليس يوم دوام، متأخر، أو حاضر
        $workingDays    = json_decode($validAssignment->working_days ?? '[]', true);
        $todayDayOfWeek = $now->dayOfWeek; // 0=Sun ... 6=Sat
        $isWorkingDay   = empty($workingDays) || in_array($todayDayOfWeek, $workingDays);

        if (!$isWorkingDay) {
            // حضور في يوم غير رسمي — يُسجَّل كحضور إضافي
            $status = 'extra';
        } elseif ($now->gt($gracePeriodEnd)) {
            // تجاوز وقت السماح — متأخر
            $lateMinutes = (int) $now->diffInMinutes($gracePeriodEnd);
            $status      = 'late';
        } else {
            // داخل وقت السماح — حاضر في الوقت
            $status = 'present';
        }

        $activeYear = \App\Models\AcademicYear::currentForBranch($validAssignment->branch_id);
        $activeSemester = $activeYear ? $activeYear->activeSemester : null;

        // تسجيل الحضور
        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'date'        => $today,
            ],
            [
                'branch_id'        => $validAssignment->branch_id,
                'shift_id'         => $validAssignment->shift_id,
                'academic_year_id' => $activeYear ? $activeYear->id : null,
                'semester_id'      => $activeSemester ? $activeSemester->id : null,
                'check_in'         => $time,
                'check_in_lat'     => $validated['latitude'],
                'check_in_lng'     => $validated['longitude'],
                'status'           => $status,
                'late_minutes'     => $lateMinutes,
            ]
        );

        $message = match ($status) {
            'extra'   => 'تم تسجيل حضورك بنجاح — حضور إضافي (يوم غير رسمي)',
            'late'    => "تم تسجيل حضورك بنجاح — متأخر {$lateMinutes} دقيقة",
            default   => 'تم تسجيل حضورك بنجاح في الوقت المحدد',
        };

        return response()->json([
            'success'  => true,
            'message'  => $message,
            'data'     => [
                'attendance_id'  => $attendance->id,
                'check_in'       => $time,
                'branch'         => $validAssignment->branch_name,
                'shift'          => $validAssignment->shift_name,
                'status'         => $status,
                'late_minutes'   => $lateMinutes,
                'is_working_day' => $isWorkingDay,
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

        // ④ التحقق الجغرافي عند الانصراف
        $branch = $attendance->branch;
        if ($branch && $branch->latitude && $branch->longitude) {
            if (!$branch->isWithinRadius($validated['latitude'], $validated['longitude'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'أنت خارج النطاق الجغرافي لفرعك. يجب أن تكون داخل المبنى لتسجيل الانصراف.',
                ], 422);
            }
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
     * جلب تقرير حضور موظف لشهر محدد (مع دعم الشفتات المتعددة والإجازات والعطلات)
     */
    public function employeeReport(Request $request, int $employeeId): JsonResponse
    {
        $monthNum = (int) $request->get('month', Carbon::now()->month);
        $yearNum  = (int) $request->get('year', Carbon::now()->year);
        $semesterId = $request->get('semester_id');
        $filterShiftId = $request->get('shift_id');
        
        $month = Carbon::createFromDate($yearNum, $monthNum, 1)->startOfDay();
        $daysInMonth = $month->daysInMonth;

        $employee = Employee::with(['shifts', 'user'])->findOrFail($employeeId);
        $semester = $semesterId ? \App\Models\Semester::find($semesterId) : null;

        // 1. Get all assigned shifts for employee with working days
        $employeeShifts = \DB::table('branch_employee_shift')
            ->join('shifts', 'branch_employee_shift.shift_id', '=', 'shifts.id')
            ->join('branches', 'branch_employee_shift.branch_id', '=', 'branches.id')
            ->where('branch_employee_shift.employee_id', $employee->id)
            ->where('shifts.is_active', true)
            ->select(
                'shifts.id as shift_id',
                'shifts.name as shift_name',
                'shifts.start_time',
                'shifts.end_time',
                'shifts.grace_period_minutes',
                'branches.id as branch_id',
                'branches.name as branch_name',
                'branch_employee_shift.working_days'
            )
            ->get()
            ->map(function ($s) {
                $days = json_decode($s->working_days ?? '[]', true);
                $s->working_days = (is_array($days) && !empty($days)) ? $days : [0, 1, 2, 3, 4];
                return $s;
            });

        // 2. Get actual attendance records grouped by date
        $attendancesQuery = Attendance::where('employee_id', $employeeId)
            ->whereMonth('date', $monthNum)
            ->whereYear('date', $yearNum)
            ->with(['branch:id,name', 'shift:id,name,start_time,end_time']);

        if ($filterShiftId) {
            $attendancesQuery->where('shift_id', $filterShiftId);
        }

        $actualAttendances = $attendancesQuery->get()
            ->groupBy(fn($item) => $item->date->format('Y-m-d'));

        // 3. Get Leaves
        $monthStart = Carbon::createFromDate($yearNum, $monthNum, 1)->startOfMonth();
        $monthEnd = Carbon::createFromDate($yearNum, $monthNum, 1)->endOfMonth();

        $leaves = \App\Models\Leave::with('leaveType')
            ->where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->where(function($q) use ($monthStart, $monthEnd) {
                $q->where('start_date', '<=', $monthEnd)
                  ->where('end_date', '>=', $monthStart);
            })
            ->get();

        // 4. Get Holidays
        $branchId = $employee->user ? $employee->user->branch_id : null;
        $holidays = \App\Models\Holiday::where(function($q) use ($branchId) {
                if ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                } else {
                    $q->whereNull('branch_id');
                }
            })
            ->where(function($q) use ($monthNum, $yearNum) {
                $q->whereMonth('start_date', $monthNum)->whereYear('start_date', $yearNum)
                  ->orWhereMonth('end_date', $monthNum)->whereYear('end_date', $yearNum);
            })
            ->get();

        $todayDate = Carbon::now()->startOfDay();
        $records = [];
        $summary = [
            'present' => 0,
            'late' => 0,
            'absent' => 0,
            'excused' => 0,
            'leave' => 0,
            'holiday' => 0,
            'weekend' => 0,
            'future' => 0,
            'partial' => 0,
            'extra' => 0,
            'total_shifts_scheduled' => 0,
            'total_shifts_attended' => 0,
            'total_late_minutes' => 0,
        ];

        for ($d = 1; $d <= $daysInMonth; $d++) {
            $currentDate = clone $month;
            $currentDate->day($d);
            $dateString = $currentDate->toDateString();
            $dayOfWeek = $currentDate->dayOfWeek; // 0=Sun, 6=Sat

            // Check Holiday
            $isHoliday = false;
            $holidayName = '';
            foreach ($holidays as $h) {
                if ($currentDate->between($h->start_date, $h->end_date)) {
                    $isHoliday = true;
                    $holidayName = $h->name;
                    break;
                }
            }

            // Check Leave
            $isLeave = false;
            $leaveType = '';
            foreach ($leaves as $l) {
                if ($currentDate->between($l->start_date, $l->end_date)) {
                    $isLeave = true;
                    $leaveType = $l->leaveType ? $l->leaveType->name : 'إجازة';
                    break;
                }
            }

            // Check Term bounds
            $isOutOfTerm = false;
            if ($semester) {
                if ($currentDate->isBefore($semester->start_date) || $currentDate->isAfter($semester->end_date)) {
                    $isOutOfTerm = true;
                }
            }

            $dayAttendances = $actualAttendances->get($dateString, collect());
            $isFuture = $currentDate->isAfter($todayDate);

            $dayShifts = [];
            $shiftsToProcess = $employeeShifts;
            if ($filterShiftId) {
                $shiftsToProcess = $employeeShifts->where('shift_id', $filterShiftId);
            }

            if ($shiftsToProcess->isEmpty()) {
                // If no shifts are assigned in DB, create a default shift placeholder
                $defaultWorkingDays = [0, 1, 2, 3, 4];
                $isWorking = in_array($dayOfWeek, $defaultWorkingDays);
                $actual = $dayAttendances->first();

                $status = 'absent';
                $notes = '';
                if ($isOutOfTerm && !$actual) {
                    $status = 'out_of_term';
                    $notes = 'خارج الفترة الأكاديمية';
                } elseif ($isHoliday) {
                    $status = 'holiday';
                    $notes = $holidayName;
                } elseif ($isLeave) {
                    $status = 'leave';
                    $notes = 'إجازة: ' . $leaveType;
                } elseif (!$isWorking) {
                    $status = 'weekend';
                    $notes = 'عطلة أسبوعية';
                } elseif ($actual) {
                    $status = $actual->status;
                    $notes = '';
                } elseif ($isFuture) {
                    $status = 'future';
                    $notes = '-';
                } else {
                    $status = 'absent';
                    $notes = $currentDate->isSameDay($todayDate) ? 'لم يسجل دخول اليوم' : 'غياب بدون عذر';
                }

                $durationText = '';
                if ($actual && $actual->check_in && $actual->check_out) {
                    $in = Carbon::parse($actual->check_in);
                    $out = Carbon::parse($actual->check_out);
                    $mins = $in->diffInMinutes($out);
                    $durationText = floor($mins / 60) . 'س ' . ($mins % 60) . 'د';
                }

                $dayShifts[] = [
                    'shift_id' => null,
                    'shift_name' => 'الدوام الرسمي',
                    'start_time' => '07:30',
                    'end_time' => '13:30',
                    'is_working_day' => $isWorking,
                    'status' => $status,
                    'notes' => $notes,
                    'check_in' => $actual?->check_in,
                    'check_out' => $actual?->check_out,
                    'check_in_lat' => $actual?->check_in_lat,
                    'check_in_lng' => $actual?->check_in_lng,
                    'check_out_lat' => $actual?->check_out_lat,
                    'check_out_lng' => $actual?->check_out_lng,
                    'late_minutes' => $actual?->late_minutes ?? 0,
                    'duration' => $durationText,
                    'attendance' => $actual,
                ];
            } else {
                foreach ($shiftsToProcess as $s) {
                    $isWorkingDay = in_array($dayOfWeek, $s->working_days);
                    
                    // Match attendance by shift_id, or if only 1 attendance exists on this day
                    $actual = $dayAttendances->firstWhere('shift_id', $s->shift_id);
                    if (!$actual && $dayAttendances->count() === 1 && $shiftsToProcess->count() === 1) {
                        $actual = $dayAttendances->first();
                    }

                    $status = 'absent';
                    $notes = '';

                    if ($isOutOfTerm && !$actual) {
                        $status = 'out_of_term';
                        $notes = 'خارج الفترة الأكاديمية';
                    } elseif ($isHoliday) {
                        $status = 'holiday';
                        $notes = $holidayName;
                    } elseif ($isLeave) {
                        $status = 'leave';
                        $notes = 'إجازة: ' . $leaveType;
                    } elseif (!$isWorkingDay && !$actual) {
                        $status = 'weekend';
                        $notes = 'عطلة أسبوعية';
                    } elseif ($actual) {
                        $status = $actual->status;
                        $notes = $actual->notes ?? '';
                    } elseif ($isFuture) {
                        $status = 'future';
                        $notes = '-';
                    } else {
                        $status = 'absent';
                        $notes = $currentDate->isSameDay($todayDate) ? 'لم يسجل دخول' : 'غياب';
                    }

                    $durationText = '';
                    if ($actual && $actual->check_in && $actual->check_out) {
                        $in = Carbon::parse($actual->check_in);
                        $out = Carbon::parse($actual->check_out);
                        $mins = $in->diffInMinutes($out);
                        $durationText = floor($mins / 60) . 'س ' . ($mins % 60) . 'د';
                    }

                    $dayShifts[] = [
                        'shift_id' => $s->shift_id,
                        'shift_name' => $s->shift_name,
                        'start_time' => $s->start_time ? substr($s->start_time, 0, 5) : '',
                        'end_time' => $s->end_time ? substr($s->end_time, 0, 5) : '',
                        'is_working_day' => $isWorkingDay,
                        'status' => $status,
                        'notes' => $notes,
                        'check_in' => $actual?->check_in,
                        'check_out' => $actual?->check_out,
                        'check_in_lat' => $actual?->check_in_lat,
                        'check_in_lng' => $actual?->check_in_lng,
                        'check_out_lat' => $actual?->check_out_lat,
                        'check_out_lng' => $actual?->check_out_lng,
                        'late_minutes' => $actual?->late_minutes ?? 0,
                        'duration' => $durationText,
                        'attendance' => $actual,
                    ];
                }
            }

            // Determine overall day status
            $workingShifts = array_filter($dayShifts, fn($s) => $s['is_working_day']);
            $presentCount = count(array_filter($dayShifts, fn($s) => in_array($s['status'], ['present', 'late', 'extra'])));
            $lateCount = count(array_filter($dayShifts, fn($s) => $s['status'] === 'late'));
            $absentCount = count(array_filter($dayShifts, fn($s) => $s['status'] === 'absent'));

            if ($isHoliday) {
                $overallStatus = 'holiday';
                $overallNotes = $holidayName;
            } elseif ($isLeave) {
                $overallStatus = 'leave';
                $overallNotes = 'إجازة: ' . $leaveType;
            } elseif (empty($workingShifts) && $presentCount === 0) {
                $overallStatus = 'weekend';
                $overallNotes = 'عطلة أسبوعية';
            } elseif ($isFuture && $presentCount === 0) {
                $overallStatus = 'future';
                $overallNotes = '-';
            } elseif ($presentCount > 0 && $absentCount > 0) {
                $overallStatus = 'partial'; // Partially attended
                $overallNotes = "حضور {$presentCount} من أصل " . count($dayShifts) . " شفت";
            } elseif ($lateCount > 0) {
                $overallStatus = 'late';
                $overallNotes = 'تأخر في الحضور';
            } elseif ($presentCount > 0) {
                $overallStatus = 'present';
                $overallNotes = 'حاضر كافة الشفتات';
            } elseif ($absentCount > 0) {
                $overallStatus = 'absent';
                $overallNotes = $currentDate->isSameDay($todayDate) ? 'لم يسجل دخول اليوم' : 'غائب';
            } else {
                $overallStatus = $dayShifts[0]['status'] ?? 'weekend';
                $overallNotes = $dayShifts[0]['notes'] ?? '';
            }

            // Summary metrics
            if (isset($summary[$overallStatus])) {
                $summary[$overallStatus]++;
            }

            foreach ($dayShifts as $ds) {
                if ($ds['is_working_day'] && !$isFuture && !$isHoliday && !$isLeave) {
                    $summary['total_shifts_scheduled']++;
                }
                if (in_array($ds['status'], ['present', 'late', 'extra'])) {
                    $summary['total_shifts_attended']++;
                }
                if (!empty($ds['late_minutes'])) {
                    $summary['total_late_minutes'] += (int) $ds['late_minutes'];
                }
            }

            $primaryAttendance = $dayAttendances->first();

            $records[] = [
                'date' => $dateString,
                'day_of_week' => $dayOfWeek,
                'status' => $overallStatus,
                'notes' => $overallNotes,
                'shifts_count' => count($dayShifts),
                'shifts' => $dayShifts,
                'attendance' => $primaryAttendance,
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'records' => $records,
                'summary' => $summary,
                'employee_shifts' => $employeeShifts,
                'has_multiple_shifts' => $employeeShifts->count() > 1,
            ],
        ]);
    }
}
