<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AcademicYear;

class MobileAuthController extends Controller
{
    /**
     * Mobile login supporting both email and username
     */
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required',
            'password' => 'required',
        ]);

        $login_type = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::where($login_type, $request->login)->with(['role', 'employee', 'branch'])->first();

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

        // Get user permissions
        $permissions = $user->role ? $user->role->permissions()->pluck('name')->toArray() : [];

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الدخول بنجاح.',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'role_name' => $user->role->name ?? '',
                    'role_id' => $user->role_id,
                    'is_system_role' => $user->role->is_system_role ?? false,
                    'employee_id' => $user->employee->id ?? null,
                    'phone' => $user->phone ?? null,
                    'branch_id' => $user->branch_id ?? null,
                    'branch_name' => $user->branch->name ?? null,
                    'academic_year_name' => $user->branch_id ? optional(AcademicYear::currentForBranch($user->branch_id))->name : null,
                    'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                    'permissions' => $permissions,
                ]
            ]
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
}
