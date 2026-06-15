<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * عرض صفحة الصلاحيات مع الأدوار وصلاحياتها
     */
    public function index()
    {
        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id'          => $role->id,
                'name'        => $role->name,
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'users_count' => $role->users()->count(),
            ];
        });

        // تجميع الصلاحيات حسب الوحدة
        $permissions = Permission::all()->groupBy('module')->map(function ($group, $module) {
            return [
                'module' => $module,
                'items'  => $group->map(fn($p) => ['id' => $p->id, 'name' => $p->name])->values(),
            ];
        })->values();

        return Inertia::render('Admin/Permissions/Index', [
            'roles'       => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * تحديث صلاحيات دور معين
     */
    public function syncRolePermissions(Request $request, Role $role)
    {
        $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $permissionIds = Permission::whereIn('name', $request->permissions ?? [])->pluck('id');
        $role->permissions()->sync($permissionIds);

        return redirect()->route('admin.permissions')->with('success', "تم تحديث صلاحيات دور \"{$role->name}\" بنجاح");
    }

    /**
     * إضافة دور جديد
     */
    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name|max:255',
            'access_type' => 'nullable|in:dashboard,app,both'
        ]);

        Role::create([
            'name' => $validated['name'],
            'access_type' => $validated['access_type'] ?? 'dashboard',
            'is_system_role' => false
        ]);

        return back()->with('success', 'تم إضافة الدور بنجاح');
    }

    public function destroyRole(Role $role)
    {
        if ($role->is_system_role) {
            return back()->with('error', 'لا يمكن حذف دور أساسي في النظام');
        }

        if ($role->users()->count() > 0) {
            return back()->with('error', 'لا يمكن حذف الدور لارتباطه بمستخدمين');
        }

        $role->delete();

        return back()->with('success', 'تم حذف الدور بنجاح');
    }
}
