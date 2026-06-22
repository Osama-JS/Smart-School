<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeViolation;
use App\Models\ViolationType;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Services\NotificationService;
use Illuminate\Support\Str;

class EmployeeViolationController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض المخالفات', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة مخالفة', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل مخالفة', only: ['edit', 'update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف مخالفة', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');
        
        $query = EmployeeViolation::with(['user', 'violationType'])
            ->where('academic_year_id', $activeYearId)
            ->latest('violation_date');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('violation_type_id')) {
            $query->where('violation_type_id', $request->violation_type_id);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('violation_date', [$request->start_date, $request->end_date]);
        }

        $violations = $query->paginate(15)->withQueryString();
        $types = ViolationType::where('is_active', true)->get();
        $employees = User::whereHas('role', function($q) {
            $q->whereNotIn('name', ['طالب', 'ولي أمر']);
        })->select('id', 'name')->get();

        $stats = [
            'total' => EmployeeViolation::where('academic_year_id', $activeYearId)->count(),
            'this_month' => EmployeeViolation::where('academic_year_id', $activeYearId)->whereMonth('violation_date', date('m'))->whereYear('violation_date', date('Y'))->count(),
            'unsigned' => EmployeeViolation::where('academic_year_id', $activeYearId)->whereNull('employee_signature')->count(),
        ];

        return Inertia::render('HR/Violations/Index', [
            'violations' => $violations,
            'types' => $types,
            'employees' => $employees,
            'filters' => $request->only(['user_id', 'violation_type_id', 'start_date', 'end_date']),
            'stats' => $stats
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'violation_type_id' => 'required|exists:violation_types,id',
            'violation_date' => 'required|date',
            'details' => 'required|string',
            'action_taken' => 'required|string',
            'status' => 'nullable|string|in:قيد المتابعة,تم تنفيذ الإجراء',
            'attachment' => 'nullable|file|max:5120',
            'admin_signature' => 'nullable|string', // Base64 image
        ]);

        if (empty($validated['status'])) {
            $validated['status'] = 'قيد المتابعة';
        }

        $violation = new EmployeeViolation($validated);
        $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');
        $violation->academic_year_id = $activeYearId;

        // Calculate repetition level
        $previousCount = EmployeeViolation::where('user_id', $validated['user_id'])
            ->where('violation_type_id', $validated['violation_type_id'])
            ->where('academic_year_id', $activeYearId)
            ->count();
        
        $violation->repetition_level = $previousCount + 1;

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('violations/attachments', 'public');
            $violation->attachment_path = $path;
        }

        if ($request->filled('admin_signature')) {
            $violation->admin_signature = $this->saveBase64Signature($request->admin_signature, 'admin');
        }

        $violation->save();

        return back()->with('success', 'تم تسجيل المخالفة بنجاح.');
    }

    public function update(Request $request, EmployeeViolation $employeeViolation)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'violation_type_id' => 'required|exists:violation_types,id',
            'violation_date' => 'required|date',
            'details' => 'required|string',
            'action_taken' => 'required|string',
            'status' => 'nullable|string|in:قيد المتابعة,تم تنفيذ الإجراء',
            'attachment' => 'nullable|file|max:5120',
            'admin_signature' => 'nullable|string', 
        ]);

        $employeeViolation->fill($request->only(['user_id', 'violation_type_id', 'violation_date', 'details', 'action_taken', 'status']));

        if ($request->hasFile('attachment')) {
            if ($employeeViolation->attachment_path) {
                Storage::disk('public')->delete($employeeViolation->attachment_path);
            }
            $path = $request->file('attachment')->store('violations/attachments', 'public');
            $employeeViolation->attachment_path = $path;
        }

        if ($request->filled('admin_signature') && Str::startsWith($request->admin_signature, 'data:image')) {
            if ($employeeViolation->admin_signature) {
                Storage::disk('public')->delete($employeeViolation->admin_signature);
            }
            $employeeViolation->admin_signature = $this->saveBase64Signature($request->admin_signature, 'admin');
        }

        $employeeViolation->save();

        return back()->with('success', 'تم تحديث المخالفة بنجاح.');
    }

    public function destroy(EmployeeViolation $employeeViolation)
    {
        if ($employeeViolation->admin_signature && $employeeViolation->employee_signature) {
            return back()->with('error', 'لا يمكن حذف المخالفة بعد اعتمادها وتوقيعها من قِبل الإدارة والموظف.');
        }

        if ($employeeViolation->attachment_path) {
            Storage::disk('public')->delete($employeeViolation->attachment_path);
        }
        if ($employeeViolation->admin_signature) {
            Storage::disk('public')->delete($employeeViolation->admin_signature);
        }
        if ($employeeViolation->employee_signature) {
            Storage::disk('public')->delete($employeeViolation->employee_signature);
        }
        $employeeViolation->delete();

        return back()->with('success', 'تم حذف المخالفة بنجاح.');
    }

    public function checkRepetition(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'violation_type_id' => 'required|exists:violation_types,id',
        ]);

        $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');
        
        $previousCount = EmployeeViolation::where('user_id', $request->user_id)
            ->where('violation_type_id', $request->violation_type_id)
            ->where('academic_year_id', $activeYearId)
            ->count();
            
        $repetitionLevel = $previousCount + 1;
        $type = ViolationType::find($request->violation_type_id);
        
        $action = $type->first_time_action;
        if ($repetitionLevel == 2 && $type->second_time_action) {
            $action = $type->second_time_action;
        } elseif ($repetitionLevel >= 3 && $type->third_time_action) {
            $action = $type->third_time_action;
        }

        return response()->json([
            'repetition_level' => $repetitionLevel,
            'action_taken' => $action
        ]);
    }

    public function updateStatus(Request $request, EmployeeViolation $violation)
    {
        $request->validate([
            'status' => 'required|string|in:قيد المتابعة,تم تنفيذ الإجراء',
        ]);

        $violation->status = $request->status;
        $violation->save();

        return back()->with('success', 'تم تحديث حالة المخالفة بنجاح.');
    }

    public function notifyForSignature(Request $request, EmployeeViolation $violation, NotificationService $notificationService)
    {
        $request->validate([
            'channels' => 'required|array',
            'channels.*' => 'string|in:database,mail,firebase'
        ]);

        $channels = $request->channels;
        $title = 'طلب توقيع على مخالفة';
        $message = 'لديك مخالفة مسجلة تتطلب توقيعك. يرجى مراجعة صفحة مخالفاتي.';

        if (in_array('database', $channels)) {
            $notificationService->sendInternalNotification(
                $violation->user_id,
                $title,
                $message,
                'violation',
                auth()->id()
            );
        }

        if (in_array('mail', $channels) && $violation->user->email) {
            $notificationService->sendEmailNotification(
                $violation->user,
                $title,
                $message,
                'توقيع المخالفة',
                url('/hr/my-violations')
            );
        }

        if (in_array('firebase', $channels)) {
            $notificationService->sendFirebaseNotification(
                $violation->user,
                $title,
                $message,
                ['type' => 'violation', 'url' => '/hr/my-violations']
            );
        }

        return back()->with('success', 'تم إرسال الإشعار للموظف بنجاح.');
    }

    private function saveBase64Signature($base64String, $prefix)
    {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            return null;
        }
        $base64String = substr($base64String, strpos($base64String, ',') + 1);
        $type = strtolower($type[1]); // jpg, png, webp
        $base64String = base64_decode($base64String);
        $fileName = 'violations/signatures/' . $prefix . '_' . uniqid() . '.' . $type;
        Storage::disk('public')->put($fileName, $base64String);
        return $fileName;
    }
}
