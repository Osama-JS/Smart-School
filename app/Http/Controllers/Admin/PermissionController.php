<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use App\Models\PermissionModule;
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

        // جميع الأقسام المعرَّفة (بما فيها الفارغة)
        $modules = PermissionModule::orderBy('is_system', 'desc')
            ->orderBy('label')
            ->get()
            ->map(fn($m) => [
                'key'               => $m->key,
                'label'             => $m->label,
                'is_system'         => $m->is_system,
                'permissions_count' => Permission::where('module', $m->key)->count(),
            ]);

        // تجميع الصلاحيات مع ضمان ظهور جميع الأقسام (حتى الفارغة منها)
        $permissions = Permission::all()->groupBy('module')->map(function ($group, $module) {
            return [
                'module' => $module,
                'items'  => $group->map(fn($p) => ['id' => $p->id, 'name' => $p->name])->values(),
            ];
        });

        // إضافة الأقسام التي ليس بها صلاحيات بعد
        foreach ($modules as $mod) {
            if (!$permissions->has($mod['key'])) {
                $permissions->put($mod['key'], [
                    'module' => $mod['key'],
                    'items'  => [],
                ]);
            }
        }
        $permissions = $permissions->values();

        return Inertia::render('Admin/Permissions/Index', [
            'roles'       => $roles,
            'permissions' => $permissions,
            'modules'     => $modules,
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
     * تعديل قسم (module) صلاحية معينة
     */
    public function updateModule(Request $request, Permission $permission)
    {
        $request->validate([
            'module' => ['required', 'string', 'exists:permission_modules,key'],
        ]);

        $permission->update(['module' => $request->module]);

        return back()->with('success', "تم نقل الصلاحية \"{$permission->name}\" بنجاح");
    }

    /**
     * إنشاء قسم جديد
     */
    public function storeModule(Request $request)
    {
        $request->validate([
            'key'   => ['required', 'string', 'max:60', 'unique:permission_modules,key',
                        'regex:/^[a-z][a-z0-9_]*$/'],
            'label' => ['required', 'string', 'max:100'],
        ], [
            'key.regex'  => 'معرف القسم يجب أن يبدأ بحرف إنجليزي صغير ويحتوي على أحرف وأرقام وشرطة سفلية فقط.',
            'key.unique' => 'هذا المعرف مستخدم بالفعل.',
        ]);

        PermissionModule::create([
            'key'       => $request->key,
            'label'     => $request->label,
            'is_system' => false,
        ]);

        return back()->with('success', "تم إنشاء القسم \"{$request->label}\" بنجاح");
    }

    /**
     * حذف قسم (يُسمح فقط إذا كان فارغاً)
     */
    public function destroyModule(Request $request, string $key)
    {
        $module = PermissionModule::where('key', $key)->firstOrFail();

        $count = Permission::where('module', $key)->count();
        if ($count > 0) {
            return back()->with('error', "لا يمكن حذف القسم لوجود {$count} صلاحية مرتبطة به. انقل الصلاحيات أولاً.");
        }

        $module->delete();

        return back()->with('success', "تم حذف القسم \"{$module->label}\" بنجاح");
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

    /**
     * تحديث دور موجود
     */
    public function updateRole(Request $request, Role $role)
    {
        if ($role->is_system_role && $request->name !== $role->name) {
            return back()->with('error', 'لا يمكن تغيير اسم دور أساسي في النظام');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'access_type' => 'nullable|in:dashboard,app,both'
        ]);

        $role->update([
            'name' => $validated['name'],
            'access_type' => $validated['access_type'] ?? $role->access_type,
        ]);

        return back()->with('success', 'تم تحديث الدور بنجاح');
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
