<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeRequest;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\Leave;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EmployeeRequestController extends Controller
{
    // ── Admin/Manager Side: List all requests ──
    public function index(Request $request)
    {
        $user = $request->user();
        $isSystemAdmin = $user?->role?->name === 'مدير النظام';
        $branchId = $user->branch_id ?? session('branch_id');

        $query = EmployeeRequest::with(['employee.user', 'employee.jobGrade', 'manager'])
            ->when(!$isSystemAdmin && $branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->when($request->filled('type'), fn($q) => $q->where('type', $request->type))
            ->latest();

        $requests = $query->paginate(20)->withQueryString();

        $stats = [
            'pending'  => EmployeeRequest::when(!$isSystemAdmin && $branchId, fn($q) => $q->where('branch_id', $branchId))->where('status', 'pending')->count(),
            'approved' => EmployeeRequest::when(!$isSystemAdmin && $branchId, fn($q) => $q->where('branch_id', $branchId))->where('status', 'approved')->count(),
            'rejected' => EmployeeRequest::when(!$isSystemAdmin && $branchId, fn($q) => $q->where('branch_id', $branchId))->where('status', 'rejected')->count(),
        ];

        // Fetch leave balances for employees currently displayed on this page
        $employeeIds = collect($requests->items())->pluck('employee_id')->unique();
        $leaveBalances = LeaveBalance::with('leaveType')
            ->whereIn('employee_id', $employeeIds)
            ->get()
            ->groupBy('employee_id');

        return Inertia::render('HR/Requests/Index', [
            'requests'      => $requests,
            'stats'         => $stats,
            'types'         => EmployeeRequest::TYPES,
            'statuses'      => EmployeeRequest::STATUSES,
            'filters'       => $request->only(['status', 'type']),
            'leaveBalances' => $leaveBalances,
        ]);
    }

    // ── Admin: Approve or Reject ──
    public function review(Request $request, EmployeeRequest $employeeRequest)
    {
        $request->validate([
            'status'           => 'required|in:approved,rejected',
            'manager_notes'    => 'nullable|string|max:1000',
            'manager_signature'=> 'nullable|string', // base64
            'updated_details'  => 'nullable|array', // Allow admin to change some details (like leave_type_id)
        ]);

        if ($request->status === 'approved' && $employeeRequest->type === 'leave') {
            $details = $request->filled('updated_details') ? array_merge($employeeRequest->details ?? [], $request->updated_details) : ($employeeRequest->details ?? []);
            
            $leaveTypeId = $details['leave_type_id'] ?? null;
            $startDate = isset($details['start_date']) ? \Carbon\Carbon::parse($details['start_date']) : null;
            $endDate = isset($details['end_date']) ? \Carbon\Carbon::parse($details['end_date']) : null;

            if ($leaveTypeId && $startDate && $endDate) {
                $requestedDays = $startDate->diffInDays($endDate) + 1;
                
                $academicYear = \App\Models\AcademicYear::where('is_active', true)
                    ->where('branch_id', $employeeRequest->branch_id)
                    ->first();

                if (!$academicYear) {
                    return back()->with('error', 'لا توجد سنة دراسية نشطة حالياً لإعتماد الطلب.');
                }

                $balance = \App\Models\LeaveBalance::where('employee_id', $employeeRequest->employee_id)
                    ->where('academic_year_id', $academicYear->id)
                    ->where('leave_type_id', $leaveTypeId)
                    ->first();

                if (!$balance) {
                    return back()->with('error', 'الموظف لا يمتلك رصيد لهذا النوع من الإجازة.');
                }

                $remaining = max(0, $balance->total_days - $balance->used_days);
                if ($requestedDays > $remaining) {
                    return back()->with('error', "لا يمكن اعتماد الطلب. الرصيد المتبقي ({$remaining} يوم) أقل من الأيام المطلوبة ({$requestedDays} يوم).");
                }
            }
        }

        $employeeRequest->status       = $request->status;
        $employeeRequest->manager_id   = $request->user()->id;
        $employeeRequest->manager_notes= $request->manager_notes;
        $employeeRequest->reviewed_at  = now();
        
        if ($request->filled('updated_details') && is_array($request->updated_details)) {
            $employeeRequest->details = array_merge($employeeRequest->details ?? [], $request->updated_details);
        }

        if ($request->filled('manager_signature') && Str::startsWith($request->manager_signature, 'data:image')) {
            $employeeRequest->manager_signature = $this->saveBase64Signature($request->manager_signature, 'manager');
        }

        // Smart approval: if a leave request is approved, auto-create leave record & deduct balance
        if ($request->status === 'approved' && $employeeRequest->type === 'leave') {
            $this->processLeaveApproval($employeeRequest);
        }

        $employeeRequest->save();

        // إرسال إشعار للموظف (Notification & Email)
        try {
            $employeeRequest->loadMissing('employee.user');
            if ($employeeRequest->employee && $employeeRequest->employee->user) {
                $notificationService = app(\App\Services\NotificationService::class);
                
                $statusAr = $request->status === 'approved' ? 'اعتماد' : 'رفض';
                $typeAr   = EmployeeRequest::TYPES[$employeeRequest->type] ?? 'الطلب';
                
                $title   = "تحديث حالة {$typeAr}";
                $message = "تم {$statusAr} {$typeAr} الخاص بك.";
                
                if ($request->filled('manager_notes')) {
                    $message .= "\nملاحظات المدير: " . $request->manager_notes;
                }

                $notificationService->sendComprehensiveNotification(
                    $employeeRequest->employee->user,
                    $title,
                    $message,
                    'leave_request',
                    true, // تفعيل إرسال البريد الإلكتروني
                    $request->user()->id
                );
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('فشل إرسال إشعار تحديث طلب الموظف: ' . $e->getMessage());
        }

        return back()->with('success', $request->status === 'approved' ? 'تم اعتماد الطلب بنجاح.' : 'تم رفض الطلب.');
    }

    // ── Employee Side: My Requests ──
    public function myRequests(Request $request)
    {
        $user    = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return redirect()->back()->with('error', 'لا يوجد سجل موظف مرتبط بحسابك.');
        }

        $myRequests = EmployeeRequest::with(['employee.user', 'employee.jobGrade', 'manager'])
            ->where('employee_id', $employee->id)
            ->latest()
            ->get();

        $leaveBalances = LeaveBalance::with('leaveType')
            ->where('employee_id', $employee->id)
            ->get()
            ->map(fn($b) => [
                'id'               => $b->id,
                'leave_type_id'    => $b->leave_type_id,
                'leave_type_name'  => $b->leaveType?->name,
                'total_days'       => $b->total_days,
                'used_days'        => $b->used_days,
                'remaining_days'   => max(0, $b->total_days - $b->used_days),
            ]);

        return Inertia::render('HR/Requests/MyRequests', [
            'myRequests'    => $myRequests,
            'leaveBalances' => $leaveBalances,
            'types'         => EmployeeRequest::TYPES,
            'statuses'      => EmployeeRequest::STATUSES,
        ]);
    }

    // ── Employee: Submit new request ──
    public function store(Request $request)
    {
        $user    = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return back()->with('error', 'لا يوجد سجل موظف مرتبط بحسابك.');
        }

        $rules = [
            'type'               => 'required|in:' . implode(',', array_keys(EmployeeRequest::TYPES)),
            'employee_notes'     => 'nullable|string|max:1000',
            'employee_signature' => 'required|string', // base64
        ];

        $messages = [];

        if ($request->type === 'leave') {
            $rules['details.start_date'] = 'required|date';
            $rules['details.end_date'] = 'required|date|after_or_equal:details.start_date';
            $rules['details.leave_type_id'] = 'required|exists:leave_types,id';

            $messages['details.start_date.required'] = 'تاريخ البداية مطلوب للإجازة.';
            $messages['details.end_date.required'] = 'تاريخ النهاية مطلوب للإجازة.';
            $messages['details.end_date.after_or_equal'] = 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية.';
            $messages['details.leave_type_id.required'] = 'نوع الإجازة مطلوب.';
        } else {
            $rules['details'] = 'nullable|array';
        }

        $request->validate($rules, $messages);

        if ($request->type === 'leave') {
            $academicYear = \App\Models\AcademicYear::where('is_active', true)
                ->where('branch_id', $user->branch_id)
                ->first();

            if (!$academicYear) {
                return back()->with('error', 'لا توجد سنة دراسية نشطة حالياً في فرعك لتقديم طلب إجازة.');
            }

            $leaveTypeId = $request->details['leave_type_id'];
            $startDate = \Carbon\Carbon::parse($request->details['start_date']);
            $endDate = \Carbon\Carbon::parse($request->details['end_date']);
            $requestedDays = $startDate->diffInDays($endDate) + 1;

            $balance = LeaveBalance::where('employee_id', $employee->id)
                ->where('academic_year_id', $academicYear->id)
                ->where('leave_type_id', $leaveTypeId)
                ->first();

            if (!$balance) {
                return back()->withErrors(['details.leave_type_id' => 'لا يوجد رصيد متاح لك من هذا النوع في السنة الدراسية الحالية.']);
            }

            // Check approved Leaves overlap
            $hasOverlapLeave = Leave::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->where(function($query) use ($startDate, $endDate) {
                    $query->whereBetween('start_date', [$startDate, $endDate])
                        ->orWhereBetween('end_date', [$startDate, $endDate])
                        ->orWhere(function($q) use ($startDate, $endDate) {
                            $q->where('start_date', '<=', $startDate)
                              ->where('end_date', '>=', $endDate);
                        });
                })->exists();

            if ($hasOverlapLeave) {
                return back()->withErrors(['details.start_date' => 'يوجد لديك إجازة معتمدة مسبقاً تتعارض مع التواريخ المطلوبة.']);
            }

            // Check pending/approved Requests overlap
            $hasOverlapRequest = EmployeeRequest::where('employee_id', $employee->id)
                ->where('type', 'leave')
                ->whereIn('status', ['pending', 'approved'])
                ->get()
                ->contains(function($req) use ($startDate, $endDate) {
                    if (empty($req->details['start_date']) || empty($req->details['end_date'])) return false;
                    $reqStart = \Carbon\Carbon::parse($req->details['start_date'])->startOfDay();
                    $reqEnd = \Carbon\Carbon::parse($req->details['end_date'])->startOfDay();
                    $s = $startDate->copy()->startOfDay();
                    $e = $endDate->copy()->startOfDay();
                    return ($reqStart->between($s, $e) || $reqEnd->between($s, $e) || ($reqStart->lte($s) && $reqEnd->gte($e)));
                });

            if ($hasOverlapRequest) {
                return back()->withErrors(['details.start_date' => 'يوجد لديك طلب إجازة آخر معلق أو معتمد يتعارض مع التواريخ المطلوبة.']);
            }

            // Calculate remaining balance considering other pending requests
            $remaining = max(0, $balance->total_days - $balance->used_days);

            $pendingRequestedDays = EmployeeRequest::where('employee_id', $employee->id)
                ->where('type', 'leave')
                ->where('status', 'pending')
                ->get()
                ->filter(function($req) use ($leaveTypeId) {
                    return isset($req->details['leave_type_id']) && $req->details['leave_type_id'] == $leaveTypeId;
                })
                ->sum(function($req) {
                    if (isset($req->details['start_date']) && isset($req->details['end_date'])) {
                        return \Carbon\Carbon::parse($req->details['start_date'])->diffInDays(\Carbon\Carbon::parse($req->details['end_date'])) + 1;
                    }
                    return 0;
                });

            if ($requestedDays > ($remaining - $pendingRequestedDays)) {
                $actualRemaining = $remaining - $pendingRequestedDays;
                return back()->withErrors(['details.end_date' => "الرصيد غير كافٍ. المتبقي: {$actualRemaining} يوم (شامل الطلبات المعلقة)، والمطلوب: {$requestedDays} يوم."]);
            }
        }

        $newRequest = new EmployeeRequest();
        $newRequest->employee_id    = $employee->id;
        $newRequest->branch_id      = $user->branch_id;
        $newRequest->type           = $request->type;
        $newRequest->details        = $request->details ?? [];
        $newRequest->employee_notes = $request->employee_notes;
        $newRequest->status         = 'pending';

        if ($request->filled('employee_signature') && Str::startsWith($request->employee_signature, 'data:image')) {
            $newRequest->employee_signature = $this->saveBase64Signature($request->employee_signature, 'employee');
        }

        $newRequest->save();

        return back()->with('success', 'تم تقديم طلبك بنجاح وهو الآن قيد المراجعة.');
    }

    // ── Private Helpers ──
    private function processLeaveApproval(EmployeeRequest $employeeRequest): void
    {
        $details = $employeeRequest->details ?? [];
        if (empty($details['start_date']) || empty($details['end_date'])) {
            return;
        }

        $academicYear = \App\Models\AcademicYear::where('is_active', true)
            ->where('branch_id', $employeeRequest->branch_id)
            ->first();

        // Create leave record
        Leave::create([
            'employee_id'      => $employeeRequest->employee_id,
            'leave_type_id'    => $details['leave_type_id'] ?? null,
            'academic_year_id' => $academicYear ? $academicYear->id : null,
            'start_date'       => $details['start_date'],
            'end_date'         => $details['end_date'],
            'reason'           => $employeeRequest->employee_notes ?? 'طلب إجازة معتمد',
            'status'           => 'approved',
        ]);

        $this->updateAttendanceForLeave($employeeRequest->employee_id, $details['start_date'], $details['end_date']);
    }

    private function updateAttendanceForLeave(int $employeeId, string $startDate, string $endDate): void
    {
        \App\Models\Attendance::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate, $endDate])
            ->whereIn('status', ['absent', 'weekend', 'excused'])
            ->update(['status' => 'leave']);
    }

    private function saveBase64Signature(string $base64String, string $prefix): ?string
    {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            return null;
        }
        $data     = substr($base64String, strpos($base64String, ',') + 1);
        $ext      = strtolower($type[1]);
        $decoded  = base64_decode($data);
        $fileName = 'employee-requests/signatures/' . $prefix . '_' . uniqid() . '.' . $ext;
        Storage::disk('public')->put($fileName, $decoded);
        return $fileName;
    }
}
