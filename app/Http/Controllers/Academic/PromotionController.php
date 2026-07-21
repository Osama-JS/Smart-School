<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AcademicYear;
use App\Models\Section;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;

class PromotionController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الطلاب', only: ['index', 'students']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل طالب', only: ['promote']),
        ];
    }

    public function index()
    {
        $academicYears = AcademicYear::latest()->get();
        
        $branchId = (auth()->user()->role && auth()->user()->role->name === 'مدير النظام' && request()->hasSession() && session()->has('active_branch_id')) 
            ? session('active_branch_id') 
            : auth()->user()->branch_id;
            
        // Load sections with grades and divisions to be used in the cascading dropdowns
        $sections = Section::forBranch($branchId)->with('grades.divisions')->get();

        return Inertia::render('Academic/Promotions/Index', compact('academicYears', 'sections'));
    }

    public function students(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'division_id'      => 'required|exists:divisions,id',
        ]);

        // Get enrollments for the specified division and year
        // that are 'active' (not already graduated or transferred)
        $enrollments = Enrollment::with('student.user')
            ->where('academic_year_id', $request->academic_year_id)
            ->where('division_id', $request->division_id)
            ->where('status', 'active')
            ->get()
            ->map(function ($enrollment) {
                return [
                    'id' => $enrollment->id,
                    'student_id' => $enrollment->student_id,
                    'student_name' => optional(optional($enrollment->student)->user)->name,
                    'national_id' => optional(optional($enrollment->student)->user)->national_id,
                ];
            });

        return response()->json($enrollments);
    }

    public function promote(Request $request)
    {
        $validated = $request->validate([
            'source_year_id' => 'required|exists:academic_years,id',
            'target_year_id' => 'required|exists:academic_years,id|different:source_year_id',
            'target_division_id' => 'required|exists:divisions,id',
            'enrollment_ids' => 'required|array|min:1',
            'enrollment_ids.*' => 'exists:enrollments,id',
        ]);

        DB::beginTransaction();
        try {
            $enrollments = Enrollment::whereIn('id', $validated['enrollment_ids'])
                ->where('academic_year_id', $validated['source_year_id'])
                ->where('status', 'active')
                ->get();

            $promotedCount = 0;

            foreach ($enrollments as $enrollment) {
                // 1. Mark old enrollment as graduated
                $enrollment->update(['status' => 'graduated']);

                // 2. Check if student already has an enrollment in the target year
                $existingNewEnrollment = Enrollment::where('student_id', $enrollment->student_id)
                    ->where('academic_year_id', $validated['target_year_id'])
                    ->first();

                if (!$existingNewEnrollment) {
                    // 3. Create new enrollment
                    Enrollment::create([
                        'student_id' => $enrollment->student_id,
                        'academic_year_id' => $validated['target_year_id'],
                        'division_id' => $validated['target_division_id'],
                        'status' => 'active',
                        'is_result_blocked' => false,
                    ]);
                    $promotedCount++;
                }
            }

            DB::commit();

            return redirect()->back()->with('success', "تم ترفيع {$promotedCount} طالباً بنجاح.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء الترفيع: ' . $e->getMessage());
        }
    }
}
