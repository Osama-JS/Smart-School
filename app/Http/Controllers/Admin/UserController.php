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
        $query = User::with('role', 'branch');

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

        $users = $query->latest()->paginate(15)->through(function ($user) {
            return [
                'id'        => $user->id,
                'name'      => $user->name,
                'username'  => $user->username,
                'role'      => $user->role?->name ?? '—',
                'role_id'   => $user->role_id,
                'branch'    => $user->branch?->name ?? '—',
                'is_active' => $user->is_active,
                'avatar'    => 'https://ui-avatars.com/api/?name=' . urlencode($user->name) . '&background=6b9b37&color=fff&bold=true',
            ];
        });

        $roles    = Role::select('id', 'name')->orderBy('name')->get();
        $branches = Branch::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Users/Index', [
            'users'    => $users,
            'roles'    => $roles,
            'branches' => $branches,
            'filters'  => $request->only(['search', 'role_id', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:255', 'unique:users'],
            'password'  => ['required', 'string', 'min:8'],
            'role_id'   => ['required', 'exists:roles,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'is_active' => ['boolean'],
        ]);

        User::create([
            'name'      => $validated['name'],
            'username'  => $validated['username'],
            'password'  => Hash::make($validated['password']),
            'role_id'   => $validated['role_id'],
            'branch_id' => $validated['branch_id'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('users.index')->with('success', 'تم إنشاء المستخدم بنجاح');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password'  => ['nullable', 'string', 'min:8'],
            'role_id'   => ['required', 'exists:roles,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'is_active' => ['boolean'],
        ]);

        $data = [
            'name'      => $validated['name'],
            'username'  => $validated['username'],
            'role_id'   => $validated['role_id'],
            'branch_id' => $validated['branch_id'],
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ];

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', 'تم تحديث بيانات المستخدم بنجاح');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->route('users.index')->with('success', 'تم حذف المستخدم بنجاح');
    }

    public function create()
    {
        $roles    = Role::select('id', 'name')->get();
        $branches = Branch::select('id', 'name')->get();
        return Inertia::render('Users/Create', compact('roles', 'branches'));
    }

    public function edit(User $user)
    {
        $roles    = Role::select('id', 'name')->get();
        $branches = Branch::select('id', 'name')->get();
        return Inertia::render('Users/Edit', [
            'user'     => $user,
            'roles'    => $roles,
            'branches' => $branches,
        ]);
    }
}
