<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AcademicYearController extends Controller
{
    public function index(Request $request)
    {
        $query = AcademicYear::with('semesters')->withCount('semesters');

        // Apply filters
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);
        
        if ($isAdmin) {
            if ($request->filled('branch_id') && $request->branch_id !== 'all') {
                $query->where('branch_id', $request->branch_id);
            }
        } else {
            $query->where(function($q) use ($user) {
                $q->where('branch_id', $user->branch_id)
                  ->orWhereNull('branch_id');
            });
        }

        $query->orderBy('start_date', 'desc');

        $academicYears = $query->paginate(10)->withQueryString();
        $branches = $isAdmin ? Branch::select('id', 'name')->get() : [];

        // Stats
        $stats = [
            'total_years' => AcademicYear::count(),
            'active_years' => AcademicYear::where('is_active', true)->count(),
            'total_semesters' => Semester::count(),
        ];

        return Inertia::render('Academic/Years/Index', [
            'academicYears' => $academicYears,
            'branches' => $branches,
            'isAdmin' => $isAdmin,
            'stats' => $stats,
            'filters' => (object) $request->only(['search', 'status', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
            'branch_id'  => 'nullable|exists:branches,id',
            'notes'      => 'nullable|string',
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);

        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        DB::beginTransaction();
        try {
            // Create the year
            $year = AcademicYear::create($validated);

            // Create two default semesters
            Semester::create([
                'academic_year_id' => $year->id,
                'name' => 'الفصل الأول',
                'term_number' => 1,
                'start_date' => $year->start_date,
                'end_date' => $year->start_date->copy()->addMonths(4), // Approximation
                'is_active' => false,
            ]);

            Semester::create([
                'academic_year_id' => $year->id,
                'name' => 'الفصل الثاني',
                'term_number' => 2,
                'start_date' => $year->start_date->copy()->addMonths(4)->addDays(1),
                'end_date' => $year->end_date,
                'is_active' => false,
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'تم إضافة السنة الدراسية والفصول الافتراضية بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء الإضافة: ' . $e->getMessage());
        }
    }

    public function update(Request $request, AcademicYear $academicYear)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
            'branch_id'  => 'nullable|exists:branches,id',
            'notes'      => 'nullable|string',
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);

        if (!$isAdmin && $academicYear->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بتعديل بيانات هذا الفرع');
        }

        if (!$isAdmin) {
            $validated['branch_id'] = $user->branch_id;
        }

        $academicYear->update($validated);

        return redirect()->back()->with('success', 'تم تعديل بيانات السنة الدراسية بنجاح');
    }

    public function destroy(AcademicYear $academicYear)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);

        if (!$isAdmin && $academicYear->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك');
        }

        $academicYear->delete();
        return redirect()->back()->with('success', 'تم حذف السنة الدراسية بنجاح');
    }

    public function toggleActive(AcademicYear $academicYear)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);

        if (!$isAdmin && $academicYear->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك');
        }

        DB::beginTransaction();
        try {
            if (!$academicYear->is_active) {
                // Deactivate all other years for the same branch
                AcademicYear::where('branch_id', $academicYear->branch_id)
                    ->where('id', '!=', $academicYear->id)
                    ->update(['is_active' => false]);
                
                $academicYear->update(['is_active' => true]);
                $msg = 'تم تفعيل السنة الدراسية. تم تعطيل بقية السنوات تلقائياً.';
            } else {
                $academicYear->update(['is_active' => false]);
                $msg = 'تم تعطيل السنة الدراسية.';
            }

            DB::commit();
            return redirect()->back()->with('success', $msg);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ.');
        }
    }

    // Semester Management
    public function storeSemester(Request $request, AcademicYear $academicYear)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'term_number' => 'required|integer|min:1',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after:start_date',
        ]);

        $validated['academic_year_id'] = $academicYear->id;
        $validated['is_active'] = false; // Default inactive

        Semester::create($validated);

        return redirect()->back()->with('success', 'تم إضافة الفصل الدراسي بنجاح');
    }

    public function updateSemester(Request $request, Semester $semester)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'term_number' => 'required|integer|min:1',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after:start_date',
        ]);

        $semester->update($validated);

        return redirect()->back()->with('success', 'تم تعديل بيانات الفصل الدراسي');
    }

    public function destroySemester(Semester $semester)
    {
        $semester->delete();
        return redirect()->back()->with('success', 'تم حذف الفصل الدراسي');
    }

    public function toggleSemesterActive(Semester $semester)
    {
        DB::beginTransaction();
        try {
            if (!$semester->is_active) {
                // Deactivate other semesters in the same academic year
                Semester::where('academic_year_id', $semester->academic_year_id)
                    ->where('id', '!=', $semester->id)
                    ->update(['is_active' => false]);
                
                $semester->update(['is_active' => true]);
                $msg = 'تم تفعيل الفصل الدراسي.';
            } else {
                $semester->update(['is_active' => false]);
                $msg = 'تم تعطيل الفصل الدراسي.';
            }

            DB::commit();
            return redirect()->back()->with('success', $msg);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ.');
        }
    }
}
