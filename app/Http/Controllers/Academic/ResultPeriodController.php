<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\ResultPeriod;
use App\Models\Semester;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class ResultPeriodController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:إدارة الدرجات', only: ['index', 'store', 'update', 'destroy']),
        ];
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير النظام';

        $query = ResultPeriod::with(['semester.academicYear', 'branch']);

        if (!$isAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        $periods = $query->orderBy('fill_start_date', 'desc')->get();

        $semesters = Semester::with('academicYear')->orderBy('start_date', 'desc')->get();
        $branches = $isAdmin ? Branch::select('id', 'name')->get() : [];

        return Inertia::render('Academic/ResultPeriods/Index', [
            'periods'   => $periods,
            'semesters' => $semesters,
            'branches'  => $branches,
            'isAdmin'   => $isAdmin,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير النظام';

        $rules = [
            'semester_id'     => 'required|exists:semesters,id',
            'month_name'      => 'required|string|max:255',
            'fill_start_date' => 'required|date',
            'fill_end_date'   => 'required|date|after_or_equal:fill_start_date',
        ];

        if ($isAdmin) {
            $rules['branch_id'] = 'required|exists:branches,id';
        }

        $validated = $request->validate($rules);

        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        ResultPeriod::create($validated);

        return redirect()->back()->with('success', 'تم إنشاء فترة الرصد بنجاح');
    }

    public function update(Request $request, ResultPeriod $resultPeriod)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير النظام';

        if (!$isAdmin && $resultPeriod->branch_id !== $user->branch_id) {
            abort(403);
        }

        $rules = [
            'semester_id'     => 'required|exists:semesters,id',
            'month_name'      => 'required|string|max:255',
            'fill_start_date' => 'required|date',
            'fill_end_date'   => 'required|date|after_or_equal:fill_start_date',
        ];

        if ($isAdmin) {
            $rules['branch_id'] = 'required|exists:branches,id';
        }

        $validated = $request->validate($rules);

        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        $resultPeriod->update($validated);

        return redirect()->back()->with('success', 'تم تعديل فترة الرصد بنجاح');
    }

    public function destroy(ResultPeriod $resultPeriod)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير النظام';

        if (!$isAdmin && $resultPeriod->branch_id !== $user->branch_id) {
            abort(403);
        }

        if ($resultPeriod->monthlyGrades()->exists()) {
            return redirect()->back()->with('error', 'لا يمكن حذف هذه الفترة لوجود درجات مرصودة مرتبطة بها');
        }

        $resultPeriod->delete();

        return redirect()->back()->with('success', 'تم حذف فترة الرصد بنجاح');
    }
}
