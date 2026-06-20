<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\ViolationType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ViolationTypeController extends Controller
{
    public function index()
    {
        $types = ViolationType::query()
            ->orderBy('name')
            ->get();

        $stats = [
            'total' => ViolationType::count(),
            'active' => ViolationType::where('is_active', true)->count(),
            'inactive' => ViolationType::where('is_active', false)->count(),
        ];

        return Inertia::render('HR/Violations/Types', [
            'types' => $types,
            'stats' => $stats
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_action' => 'required|string|max:255',
            'is_active' => 'boolean'
        ]);

        ViolationType::create($validated);

        return back()->with('success', 'تم إضافة نوع المخالفة بنجاح.');
    }

    public function update(Request $request, ViolationType $violationType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_action' => 'required|string|max:255',
            'is_active' => 'boolean'
        ]);

        $violationType->update($validated);

        return back()->with('success', 'تم تحديث نوع المخالفة بنجاح.');
    }

    public function destroy(ViolationType $violationType)
    {
        $violationType->delete();
        return back()->with('success', 'تم حذف نوع المخالفة بنجاح.');
    }
}
