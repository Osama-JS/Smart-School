<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeAchievement;
use App\Models\AchievementType;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Services\NotificationService;
use Illuminate\Support\Str;

class EmployeeAchievementController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الإنجازات', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة إنجاز', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل إنجاز', only: ['edit', 'update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف إنجاز', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');
        
        $query = EmployeeAchievement::with(['user', 'achievementType'])
            ->where('academic_year_id', $activeYearId)
            ->latest('achievement_date');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('achievement_type_id')) {
            $query->where('achievement_type_id', $request->achievement_type_id);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('achievement_date', [$request->start_date, $request->end_date]);
        }

        $achievements = $query->paginate(15)->withQueryString();
        $types = AchievementType::where('is_active', true)->get();
        $employees = User::whereHas('role', function($q) {
            $q->whereNotIn('name', ['طالب', 'ولي أمر']);
        })->select('id', 'name')->get();

        $stats = [
            'total' => EmployeeAchievement::where('academic_year_id', $activeYearId)->count(),
            'this_month' => EmployeeAchievement::where('academic_year_id', $activeYearId)->whereMonth('achievement_date', date('m'))->whereYear('achievement_date', date('Y'))->count(),
            'unsigned' => EmployeeAchievement::where('academic_year_id', $activeYearId)->whereNull('employee_signature')->count(),
        ];

        return Inertia::render('HR/Achievements/Index', [
            'achievements' => $achievements,
            'types' => $types,
            'employees' => $employees,
            'filters' => $request->only(['user_id', 'achievement_type_id', 'start_date', 'end_date']),
            'stats' => $stats
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'achievement_type_id' => 'required|exists:achievement_types,id',
            'achievement_date' => 'required|date',
            'details' => 'nullable|string',
            'attachment' => 'nullable|file|max:5120',
            'admin_signature' => 'nullable|string',
        ]);

        $achievement = new EmployeeAchievement($validated);
        $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');
        $achievement->academic_year_id = $activeYearId;

        // تعيين النقاط بناءً على نوع الإنجاز
        $type = AchievementType::find($request->achievement_type_id);
        if ($type) {
            $achievement->points = $type->points;
        }

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('achievements/attachments', 'public');
            $achievement->attachment_path = $path;
        }

        if ($request->filled('admin_signature')) {
            $achievement->admin_signature = $this->saveBase64Signature($request->admin_signature, 'admin');
        }

        $achievement->save();

        return back()->with('success', 'تم تسجيل الإنجاز بنجاح.');
    }

    public function update(Request $request, EmployeeAchievement $employeeAchievement)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'achievement_type_id' => 'required|exists:achievement_types,id',
            'achievement_date' => 'required|date',
            'details' => 'nullable|string',
            'attachment' => 'nullable|file|max:5120',
            'admin_signature' => 'nullable|string',
        ]);

        $employeeAchievement->fill($request->only(['user_id', 'achievement_type_id', 'achievement_date', 'details']));

        if ($request->hasFile('attachment')) {
            if ($employeeAchievement->attachment_path) {
                Storage::disk('public')->delete($employeeAchievement->attachment_path);
            }
            $path = $request->file('attachment')->store('achievements/attachments', 'public');
            $employeeAchievement->attachment_path = $path;
        }

        if ($request->filled('admin_signature') && Str::startsWith($request->admin_signature, 'data:image')) {
            if ($employeeAchievement->admin_signature) {
                Storage::disk('public')->delete($employeeAchievement->admin_signature);
            }
            $employeeAchievement->admin_signature = $this->saveBase64Signature($request->admin_signature, 'admin');
        }

        $employeeAchievement->save();

        return back()->with('success', 'تم تحديث الإنجاز بنجاح.');
    }

    public function destroy(EmployeeAchievement $employeeAchievement)
    {
        if ($employeeAchievement->admin_signature && $employeeAchievement->employee_signature) {
            return back()->with('error', 'لا يمكن حذف الإنجاز بعد اعتماده وتوقيعه من قِبل الإدارة والموظف.');
        }

        if ($employeeAchievement->attachment_path) {
            Storage::disk('public')->delete($employeeAchievement->attachment_path);
        }
        if ($employeeAchievement->admin_signature) {
            Storage::disk('public')->delete($employeeAchievement->admin_signature);
        }
        if ($employeeAchievement->employee_signature) {
            Storage::disk('public')->delete($employeeAchievement->employee_signature);
        }
        $employeeAchievement->delete();

        return back()->with('success', 'تم حذف الإنجاز بنجاح.');
    }

    public function certificate(EmployeeAchievement $achievement)
    {
        $achievement->load(['user', 'achievementType', 'branch', 'academicYear']);
        
        // التحقق من أن الموظف قام بتوقيع الإنجاز أو أن هناك توقيع إداري
        if (!$achievement->employee_signature && !$achievement->admin_signature) {
            return back()->with('error', 'لا يمكن إصدار الشهادة قبل اعتماد وتوقيع الإنجاز.');
        }

        return Inertia::render('HR/Achievements/Certificate', [
            'achievement' => $achievement
        ]);
    }

    public function notifyForSignature(Request $request, EmployeeAchievement $achievement, NotificationService $notificationService)
    {
        $request->validate([
            'channels' => 'required|array',
            'channels.*' => 'string|in:database,mail,firebase'
        ]);

        $channels = $request->channels;
        $title = 'إشعار بإنجاز جديد';
        $message = 'لقد تم تسجيل إنجاز جديد لك، يرجى مراجعة صفحة إنجازاتي للاطلاع عليه (وتوقيعه إن لزم الأمر).';

        if (in_array('database', $channels)) {
            $notificationService->sendInternalNotification(
                $achievement->user_id,
                $title,
                $message,
                'achievement',
                auth()->id()
            );
        }

        if (in_array('mail', $channels) && $achievement->user->email) {
            $notificationService->sendEmailNotification(
                $achievement->user,
                $title,
                $message,
                'إشعار إنجاز',
                url('/hr/my-achievements')
            );
        }

        if (in_array('firebase', $channels)) {
            $notificationService->sendFirebaseNotification(
                $achievement->user,
                $title,
                $message,
                ['type' => 'achievement', 'url' => '/hr/my-achievements']
            );
        }

        return back()->with('success', 'تم إرسال الإشعار للموظف بنجاح.');
    }

    public function broadcast(Request $request, EmployeeAchievement $achievement, NotificationService $notificationService)
    {
        $achievement->load(['user', 'achievementType']);
        
        $title = '🎉 احتفاء عام وتهنئة!';
        $message = "نبارك للزميل/ة " . $achievement->user->name . " حصوله/ا على إنجاز: " . $achievement->achievementType->name . ". نتمنى له/ا المزيد من التألق والنجاح!";

        // إرسال كـ Broadcast لكل الموظفين (User ID = null means broadcast in our notification service)
        $notificationService->sendBroadcastNotification(
            $title,
            $message,
            'achievement_celebration',
            auth()->id(),
            null,
            'all'
        );

        return back()->with('success', 'تم إرسال إشعار الاحتفاء العام لجميع الموظفين بنجاح.');
    }

    private function saveBase64Signature($base64String, $prefix)
    {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            return null;
        }
        $base64String = substr($base64String, strpos($base64String, ',') + 1);
        $type = strtolower($type[1]);
        $base64String = base64_decode($base64String);
        $fileName = 'achievements/signatures/' . $prefix . '_' . uniqid() . '.' . $type;
        Storage::disk('public')->put($fileName, $base64String);
        return $fileName;
    }
}
