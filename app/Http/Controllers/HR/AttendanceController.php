<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Spatie\LaravelPdf\Facades\Pdf;

class AttendanceController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الحضور والانصراف', only: ['index', 'report']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة حضور وانصراف', only: ['store', 'bulkUpdate']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل حضور وانصراف', only: ['update']),
        ];
    }
    /**
     * صفحة التقرير المتقدم للحضور والانصراف (شهري للموظف)
     */
    public function report(Request $request)
    {
        $user = $request->user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $userBranchId = $isSystemAdmin ? null : $user->branch_id;
        
        $employeesQuery = Employee::query();
        if ($userBranchId) {
            $employeesQuery->whereHas('user', function($q) use ($userBranchId) {
                $q->where('branch_id', $userBranchId);
            });
        }
        $employees = $employeesQuery->with('user:id,name')->get()->map(function($emp) {
            $parts = explode(' ', $emp->user->name ?? '', 2);
            return [
                'id' => $emp->id,
                'first_name' => $parts[0] ?? 'مجهول',
                'last_name' => $parts[1] ?? '',
                'employee_number' => $emp->national_id ?? '',
            ];
        });
        
        $academicYears = AcademicYear::with('semesters')
            ->when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))
            ->get();

        return Inertia::render('HR/Attendance/Report', [
            'employees' => $employees,
            'academicYears' => $academicYears,
            'isAdmin' => $isSystemAdmin // Pass isSystemAdmin to UI if they want to hide branch filters
        ]);
    }
    /**
     * عرض لوحة الحضور والانصراف اليومية
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $userBranchId = $isSystemAdmin ? null : $user->branch_id;

        $startDate    = $request->get('start_date', $request->get('date', Carbon::today()->toDateString()));
        $endDate      = $request->get('end_date', $request->get('date', Carbon::today()->toDateString()));
        $branchId     = $request->get('branch_id');
        if ($userBranchId) $branchId = $userBranchId; // Force branch_id for non-system admins
        $shiftId      = $request->get('shift_id');
        $departmentId = $request->get('department_id');
        
        $academicYearId = $request->get('academic_year_id');
        if (is_null($academicYearId)) {
            $activeYear = \App\Models\AcademicYear::where('is_active', true)
                            ->when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))
                            ->first();
            if ($activeYear) {
                $academicYearId = $activeYear->id;
                $request->merge(['academic_year_id' => $academicYearId]);
            }
        }
        
        $semesterId   = $request->get('semester_id');
        $status       = $request->get('status');
        $search       = $request->get('search');
        $sortBy       = $request->get('sort_by', 'created_at');
        $sortDir      = $request->get('sort_dir', 'desc');

        // Auto-generate missing attendance records
        $this->autoGenerateMissingAttendance($startDate, $endDate, $branchId);

        // جلب سجلات الحضور لنطاق التواريخ المحدد
        $query = Attendance::with(['employee.user', 'employee.department', 'branch', 'shift'])
            ->whereBetween('date', [$startDate, $endDate]);

        if ($branchId) $query->where('branch_id', $branchId);
        if ($shiftId)  $query->where('shift_id', $shiftId);
        if ($academicYearId) $query->where('academic_year_id', $academicYearId);
        if ($semesterId) $query->where('semester_id', $semesterId);
        if ($status)   $query->where('status', $status);
        if ($departmentId) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $departmentId));
        }

        if ($search) {
            $query->whereHas('employee.user', fn($q) =>
                $q->where('name', 'like', "%{$search}%")
            )->orWhereHas('employee', fn($q) =>
                $q->where('national_id', 'like', "%{$search}%")
            );
        }

        // الترتيب والفرز
        if ($sortBy === 'name') {
            $query->join('employees', 'attendances.employee_id', '=', 'employees.id')
                  ->join('users', 'employees.user_id', '=', 'users.id')
                  ->orderBy('users.name', $sortDir)
                  ->select('attendances.*');
        } else {
            $query->orderBy('attendances.' . $sortBy, $sortDir);
        }

        $records = $query->paginate(20)->withQueryString();

        // جلب وتعبئة سجل حضور الـ 30 يوماً للموظفين المعروضين بالصفحة الحالية
        $employeeIds = $records->pluck('employee_id')->unique();
        $historyEndDate = Carbon::parse($endDate);
        $historyStartDate = $historyEndDate->copy()->subDays(29);

        $historyRaw = Attendance::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$historyStartDate->toDateString(), $historyEndDate->toDateString()])
            ->select('employee_id', 'date', 'status')
            ->get()
            ->groupBy('employee_id');

        $records->getCollection()->transform(function ($attendance) use ($historyRaw, $historyStartDate, $historyEndDate) {
            $empHistory = $historyRaw->get($attendance->employee_id, collect());
            
            $historyList = [];
            $start = $historyStartDate->copy();
            for ($i = 0; $i < 30; $i++) {
                $dayStr = $start->copy()->addDays($i)->toDateString();
                $dayRecord = $empHistory->firstWhere('date', $dayStr);
                $historyList[] = [
                    'date'   => $dayStr,
                    'status' => $dayRecord ? $dayRecord->status : 'none'
                ];
            }
            $attendance->employee_history = $historyList;
            return $attendance;
        });

        // إحصائيات نطاق التاريخ المختار
        $stats = Attendance::whereBetween('date', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($shiftId, fn($q) => $q->where('shift_id', $shiftId))
            ->when($academicYearId, fn($q) => $q->where('academic_year_id', $academicYearId))
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId))
            ->when($departmentId, fn($q) => $q->whereHas('employee', fn($eq) => $eq->where('department_id', $departmentId)))
            ->selectRaw("
                COUNT(*) as total,
                SUM(status = 'present') as present,
                SUM(status = 'late') as late,
                SUM(status = 'absent') as absent,
                SUM(status = 'excused') as excused
            ")
            ->first();

        // اتجاهات الحضور لآخر 7 أيام لـ Sparklines (المنتهية في تاريخ النهاية المحدد)
        $trendEndDate = Carbon::parse($endDate);
        $trendStartDate = $trendEndDate->copy()->subDays(6);

        $trendRaw = Attendance::whereBetween('date', [$trendStartDate->toDateString(), $trendEndDate->toDateString()])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($shiftId, fn($q) => $q->where('shift_id', $shiftId))
            ->when($academicYearId, fn($q) => $q->where('academic_year_id', $academicYearId))
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId))
            ->when($departmentId, fn($q) => $q->whereHas('employee', fn($eq) => $eq->where('department_id', $departmentId)))
            ->selectRaw("
                date,
                SUM(status = 'present') as present,
                SUM(status = 'late') as late,
                SUM(status = 'absent') as absent,
                SUM(status = 'excused') as excused
            ")
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $weeklyTrend = [];
        for ($i = 0; $i < 7; $i++) {
            $currentDay = $trendStartDate->copy()->addDays($i)->toDateString();
            if ($trendRaw->has($currentDay)) {
                $weeklyTrend[] = [
                    'date'    => $currentDay,
                    'present' => (int) $trendRaw[$currentDay]->present,
                    'late'    => (int) $trendRaw[$currentDay]->late,
                    'absent'  => (int) $trendRaw[$currentDay]->absent,
                    'excused' => (int) $trendRaw[$currentDay]->excused,
                ];
            } else {
                $weeklyTrend[] = [
                    'date'    => $currentDay,
                    'present' => 0,
                    'late'    => 0,
                    'absent'  => 0,
                    'excused' => 0,
                ];
            }
        }

        $activeHolidays = \App\Models\Holiday::where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate)
            ->when($branchId, function($q) use ($branchId) {
                $q->where(function($sq) use ($branchId) {
                    $sq->whereNull('branch_id')->orWhere('branch_id', $branchId);
                });
            })
            ->get();

        $leaveBalances = \App\Models\LeaveBalance::whereIn('employee_id', $employeeIds)
            ->where('academic_year_id', $academicYearId)
            ->get();

        return Inertia::render('HR/Attendance/Index', [
            'records'      => $records,
            'stats'        => $stats,
            'weeklyTrend'  => $weeklyTrend,
            'branches'     => Branch::where('is_active', true)->when($userBranchId, fn($q) => $q->where('id', $userBranchId))->select('id', 'name')->get(),
            'shifts'       => Shift::where('is_active', true)->when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))->select('id', 'name', 'start_time', 'end_time')->get(),
            'departments'  => \App\Models\Department::when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))->select('id', 'name')->get(),
            'academicYears'=> AcademicYear::with('semesters')->when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))->get(),
            'filters'      => $request->only(['date', 'start_date', 'end_date', 'branch_id', 'shift_id', 'department_id', 'academic_year_id', 'semester_id', 'status', 'search', 'sort_by', 'sort_dir']),
            'today'        => Carbon::today()->toDateString(),
            'startDate'    => $startDate,
            'endDate'      => $endDate,
            'isSystemAdmin'=> $isSystemAdmin,
            'activeHolidays'=> $activeHolidays,
            'leaveTypes'   => \App\Models\LeaveType::when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))->get(),
            'leaveBalances'=> $leaveBalances,
        ]);
    }

    /**
     * تعديل سجل حضور يدوياً (للإدارة)
     */
    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'check_in'    => 'nullable|date_format:H:i',
            'check_out'   => 'nullable|date_format:H:i',
            'status'      => 'required|in:present,absent,late,excused,weekend,holiday,leave',
            'late_minutes'=> 'nullable|integer|min:0',
        ]);

        $attendance->update($validated);

        return back()->with('success', 'تم تعديل سجل الحضور بنجاح');
    }

    /**
     * تعديل سجلات حضور متعددة دفعة واحدة
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids'          => 'required|array',
            'ids.*'        => 'required|exists:attendances,id',
            'status'       => 'required|in:present,absent,late,excused,weekend,holiday,leave',
            'check_in'     => 'nullable|date_format:H:i',
            'check_out'    => 'nullable|date_format:H:i',
            'late_minutes' => 'nullable|integer|min:0',
        ]);

        $updateData = [
            'status' => $validated['status']
        ];

        if ($validated['status'] === 'present') {
            $updateData['check_in'] = $validated['check_in'] ?? null;
            $updateData['check_out'] = $validated['check_out'] ?? null;
            $updateData['late_minutes'] = 0;
        } elseif ($validated['status'] === 'late') {
            $updateData['check_in'] = $validated['check_in'] ?? null;
            $updateData['check_out'] = $validated['check_out'] ?? null;
            $updateData['late_minutes'] = $validated['late_minutes'] ?? 0;
        } else {
            // absent or excused
            $updateData['check_in'] = null;
            $updateData['check_out'] = null;
            $updateData['late_minutes'] = 0;
        }

        \App\Models\Attendance::whereIn('id', $validated['ids'])->update($updateData);

        return back()->with('success', 'تم تحديث سجلات الحضور المحددة بنجاح');
    }

    /**
     * إضافة سجل حضور يدوياً
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'branch_id'   => 'nullable|exists:branches,id',
            'shift_id'    => 'nullable|exists:shifts,id',
            'date'        => 'required|date',
            'check_in'    => 'nullable|date_format:H:i',
            'check_out'   => 'nullable|date_format:H:i',
            'status'      => 'required|in:present,absent,late,excused',
            'late_minutes'=> 'nullable|integer|min:0',
        ]);

        $academicYear = AcademicYear::where('start_date', '<=', $validated['date'])
            ->where('end_date', '>=', $validated['date'])
            ->first();
            
        $semester = \App\Models\Semester::where('start_date', '<=', $validated['date'])
            ->where('end_date', '>=', $validated['date'])
            ->first();

        $validated['academic_year_id'] = $academicYear ? $academicYear->id : null;
        $validated['semester_id'] = $semester ? $semester->id : null;

        Attendance::updateOrCreate(
            ['employee_id' => $validated['employee_id'], 'date' => $validated['date']],
            $validated
        );

        return back()->with('success', 'تم حفظ سجل الحضور بنجاح');
    }

    public function teacherAbsencesReport(Request $request)
    {
        $user = $request->user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $userBranchId = $isSystemAdmin ? null : $user->branch_id;

        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());
        $departmentId = $request->get('department_id');
        $employeeId = $request->get('employee_id');
        $statuses = $request->get('statuses');
        $violatorsOnly = filter_var($request->get('violators_only', false), FILTER_VALIDATE_BOOLEAN);

        if (empty($statuses)) {
            $statuses = ['absent', 'late', 'excused', 'leave'];
        } else if (is_string($statuses)) {
            $statuses = explode(',', $statuses);
        }

        // Base Query
        $query = \App\Models\Attendance::with(['employee.user', 'employee.department'])
            ->whereHas('employee.user', function($q) use ($userBranchId) {
                $q->where(function($subQ) {
                    $subQ->where('name', 'like', '%معلم%')
                         ->orWhere('name', 'like', '%مدرس%');
                });
                if ($userBranchId) {
                    $q->where('branch_id', $userBranchId);
                }
            })
            ->whereBetween('date', [$startDate, $endDate])
            ->whereIn('status', $statuses);

        if ($departmentId) {
            $query->whereHas('employee', function($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        $absencesRaw = $query->orderBy('date', 'desc')->get();

        $absences = $absencesRaw->map(function($att) {
            return [
                'id' => $att->id,
                'employee_name' => $att->employee->user->name ?? 'غير محدد',
                'department_name' => $att->employee->department->name ?? 'غير محدد',
                'date' => $att->date,
                'day' => Carbon::parse($att->date)->locale('ar')->isoFormat('dddd'),
                'status_code' => $att->status,
                'status' => match($att->status) {
                    'absent' => 'غياب بدون عذر',
                    'late' => 'تأخير',
                    'excused' => 'استئذان',
                    'leave' => 'إجازة / مرضي',
                    default => 'غير معروف'
                },
                'late_minutes' => $att->late_minutes,
                'notes' => $att->notes,
            ];
        });

        // Kpis
        $total_absent = $absencesRaw->where('status', 'absent')->count();
        $total_late = $absencesRaw->where('status', 'late')->count();
        $unique_teachers = $absencesRaw->pluck('employee_id')->unique()->count();

        // Department Chart
        $deptStats = [];
        foreach($absencesRaw as $att) {
            $deptName = $att->employee->department->name ?? 'غير محدد';
            if (!isset($deptStats[$deptName])) {
                $deptStats[$deptName] = ['name' => $deptName, 'absent' => 0, 'late' => 0, 'excused' => 0, 'leave' => 0];
            }
            if ($att->status == 'absent') $deptStats[$deptName]['absent']++;
            if ($att->status == 'late') $deptStats[$deptName]['late']++;
            if ($att->status == 'excused') $deptStats[$deptName]['excused']++;
            if ($att->status == 'leave') $deptStats[$deptName]['leave']++;
        }
        $departmentChartData = array_values($deptStats);
        usort($departmentChartData, fn($a, $b) => ($b['absent'] + $b['late']) - ($a['absent'] + $a['late']));

        // Dropdowns
        $allTeachersQuery = \App\Models\Employee::with('user:id,name')
            ->whereHas('user', function($q) use ($userBranchId) {
                $q->where(function($subQ) {
                    $subQ->where('name', 'like', '%معلم%')
                         ->orWhere('name', 'like', '%مدرس%');
                });
                if ($userBranchId) {
                    $q->where('branch_id', $userBranchId);
                }
            });
        $teachers = $allTeachersQuery->get()->map(fn($t) => ['id' => $t->id, 'name' => $t->user->name ?? '']);
        $departments = \App\Models\Department::when($userBranchId, fn($q) => $q->where('branch_id', $userBranchId))->select('id', 'name')->get();

        return inertia('HR/Reports/TeacherAbsences', [
            'absences' => $absences,
            'kpis' => [
                'total_absent' => $total_absent,
                'total_late' => $total_late,
                'unique_teachers' => $unique_teachers
            ],
            'departmentChartData' => $departmentChartData,
            'teachers' => $teachers,
            'departments' => $departments,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'department_id' => $departmentId,
                'employee_id' => $employeeId,
                'statuses' => $request->get('statuses', ''),
                'violators_only' => $violatorsOnly
            ]
        ]);
    }

    /**
     * تنزيل تقرير الغياب والتأخير كملف PDF
     */
    public function downloadTeacherAbsencesPdf(Request $request)
    {
        $user = $request->user();
        $isSystemAdmin = $user && $user->role && $user->role->name === 'مدير النظام';
        $userBranchId = $isSystemAdmin ? null : $user->branch_id;

        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());
        $departmentId = $request->get('department_id');
        $employeeId = $request->get('employee_id');
        $statuses = $request->get('statuses');
        
        if (empty($statuses)) {
            $statuses = ['absent', 'late', 'excused', 'leave'];
        } else if (is_string($statuses)) {
            $statuses = explode(',', $statuses);
        }

        $query = \App\Models\Attendance::with(['employee.user', 'employee.department'])
            ->whereHas('employee.user', function($q) use ($userBranchId) {
                $q->where(function($subQ) {
                    $subQ->where('name', 'like', '%معلم%')
                         ->orWhere('name', 'like', '%مدرس%');
                });
                if ($userBranchId) {
                    $q->where('branch_id', $userBranchId);
                }
            })
            ->whereBetween('date', [$startDate, $endDate])
            ->whereIn('status', $statuses);

        if ($departmentId) {
            $query->whereHas('employee', function($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        $absencesRaw = $query->orderBy('date', 'desc')->get();

        $total_absent = $absencesRaw->where('status', 'absent')->count();
        $total_late = $absencesRaw->where('status', 'late')->count();

        // Group absences by teacher
        $groupedByTeacher = [];
        foreach ($absencesRaw as $att) {
            $empName = $att->employee->user->name ?? 'غير محدد';
            if (!isset($groupedByTeacher[$empName])) {
                $groupedByTeacher[$empName] = [
                    'employee_name' => $empName,
                    'department' => $att->employee->department->name ?? '-',
                    'records' => []
                ];
            }
            $groupedByTeacher[$empName]['records'][] = [
                'date' => $att->date,
                'day' => Carbon::parse($att->date)->locale('ar')->isoFormat('dddd'),
                'status' => match($att->status) {
                    'absent' => 'غياب بدون عذر',
                    'late' => 'تأخير',
                    'excused' => 'استئذان',
                    'leave' => 'إجازة / مرضي',
                    default => 'غير معروف'
                },
                'status_code' => $att->status,
                'late_minutes' => $att->late_minutes
            ];
        }

        // Apply Violators Only filter
        $violatorsOnly = filter_var($request->get('violators_only', false), FILTER_VALIDATE_BOOLEAN);
        $sortedGroupedAbsences = array_values($groupedByTeacher);
        
        usort($sortedGroupedAbsences, function($a, $b) {
            $aViolations = count(array_filter($a['records'], fn($r) => in_array($r['status_code'], ['absent', 'late'])));
            $bViolations = count(array_filter($b['records'], fn($r) => in_array($r['status_code'], ['absent', 'late'])));
            return $bViolations - $aViolations;
        });

        if ($violatorsOnly) {
            $sortedGroupedAbsences = array_filter($sortedGroupedAbsences, function($data) {
                $absentCount = count(array_filter($data['records'], fn($r) => $r['status_code'] === 'absent'));
                $lateCount = count(array_filter($data['records'], fn($r) => $r['status_code'] === 'late'));
                return $absentCount >= 3 || $lateCount >= 3;
            });
        }

        $printSettings = json_decode($request->get('printSettings', '{}'), true);
        
        $brandColor = $printSettings['brandColor'] ?? '#63a22f';
        $title = $printSettings['title'] ?? 'تقرير غياب وتأخير المعلمين';
        $paperSize = $printSettings['paperSize'] ?? 'a4';
        $orientation = $printSettings['orientation'] ?? 'portrait';
        $marginsStr = $printSettings['margins'] ?? 'normal';
        
        $margins = match($marginsStr) {
            'none' => [0, 0, 0, 0],
            '1cm' => [10, 10, 10, 10],
            '2cm' => [20, 20, 20, 20],
            default => [15, 15, 15, 15] // normal
        };

        $showKPIs = $printSettings['showKPIs'] ?? true;
        
        $uniqueTeachers = 0;
        $mostAbsentDept = 'لا يوجد';
        
        if ($showKPIs) {
            $uniqueTeachers = $absencesRaw->pluck('employee_id')->unique()->count();
            
            $deptStats = [];
            foreach($absencesRaw as $att) {
                $deptName = $att->employee->department->name ?? 'غير محدد';
                if (!isset($deptStats[$deptName])) {
                    $deptStats[$deptName] = ['absent' => 0, 'late' => 0];
                }
                if ($att->status == 'absent') $deptStats[$deptName]['absent']++;
                if ($att->status == 'late') $deptStats[$deptName]['late']++;
            }
            
            arsort($deptStats);
            $maxViolations = 0;
            foreach ($deptStats as $deptName => $stats) {
                $total = $stats['absent'] + $stats['late'];
                if ($total > $maxViolations) {
                    $maxViolations = $total;
                    $mostAbsentDept = $deptName;
                }
            }
        }

        $data = [
            'groupedAbsences' => $sortedGroupedAbsences,
            'totalAbsences' => $total_absent,
            'totalLates' => $total_late,
            'uniqueTeachers' => $uniqueTeachers,
            'mostAbsentDept' => $mostAbsentDept,
            'showKPIs' => $showKPIs,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'title' => $title,
            'brandColor' => $brandColor,
            'watermark' => $printSettings['watermark'] ?? 'none',
        ];

        $footerHtml = '
            <div style="width: 100%; padding: 0 40px 10px 40px; margin: 0; font-family: tahoma, arial, sans-serif; direction: rtl; box-sizing: border-box;">
                <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 9px; color: #64748b;">
                    <div style="width: 33%; text-align: right;">
                        <strong style="color: ' . $brandColor . ';">نظام الإدارة الذكية</strong> (Smart School)
                    </div>
                    <div style="width: 33%; text-align: center; color: #94a3b8;">
                        طُبع بتاريخ: ' . now()->format('Y-m-d H:i') . '
                    </div>
                    <div style="width: 33%; text-align: left;">
                        <span style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 12px; font-weight: bold; color: #475569; display: inline-block;">
                            صفحة <span class="pageNumber"></span> / <span class="totalPages"></span>
                        </span>
                    </div>
                </div>
            </div>
        ';

        $pdf = Pdf::view('pdf.hr.teacher-absences', $data)
            ->format($paperSize)
            ->margins($margins[0], $margins[1], $margins[2] + 12, $margins[3])
            ->footerHtml($footerHtml)
            ->withBrowsershot(function ($browsershot) {
                $browsershot->setChromePath('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
                           ->noSandbox()
                           ->showBackground()
                           ->waitUntilNetworkIdle()
                           ->delay(2000);
            });

        if ($orientation === 'landscape') {
            $pdf->landscape();
        }

        return $pdf->download('teacher_absences.pdf');
    }


    /**
     * Auto-generate missing attendance records based on shifts, holidays, and leaves.
     */
    private function autoGenerateMissingAttendance($startDate, $endDate, $branchId = null)
    {
        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);
        if ($start->diffInDays($end) > 31) {
            $end = $start->copy()->addDays(31);
        }

        $employees = \App\Models\Employee::with(['shifts', 'user'])->whereHas('user', function($q) use ($branchId) {
            $q->where('is_active', true);
            if ($branchId) {
                $q->where('branch_id', $branchId);
            }
        })->get();

        if ($employees->isEmpty()) return;

        $holidays = \App\Models\Holiday::where(function($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                  ->orWhereBetween('end_date', [$start, $end])
                  ->orWhere(function($sq) use ($start, $end) {
                      $sq->where('start_date', '<=', $start)
                         ->where('end_date', '>=', $end);
                  });
            })
            ->when($branchId, fn($q) => $q->where(fn($sq) => $sq->where('branch_id', $branchId)->orWhereNull('branch_id')))
            ->get();

        $leaves = \App\Models\Leave::where('status', 'approved')
            ->whereIn('employee_id', $employees->pluck('id'))
            ->where(function($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                  ->orWhereBetween('end_date', [$start, $end])
                  ->orWhere(function($sq) use ($start, $end) {
                      $sq->where('start_date', '<=', $start)
                         ->where('end_date', '>=', $end);
                  });
            })->get();

        $existingRecords = Attendance::whereIn('employee_id', $employees->pluck('id'))
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->select('employee_id', 'date')
            ->get()
            ->groupBy('employee_id')
            ->map(fn($group) => $group->pluck('date')->toArray());

        $academicYears = \App\Models\AcademicYear::where('start_date', '<=', $end)
            ->where('end_date', '>=', $start)
            ->get();

        $semesters = \App\Models\Semester::where('start_date', '<=', $end)
            ->where('end_date', '>=', $start)
            ->get();

        $bulkInsert = [];
        $now = \Carbon\Carbon::now();
        $todayStr = $now->toDateString();

        foreach ($employees as $emp) {
            $empExisting = $existingRecords->get($emp->id, []);
            $shift = $emp->shifts->first();
            $empBranchId = $shift ? $shift->pivot->branch_id : $emp->user->branch_id;
            
            $workingDays = [0,1,2,3,4]; // Default Sunday-Thursday
            if ($shift && $shift->pivot->working_days) {
                $wd = $shift->pivot->working_days;
                $workingDays = is_string($wd) ? json_decode($wd, true) : $wd;
            }

            for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
                $dateStr = $date->toDateString();

                if ($date->gt($now->startOfDay()) && $dateStr !== $todayStr) {
                    continue; 
                }

                if (in_array($dateStr, $empExisting)) continue;

                $dayOfWeek = $date->dayOfWeek;
                $isWeekend = !in_array($dayOfWeek, $workingDays);

                $isHoliday = $holidays->contains(function($h) use ($date) {
                    return $date->betweenIncluded(\Carbon\Carbon::parse($h->start_date), \Carbon\Carbon::parse($h->end_date));
                });

                $isLeave = $leaves->where('employee_id', $emp->id)->contains(function($l) use ($date) {
                    return $date->betweenIncluded(\Carbon\Carbon::parse($l->start_date), \Carbon\Carbon::parse($l->end_date));
                });

                if ($isHoliday) {
                    $status = 'holiday';
                } elseif ($isLeave) {
                    $status = 'leave';
                } elseif ($isWeekend) {
                    $status = 'weekend';
                } else {
                    $status = 'absent';
                }

                $academicYear = $academicYears->first(fn($y) => 
                    $date->betweenIncluded(\Carbon\Carbon::parse($y->start_date), \Carbon\Carbon::parse($y->end_date)) 
                    && ($y->branch_id == $empBranchId || is_null($y->branch_id))
                );
                
                $semester = $semesters->first(fn($s) => 
                    $date->betweenIncluded(\Carbon\Carbon::parse($s->start_date), \Carbon\Carbon::parse($s->end_date))
                    && $s->academic_year_id == ($academicYear ? $academicYear->id : null)
                );

                $bulkInsert[] = [
                    'employee_id' => $emp->id,
                    'branch_id' => $empBranchId,
                    'shift_id' => $shift ? $shift->id : null,
                    'date' => $dateStr,
                    'status' => $status,
                    'late_minutes' => 0,
                    'academic_year_id' => $academicYear ? $academicYear->id : null,
                    'semester_id' => $semester ? $semester->id : null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (!empty($bulkInsert)) {
            foreach (array_chunk($bulkInsert, 500) as $chunk) {
                Attendance::insertOrIgnore($chunk);
            }
        }
    }
}
