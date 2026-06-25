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

        $request->validate([
            'type'               => 'required|in:' . implode(',', array_keys(EmployeeRequest::TYPES)),
            'details'            => 'nullable|array',
            'employee_notes'     => 'nullable|string|max:1000',
            'employee_signature' => 'required|string', // base64
        ]);

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

        $start    = \Carbon\Carbon::parse($details['start_date']);
        $end      = \Carbon\Carbon::parse($details['end_date']);
        $days     = $start->diffInDays($end) + 1;

        // Create leave record
        Leave::create([
            'employee_id'    => $employeeRequest->employee_id,
            'leave_type_id'  => $details['leave_type_id'] ?? null,
            'academic_year_id' => \App\Models\AcademicYear::where('is_active', true)->value('id'),
            'start_date'     => $details['start_date'],
            'end_date'       => $details['end_date'],
            'days'           => $days,
            'reason'         => $employeeRequest->employee_notes ?? 'طلب إجازة معتمد',
            'status'         => 'approved',
        ]);
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
