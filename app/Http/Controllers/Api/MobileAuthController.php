<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\AcademicYear;
use App\Models\Enrollment;
use Illuminate\Support\Facades\Hash;

class MobileAuthController extends Controller
{
    /**
     * Mobile login via email or username
     */
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required',
            'password' => 'required',
        ]);

        $login_type = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::where($login_type, $request->login)->with(['role', 'employee.department', 'branch', 'student'])->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات الدخول غير صحيحة.'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'الحساب موقوف، الرجاء مراجعة الإدارة.'
            ], 401);
        }

        // Check if user's role allows mobile app access
        if ($user->role && !in_array($user->role->access_type, ['app', 'both'])) {
            return response()->json([
                'success' => false,
                'message' => 'ليس لديك صلاحية الدخول لتطبيق الهاتف.'
            ], 403);
        }

        $token = $user->createToken('mobile_app_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الدخول بنجاح.',
            'data' => [
                'token' => $token,
                'user' => $this->formatUserData($user),
            ]
        ]);
    }

    /**
     * Get the authenticated user's rich profile details
     */
    public function getProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 401);
        }

        $user->load(['role', 'employee.department', 'branch', 'student']);

        return response()->json([
            'success' => true,
            'data' => $this->formatUserData($user),
        ]);
    }

    /**
     * Mobile logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح.'
        ]);
    }

    /**
     * Mobile change password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ], [
            'current_password.required' => 'كلمة المرور الحالية مطلوبة',
            'new_password.required' => 'كلمة المرور الجديدة مطلوبة',
            'new_password.min' => 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل',
            'new_password.confirmed' => 'تأكيد كلمة المرور غير متطابق',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'كلمة المرور الحالية غير صحيحة.'
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تغيير كلمة المرور بنجاح.'
        ]);
    }

    /**
     * جلب الحسابات المرتبطة للمستخدم الحالي (Mobile)
     */
    public function getLinkedAccounts(Request $request)
    {
        $user = $request->user();
        $linkedAccounts = $user->getLinkedAccounts()->map(function ($account) {
            return [
                'id' => $account->id,
                'name' => $account->name,
                'username' => $account->username,
                'email' => $account->email,
                'role_name' => $account->role->name ?? '',
                'branch_id' => $account->branch_id,
                'branch_name' => $account->branch->name ?? '',
                'avatar' => $account->avatar ? asset('storage/' . $account->avatar) : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $linkedAccounts
        ]);
    }

    /**
     * التبديل السريع إلى حساب مرتبط في فرع آخر (Mobile)
     */
    public function switchAccount(Request $request, User $user)
    {
        $currentUser = $request->user();

        $linkedAccounts = $currentUser->getLinkedAccounts();
        $isLinked = $linkedAccounts->contains('id', $user->id);

        if (!$isLinked) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بالتبديل إلى هذا الحساب.'
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'الحساب المطلوب معطل حالياً.'
            ], 403);
        }

        // Generate new token for the target user
        $user->load(['role', 'employee.department', 'branch', 'student']);
        $token = $user->createToken('mobile_app_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم التبديل بنجاح.',
            'data' => [
                'token' => $token,
                'user' => $this->formatUserData($user),
            ]
        ]);
    }

    /**
     * Format rich role-specific user payload
     */
    private function formatUserData(User $user): array
    {
        $permissions = $user->role ? $user->role->permissions()->pluck('name')->toArray() : [];
        $roleName = $user->role->name ?? '';

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'role_name' => $roleName,
            'role_id' => $user->role_id,
            'is_system_role' => $user->role->is_system_role ?? false,
            'phone' => $user->phone ?? null,
            'national_id' => $user->national_id ?? null,
            'branch_id' => $user->branch_id ?? null,
            'branch_name' => $user->branch->name ?? null,
            'academic_year_name' => $user->branch_id ? optional(AcademicYear::currentForBranch($user->branch_id))->name : null,
            'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
            'permissions' => $permissions,
        ];

        // Specific to Teacher / Employee
        if ($user->employee) {
            $userData['employee_id'] = $user->employee->id;
            $userData['job_title'] = $user->employee->job_title ?? $roleName;
            $userData['specialization'] = $user->employee->specialization ?? null;
            $userData['department_name'] = $user->employee->department?->name ?? null;
            $userData['hire_date'] = $user->employee->hire_date ? $user->employee->hire_date->format('Y-m-d') : null;
            $userData['address'] = $user->employee->address ?? null;
            if (empty($userData['national_id'])) {
                $userData['national_id'] = $user->employee->national_id;
            }
        }

        // Specific to Student
        if ($user->student) {
            $student = $user->student;
            $enrollment = Enrollment::with(['division.grade', 'division.homeroomTeacher', 'academicYear'])
                ->where('student_id', $student->id)
                ->where('status', 'active')
                ->latest()
                ->first();

            $userData['student_id'] = $student->id;
            $userData['grade_name'] = $enrollment?->division?->grade?->name ?? 'غير محدد';
            $userData['division_name'] = $enrollment?->division?->name ?? 'غير محدد';
            $userData['enrollment_status'] = $enrollment?->status ?? 'نشط';
            $userData['transport_subscription'] = $student->transport_subscription ? 'مشترك في النقل المدرسي 🚌' : 'غير مشترك';
            
            // Homeroom teacher
            $homeroomTeacher = $enrollment?->division?->homeroomTeacher;
            $userData['homeroom_teacher_name'] = $homeroomTeacher?->name ?? null;
        }

        // Specific to Parent
        if ($roleName === 'ولي أمر' || $roleName === 'ولي امر') {
            $children = $user->children()
                ->with(['enrollments' => function($q) {
                    $q->where('status', 'active')->with('division.grade');
                }])
                ->get()
                ->map(function($ch) {
                    $en = $ch->enrollments->first();
                    return [
                        'id' => $ch->id,
                        'name' => $ch->name ?? ($ch->user?->name ?? 'ابن'),
                        'grade' => $en?->division?->grade?->name ?? 'غير محدد',
                        'division' => $en?->division?->name ?? 'غير محدد',
                        'relationship' => $ch->pivot->relationship_type ?? 'ولي أمر',
                    ];
                });

            $userData['children_count'] = $children->count();
            $userData['children_list'] = $children->values()->toArray();
        }

        return $userData;
    }
}
