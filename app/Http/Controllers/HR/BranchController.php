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
        $query = Branch::query();

        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('address', 'like', '%' . $request->search . '%');
        }

        $branches = $query->withCount('employees')->paginate(10)->withQueryString();

        return Inertia::render('HR/Branches/Index', [
            'branches' => $branches,
            'filters'  => $request->only(['search']),
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

    public function destroy(Branch $branch)
    {
        $branch->delete();
        return redirect()->route('hr.branches')->with('success', 'تم حذف الفرع بنجاح');
    }
}
