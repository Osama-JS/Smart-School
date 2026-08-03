<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudentViolation;
use App\Models\StudentViolationType;
use App\Models\Student;
use App\Models\AcademicYear;
use App\Models\ParentSummon;
use App\Models\StudentPledge;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StudentViolationController extends Controller
{
    public function index()
    {
        $branchId = auth()->user()->branch_id;
        
        $violations = StudentViolation::with([
            'student.user', 
            'violationType', 
            'supervisor',
            'student.currentEnrollment.division.grade'
        ])
            ->where('branch_id', $branchId)
            ->latest()
            ->get();
            
        $types = StudentViolationType::where('branch_id', $branchId)->where('is_active', true)->get();
        $activeYear = AcademicYear::where('is_active', true)->first();

        $students = Student::with('user')->whereHas('user', function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        })->get();
        
        $grades = \App\Models\Grade::with(['divisions' => function($q) use ($activeYear) {
            if ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            }
        }])->where('branch_id', $branchId)->get();
        
        return Inertia::render('Academic/StudentDiscipline/Violations/Index', [
            'violations' => $violations,
            'types' => $types,
            'students' => $students,
            'grades' => $grades,
            'activeYearId' => $activeYear ? $activeYear->id : null,
        ]);
    }

    public function analytics()
    {
        $branchId = auth()->user()->branch_id;
        $activeYear = AcademicYear::where('is_active', true)->first();
        
        $cacheKey = "violation_analytics_branch_{$branchId}_year_" . ($activeYear ? $activeYear->id : 'none');
        
        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($branchId, $activeYear) {
            $query = StudentViolation::where('student_violations.branch_id', $branchId);
            if ($activeYear) {
                $query->where('student_violations.academic_year_id', $activeYear->id);
            }

            // Most common violations
            $commonViolations = (clone $query)
                ->join('student_violation_types', 'student_violations.violation_type_id', '=', 'student_violation_types.id')
                ->select('student_violation_types.name', DB::raw('count(*) as count'))
                ->groupBy('student_violation_types.name')
                ->orderByDesc('count')
                ->limit(7)
                ->get();

            // Violations by day of week
            $violationsByDayRaw = (clone $query)
                ->select(DB::raw('DAYNAME(violation_date) as day_name'), DB::raw('DAYOFWEEK(violation_date) as day_num'), DB::raw('count(*) as count'))
                ->groupBy('day_name', 'day_num')
                ->orderBy('day_num')
                ->get();
                
            // Map day names to Arabic
            $dayNamesAr = [
                'Sunday' => 'الأحد',
                'Monday' => 'الإثنين',
                'Tuesday' => 'الثلاثاء',
                'Wednesday' => 'الأربعاء',
                'Thursday' => 'الخميس',
                'Friday' => 'الجمعة',
                'Saturday' => 'السبت',
            ];
            
            $violationsByDay = $violationsByDayRaw->map(function ($item) use ($dayNamesAr) {
                return [
                    'name' => $dayNamesAr[$item->day_name] ?? $item->day_name,
                    'count' => $item->count
                ];
            });

            // Violations by Division
            $violationsByDivision = (clone $query)
                ->join('students', 'student_violations.student_id', '=', 'students.id')
                ->join('enrollments', function($join) use ($activeYear) {
                    $join->on('students.id', '=', 'enrollments.student_id');
                    if ($activeYear) {
                        $join->where('enrollments.academic_year_id', '=', $activeYear->id);
                    }
                })
                ->join('divisions', 'enrollments.division_id', '=', 'divisions.id')
                ->join('grades', 'divisions.grade_id', '=', 'grades.id')
                ->select(DB::raw('CONCAT(grades.name, " - ", divisions.name) as name'), DB::raw('count(*) as count'))
                ->groupBy('grades.name', 'divisions.name')
                ->orderByDesc('count')
                ->limit(10)
                ->get();
                
            return [
                'commonViolations' => $commonViolations,
                'violationsByDay' => $violationsByDay,
                'violationsByDivision' => $violationsByDivision,
            ];
        });
            
        return Inertia::render('Academic/StudentDiscipline/Violations/Analytics', $data);
    }

    public function checkRepetition(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'violation_type_id' => 'required|exists:student_violation_types,id',
        ]);

        $activeYearId = AcademicYear::where('is_active', true)->value('id');
        
        $previousCount = StudentViolation::where('student_id', $request->student_id)
            ->where('violation_type_id', $request->violation_type_id)
            ->where('academic_year_id', $activeYearId)
            ->count();
            
        $repetitionLevel = $previousCount + 1;
        $type = StudentViolationType::find($request->violation_type_id);
        
        $action = $type->first_time_action;
        if ($repetitionLevel == 2 && $type->second_time_action) {
            $action = $type->second_time_action;
        } elseif ($repetitionLevel >= 3 && $type->third_time_action) {
            $action = $type->third_time_action;
        }

        return response()->json([
            'repetition_level' => $repetitionLevel,
            'action_taken' => $action
        ]);
    }

    public function store(Request $request, \App\Services\NotificationService $notificationService, \App\Services\EscalationService $escalationService)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'violation_type_id' => 'required|exists:student_violation_types,id',
            'violation_date' => 'required|date',
            'details' => 'required|string',
            'action_taken' => 'required|string',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $data = $validated;
        unset($data['attachment']);

        if ($request->hasFile('attachment')) {
            $data['attachment_path'] = $request->file('attachment')->store('student_violations', 'public');
        }

        $data['branch_id'] = auth()->user()->branch_id;
        $data['supervisor_id'] = auth()->id();
        $data['status'] = 'pending';

        $repetitionCount = 0;
        
        DB::beginTransaction();
        try {
            $violation = StudentViolation::with('student.user')->find(StudentViolation::create($data)->id);

            // In-App Notification to Counselors (Academic Supervisors)
            $studentName = $violation->student->user->name ?? 'طالب';
            $notificationService->sendBroadcastNotification(
                'مخالفة سلوكية جديدة',
                "تم تسجيل مخالفة سلوكية للطالب $studentName",
                'violation',
                auth()->id(),
                $violation->branch_id,
                'role',
                'academic_supervisor'
            );

            // Escalation Engine Logic
            $repetitionCount = $escalationService->processEscalation($violation);
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء التسجيل: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'تم تسجيل المخالفة بنجاح' . ($repetitionCount >= 2 ? ' وتم التصعيد وإنشاء استدعاء وتعهد آلياً.' : ''));
    }

    public function update(Request $request, StudentViolation $studentViolation)
    {
        $validated = $request->validate([
            'details' => 'required|string',
            'action_taken' => 'required|string',
            'status' => 'required|string', // pending, resolved
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $data = $validated;
        unset($data['attachment']);

        if ($request->hasFile('attachment')) {
            // Delete old attachment if exists
            if ($studentViolation->attachment_path) {
                Storage::disk('public')->delete($studentViolation->attachment_path);
            }
            $data['attachment_path'] = $request->file('attachment')->store('student_violations', 'public');
        }

        $studentViolation->update($data);

        return redirect()->back()->with('success', 'تم تحديث المخالفة بنجاح');
    }

    public function destroy(StudentViolation $studentViolation)
    {
        if ($studentViolation->attachment_path) {
            Storage::disk('public')->delete($studentViolation->attachment_path);
        }
        $studentViolation->delete();
        return redirect()->back()->with('success', 'تم الحذف بنجاح');
    }
}
