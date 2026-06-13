<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ParentController extends Controller
{
    public function index(Request $request)
    {
        $query = User::whereHas('role', function ($q) {
            $q->where('name', 'ولي أمر');
        })->with('children.user'); // جلب الأبناء أيضاً

        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('national_id', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
        }

        $parents = $query->paginate(10)->withQueryString();

        return Inertia::render('Academic/Parents/Index', compact('parents'));
    }

    public function create()
    {
        return Inertia::render('Academic/Parents/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'username'    => 'required|string|max:255|unique:users',
            'password'    => 'required|string|min:8',
            'email'       => 'nullable|email|unique:users',
            'phone'       => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:50',
            'address'     => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $parentRole = Role::where('name', 'ولي أمر')->firstOrFail();

        $user = User::create([
            'name'        => $validated['name'],
            'username'    => $validated['username'],
            'password'    => Hash::make($validated['password']),
            'email'       => $validated['email'] ?? null,
            'phone'       => $validated['phone'] ?? null,
            'national_id' => $validated['national_id'] ?? null,
            'address'     => $validated['address'] ?? null,
            'role_id'     => $parentRole->id,
            'branch_id'   => auth()->user()->branch_id,
            'is_active'   => $validated['is_active'] ?? 1,
        ]);

        return redirect()->route('academic.parents')->with('success', 'تم إضافة حساب ولي الأمر بنجاح.');
    }

    public function quickStore(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'username'    => 'required|string|max:255|unique:users',
            'password'    => 'required|string|min:8',
            'phone'       => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:50',
        ]);

        $parentRole = Role::where('name', 'ولي أمر')->firstOrFail();

        $user = User::create([
            'name'        => $validated['name'],
            'username'    => $validated['username'],
            'password'    => Hash::make($validated['password']),
            'phone'       => $validated['phone'] ?? null,
            'national_id' => $validated['national_id'] ?? null,
            'role_id'     => $parentRole->id,
            'branch_id'   => auth()->user()->branch_id,
            'is_active'   => 1,
        ]);

        return response()->json([
            'success' => true,
            'parent' => [
                'id' => $user->id,
                'name' => $user->name,
                'national_id' => $user->national_id
            ]
        ]);
    }

    public function edit(User $parent)
    {
        // التأكد من أن المستخدم هو ولي أمر فعلاً
        abort_if($parent->role->name !== 'ولي أمر', 403);
        
        $parent->load('children.user', 'children.currentEnrollment.division.grade');

        return Inertia::render('Academic/Parents/Edit', compact('parent'));
    }

    public function update(Request $request, User $parent)
    {
        abort_if($parent->role->name !== 'ولي أمر', 403);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'username'    => ['required', 'string', 'max:255', Rule::unique('users')->ignore($parent->id)],
            'password'    => 'nullable|string|min:8',
            'email'       => ['nullable', 'email', Rule::unique('users')->ignore($parent->id)],
            'phone'       => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:50',
            'address'     => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $parent->name = $validated['name'];
        $parent->username = $validated['username'];
        $parent->email = $validated['email'] ?? null;
        $parent->phone = $validated['phone'] ?? null;
        $parent->national_id = $validated['national_id'] ?? null;
        $parent->address = $validated['address'] ?? null;
        $parent->is_active = $validated['is_active'] ?? 1;

        if (!empty($validated['password'])) {
            $parent->password = Hash::make($validated['password']);
        }

        $parent->save();

        return redirect()->route('academic.parents')->with('success', 'تم تحديث بيانات ولي الأمر بنجاح.');
    }

    public function destroy(User $parent)
    {
        abort_if($parent->role->name !== 'ولي أمر', 403);

        $parent->delete();

        return redirect()->route('academic.parents')->with('success', 'تم حذف حساب ولي الأمر.');
    }
}
