<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::query()->with(['manager']);

        // Search by name, address, or phone
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('address', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by Status
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Filter by Staff Density Range
        if ($request->filled('staff_range')) {
            if ($request->staff_range === 'empty') {
                $query->has('employees', '=', 0);
            } elseif ($request->staff_range === 'low') {
                $query->has('employees', '>=', 1)->has('employees', '<=', 5);
            } elseif ($request->staff_range === 'medium') {
                $query->has('employees', '>=', 6)->has('employees', '<=', 15);
            } elseif ($request->staff_range === 'high') {
                $query->has('employees', '>=', 16);
            }
        }

        // Sorting
        $query->withCount('employees');
        if ($request->filled('sort_by')) {
            if ($request->sort_by === 'name_asc') {
                $query->orderBy('name', 'asc');
            } elseif ($request->sort_by === 'name_desc') {
                $query->orderBy('name', 'desc');
            } elseif ($request->sort_by === 'employees_desc') {
                $query->orderBy('employees_count', 'desc');
            } elseif ($request->sort_by === 'employees_asc') {
                $query->orderBy('employees_count', 'asc');
            } elseif ($request->sort_by === 'active_first') {
                $query->orderBy('is_active', 'desc')->orderBy('name', 'asc');
            }
        } else {
            $query->orderBy('name', 'asc');
        }

        $branches = $query->paginate(12)->withQueryString();
        
        $users = \App\Models\User::select('id', 'name', 'national_id')->get();

        return Inertia::render('HR/Branches/Index', [
            'branches' => $branches,
            'users' => $users,
            'filters'  => $request->only(['search', 'status', 'staff_range', 'sort_by']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'address'        => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:50',
            'is_active'      => 'boolean',
            'latitude'       => 'nullable|numeric|between:-90,90',
            'longitude'      => 'nullable|numeric|between:-180,180',
            'radius_meters'  => 'nullable|integer|min:50|max:50000',
        ]);

        Branch::create($validated);

        return redirect()->route('hr.branches')->with('success', 'تمت إضافة الفرع بنجاح');
    }

    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'address'        => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:50',
            'is_active'      => 'boolean',
            'latitude'       => 'nullable|numeric|between:-90,90',
            'longitude'      => 'nullable|numeric|between:-180,180',
            'radius_meters'  => 'nullable|integer|min:50|max:50000',
        ]);

        $branch->update($validated);

        return redirect()->route('hr.branches')->with('success', 'تم تعديل الفرع بنجاح');
    }

    public function assignManager(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $managerRole = \App\Models\Role::where('name', 'مدير الفرع')->firstOrFail();

        // إزالة صلاحية "مدير الفرع" من أي مدير سابق لهذا الفرع
        \App\Models\User::where('branch_id', $branch->id)
            ->where('role_id', $managerRole->id)
            ->update(['role_id' => null]);

        // تعيين المستخدم الجديد كمدير الفرع للفرع
        $user = \App\Models\User::findOrFail($validated['user_id']);
        $user->update([
            'branch_id' => $branch->id,
            'role_id' => $managerRole->id
        ]);

        return redirect()->route('hr.branches')->with('success', 'تم تعيين مدير الفرع بنجاح');
    }

    public function destroy(Branch $branch)
    {
        $branch->delete();
        return redirect()->route('hr.branches')->with('success', 'تم حذف الفرع بنجاح');
    }
}
