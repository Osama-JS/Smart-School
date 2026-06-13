<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Role;
use App\Models\Branch;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $userAuth = auth()->user();
        $isAdmin = $userAuth && $userAuth->role && $userAuth->role->name === 'مدير الفرع';

        $query = User::with('role', 'branch');

        if (!$isAdmin) {
            $query->where('branch_id', $userAuth->branch_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('username', 'like', "%$search%");
            });
        }

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active' ? 1 : 0);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('created_at')) {
            $range = $request->created_at;
            if ($range === 'today') {
                $query->whereDate('created_at', today());
            } elseif ($range === 'week') {
                $query->where('created_at', '>=', now()->subWeek());
            } elseif ($range === 'month') {
                $query->where('created_at', '>=', now()->subMonth());
            }
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');

        if (in_array($sortBy, ['name', 'username', 'role_id', 'branch_id', 'is_active', 'created_at'])) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->latest();
        }

        $users = $query->paginate(15)->through(function ($user) {
            // Generate deterministic mock info based on user ID for demonstration
            $mockTimes = ['نشط الآن', 'نشط منذ 5 دقائق', 'نشط منذ ساعتين', 'نشط منذ يومين', 'لم يسجل دخول بعد'];
            $mockDevices = ['كمبيوتر (Windows)', 'جوال (iPhone)', 'كمبيوتر (Mac)', 'جوال (Android)', '—'];
            
            $timeIndex = $user->id % count($mockTimes);
            $deviceIndex = $user->id % count($mockDevices);

            if ($user->username === 'admin') {
                $lastLogin = 'نشط الآن';
                $device = 'كمبيوتر (Windows)';
            } else {
                $lastLogin = $mockTimes[$timeIndex];
                $device = $mockDevices[$deviceIndex];
            }

            return [
                'id'         => $user->id,
                'name'       => $user->name,
                'username'   => $user->username,
                'role'       => $user->role?->name ?? '—',
                'role_id'    => $user->role_id,
                'branch'     => $user->branch?->name ?? '—',
                'is_active'  => $user->is_active,
                'avatar'     => 'https://ui-avatars.com/api/?name=' . urlencode($user->name) . '&background=6b9b37&color=fff&bold=true',
                'last_login' => $lastLogin,
                'device'     => $device,
            ];
        });

        $roles    = Role::select('id', 'name')->orderBy('name')->get();
        $branches = Branch::select('id', 'name')->orderBy('name')->get();

        $baseStatQuery = User::query();
        if (!$isAdmin) {
            $baseStatQuery->where('branch_id', $userAuth->branch_id);
        }

        $stats = [
            'total'    => (clone $baseStatQuery)->count(),
            'teachers' => (clone $baseStatQuery)->whereHas('role', function ($q) {
                $q->where('name', 'like', '%معلم%');
            })->count(),
            'admins'   => (clone $baseStatQuery)->whereHas('role', function ($q) {
                $q->where('name', 'like', '%مدير%');
            })->count(),
            'inactive' => (clone $baseStatQuery)->where('is_active', 0)->count(),
        ];



        return Inertia::render('Users/Index', [
            'users'    => $users,
            'roles'    => $roles,
            'branches' => $isAdmin ? $branches : [],
            'filters'  => $request->only(['search', 'role_id', 'status', 'branch_id', 'created_at', 'sort_by', 'sort_dir']),
            'stats'    => $stats,
            'isAdmin'  => $isAdmin,
        ]);
    }

    public function resetPassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('users.index')->with('success', 'تم إعادة تعيين كلمة مرور المستخدم ' . $user->name . ' بنجاح');
    }

    public function quickUpdate(Request $request, User $user)
    {
        $isAdmin = auth()->user()->role && auth()->user()->role->name === 'مدير الفرع';
        
        $validated = $request->validate([
            'is_active' => ['nullable', 'boolean'],
            'branch_id' => [$isAdmin ? 'nullable' : '', $isAdmin ? 'exists:branches,id' : ''],
            'role_id'   => ['nullable', 'exists:roles,id'],
        ]);

        if (!$isAdmin && $user->branch_id !== auth()->user()->branch_id) {
            abort(403, 'لا يمكنك تعديل مستخدم خارج فرعك');
        }

        $user->update(array_filter($validated, function ($value) {
            return $value !== null;
        }));

        return redirect()->back()->with('success', 'تم تحديث بيانات المستخدم بنجاح');
    }

    public function bulk(Request $request)
    {
        $validated = $request->validate([
            'ids'       => ['required', 'array'],
            'ids.*'     => ['exists:users,id'],
            'action'    => ['required', 'string', 'in:delete,activate,deactivate,change_branch'],
            'branch_id' => ['required_if:action,change_branch', 'nullable', 'exists:branches,id'],
        ]);

        $ids = $validated['ids'];
        $action = $validated['action'];
        
        $isAdmin = auth()->user()->role && auth()->user()->role->name === 'مدير الفرع';
        if (!$isAdmin) {
            // Verify all IDs belong to manager's branch
            $validIds = User::whereIn('id', $ids)->where('branch_id', auth()->user()->branch_id)->pluck('id')->toArray();
            if (count($validIds) !== count($ids)) {
                abort(403, 'بعض المستخدمين لا يتبعون لفرعك');
            }
        }

        if ($action === 'delete') {
            if (in_array(auth()->user()->id, $ids)) {
                abort(403, 'لا يمكنك حذف حسابك الشخصي ضمن العملية المجمعة');
            }
            User::whereIn('id', $ids)->delete();
            $message = 'تم حذف المستخدمين المحددين بنجاح';
        } elseif ($action === 'activate') {
            User::whereIn('id', $ids)->update(['is_active' => 1]);
            $message = 'تم تفعيل الحسابات المحددة بنجاح';
        } elseif ($action === 'deactivate') {
            User::whereIn('id', $ids)->update(['is_active' => 0]);
            $message = 'تم تعطيل الحسابات المحددة بنجاح';
        } elseif ($action === 'change_branch') {
            User::whereIn('id', $ids)->update(['branch_id' => $validated['branch_id']]);
            $message = 'تم تغيير الفرع للمستخدمين المحددين بنجاح';
        }

        return redirect()->route('users.index')->with('success', $message);
    }

    public function store(Request $request)
    {
        $isAdmin = auth()->user()->role && auth()->user()->role->name === 'مدير الفرع';
        
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:255', 'unique:users'],
            'password'  => ['required', 'string', 'min:8'],
            'role_id'   => ['required', 'exists:roles,id'],
            'branch_id' => [$isAdmin ? 'required' : 'nullable', $isAdmin ? 'exists:branches,id' : ''],
            'is_active' => ['boolean'],
        ]);

        User::create([
            'name'      => $validated['name'],
            'username'  => $validated['username'],
            'password'  => Hash::make($validated['password']),
            'role_id'   => $validated['role_id'],
            'branch_id' => $isAdmin ? $validated['branch_id'] : auth()->user()->branch_id,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('users.index')->with('success', 'تم إنشاء المستخدم بنجاح');
    }

    public function update(Request $request, User $user)
    {
        $isAdmin = auth()->user()->role && auth()->user()->role->name === 'مدير الفرع';
        
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password'  => ['nullable', 'string', 'min:8'],
            'role_id'   => ['required', 'exists:roles,id'],
            'branch_id' => [$isAdmin ? 'required' : 'nullable', $isAdmin ? 'exists:branches,id' : ''],
            'is_active' => ['boolean'],
        ]);

        if (!$isAdmin && $user->branch_id !== auth()->user()->branch_id) {
            abort(403, 'لا يمكنك تعديل مستخدم خارج فرعك');
        }

        $data = [
            'name'      => $validated['name'],
            'username'  => $validated['username'],
            'role_id'   => $validated['role_id'],
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ];
        
        if ($isAdmin) {
            $data['branch_id'] = $validated['branch_id'];
        }

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', 'تم تحديث بيانات المستخدم بنجاح');
    }

    public function destroy(User $user)
    {
        $userAuth = auth()->user();
        if ($user->id === $userAuth->id) {
            abort(403, 'لا يمكنك حذف حسابك الشخصي');
        }

        $isAdmin = $userAuth->role && $userAuth->role->name === 'مدير الفرع';
        if (!$isAdmin && $user->branch_id !== $userAuth->branch_id) {
            abort(403, 'لا يمكنك حذف مستخدم خارج فرعك');
        }

        $user->delete();
        return redirect()->route('users.index')->with('success', 'تم حذف المستخدم بنجاح');
    }

    public function create()
    {
        $userAuth = auth()->user();
        $isAdmin = $userAuth && $userAuth->role && $userAuth->role->name === 'مدير الفرع';
        
        $roles    = Role::select('id', 'name')->get();
        $branches = $isAdmin ? Branch::select('id', 'name')->get() : [];
        return Inertia::render('Users/Create', compact('roles', 'branches', 'isAdmin'));
    }

    public function edit(User $user)
    {
        $userAuth = auth()->user();
        $isAdmin = $userAuth && $userAuth->role && $userAuth->role->name === 'مدير الفرع';
        
        $roles    = Role::select('id', 'name')->get();
        $branches = $isAdmin ? Branch::select('id', 'name')->get() : [];
        return Inertia::render('Users/Edit', [
            'user'     => $user,
            'roles'    => $roles,
            'branches' => $branches,
            'isAdmin'  => $isAdmin,
        ]);
    }
}
