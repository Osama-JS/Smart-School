<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\TimetableGroup;
use Illuminate\Http\Request;

class TimetableGroupController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة جدول دراسي', only: ['store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل جدول دراسي', only: ['update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف جدول دراسي', only: ['destroy']),
        ];
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'grade_ids'   => 'required|array',
            'grade_ids.*' => 'exists:grades,id',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;

        $group = TimetableGroup::create(['name' => $validated['name'], 'branch_id' => $validated['branch_id']]);
        
        $group->grades()->sync($validated['grade_ids']);

        return redirect()->back()->with('success', 'تم إضافة المجموعة بنجاح.');
    }

    public function update(Request $request, TimetableGroup $group)
    {
        if ($group->branch_id !== auth()->user()->branch_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'grade_ids'   => 'required|array',
            'grade_ids.*' => 'exists:grades,id',
        ]);

        $group->update(['name' => $validated['name']]);
        
        $group->grades()->sync($validated['grade_ids']);

        return redirect()->back()->with('success', 'تم تحديث المجموعة بنجاح.');
    }

    public function destroy(TimetableGroup $group)
    {
        if ($group->branch_id !== auth()->user()->branch_id) {
            abort(403);
        }

        $group->delete();
        return redirect()->back()->with('success', 'تم حذف المجموعة بنجاح.');
    }
}
