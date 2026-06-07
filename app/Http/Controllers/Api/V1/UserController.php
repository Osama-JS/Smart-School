<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * جلب قائمة مستخدمي الفرع
     */
    public function index()
    {
        // بفضل الـ Global Scope، سيجلب مستخدمي فرع مدير الفرع الحالي فقط، أو كل المستخدمين لمدير النظام
        $users = User::with(['role', 'branch'])->get();

        return response()->json([
            'status' => true,
            'data' => $users
        ]);
    }

    /**
     * إضافة مستخدم جديد للفرع
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:255', 'unique:users,username'],
            'password'  => ['required', 'string', 'min:8'],
            'role_id'   => ['required', 'exists:roles,id'],
            'is_active' => ['boolean'],
            // branch_id اختياري، وإذا لم يمرر سيتم إسناده تلقائياً لفرع المدير الحالي بفضل الـ Trait
            'branch_id' => ['nullable', 'exists:branches,id'],
        ]);

        // تعمية كلمة المرور
        $validated['password'] = Hash::make($validated['password']);

        // إنشاء المستخدم
        $user = User::create($validated);

        return response()->json([
            'status' => true,
            'message' => 'تم إنشاء المستخدم بنجاح',
            'data' => $user->load(['role', 'branch'])
        ], 201);
    }

    /**
     * عرض تفاصيل مستخدم معين
     */
    public function show($id)
    {
        // سيعيد 404 تلقائياً إذا كان المستخدم ينتمي لفرع آخر
        $user = User::with(['role', 'branch'])->findOrFail($id);

        return response()->json([
            'status' => true,
            'data' => $user
        ]);
    }

    /**
     * تحديث بيانات مستخدم
     */
    public function update(Request $request, $id)
    {
        // سيعيد 404 تلقائياً إذا كان المستخدم ينتمي لفرع آخر
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'      => ['nullable', 'string', 'max:255'],
            'username'  => ['nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'password'  => ['nullable', 'string', 'min:8'],
            'role_id'   => ['nullable', 'exists:roles,id'],
            'is_active' => ['nullable', 'boolean'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update(array_filter($validated, fn($value) => $value !== null));

        return response()->json([
            'status' => true,
            'message' => 'تم تحديث بيانات المستخدم بنجاح',
            'data' => $user->load(['role', 'branch'])
        ]);
    }

    /**
     * حذف مستخدم
     */
    public function destroy($id)
    {
        // سيعيد 404 تلقائياً إذا كان المستخدم ينتمي لفرع آخر
        $user = User::findOrFail($id);

        $user->delete();

        return response()->json([
            'status' => true,
            'message' => 'تم حذف المستخدم بنجاح'
        ]);
    }
}
