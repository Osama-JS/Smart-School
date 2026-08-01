<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MonthlyGrade;
use App\Models\SemesterResult;

use App\Traits\ResolvesStudent;

class MyGradesController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        [$student, $children] = $this->resolveStudent($request);
        
        if (!$student) {
            return Inertia::render('Student/Grades/Index', [
                'monthlyGrades' => [],
                'semesterResults' => [],
                'children' => $children,
                'activeChildId' => null,
            ]);
        }
        $currentEnrollment = $student->currentEnrollment()->first();
        
        $monthlyGrades = collect();
        $semesterResults = collect();
        
        if ($currentEnrollment) {
            // Get Monthly Grades for current enrollment
            $monthlyGrades = MonthlyGrade::with(['subject', 'period'])
                ->where('enrollment_id', $currentEnrollment->id)
                ->orderBy('period_id')
                ->get()
                ->groupBy('period.name');
                
            // Get Semester Results (final grades per semester/year)
            $semesterResults = SemesterResult::with(['semester.academicYear', 'subject'])
                ->where('enrollment_id', $currentEnrollment->id)
                ->where('status', 'locked') // Only show locked/published results
                ->orderBy('semester_id', 'desc')
                ->get()
                ->groupBy('semester.name');
        }

        return Inertia::render('Student/Grades/Index', [
            'monthlyGrades' => $monthlyGrades,
            'semesterResults' => $semesterResults,
            'children' => $children,
            'activeChildId' => $student->id,
        ]);
    }

    public function certificate(Request $request, $semester_id)
    {
        [$student, $children] = $this->resolveStudent($request);
        if (!$student) abort(404, 'لا يوجد طالب');
        $currentEnrollment = $student->currentEnrollment()->with('division.grade')->first();
        
        if (!$currentEnrollment) {
            abort(404, 'لا يوجد تسجيل حالي للطالب.');
        }

        $semester = \App\Models\Semester::with('academicYear')->findOrFail($semester_id);

        $results = SemesterResult::with('subject')
            ->where('enrollment_id', $currentEnrollment->id)
            ->where('semester_id', $semester_id)
            ->where('status', 'locked')
            ->get();

        if ($results->isEmpty()) {
            abort(404, 'لا توجد نتائج معتمدة لهذا الفصل.');
        }

        $totalMarks = $results->sum('semester_total');
        // Assume each subject is out of 100 for percentage, or calculate based on subjects
        $maxPossible = $results->count() * 100;
        $percentage = $maxPossible > 0 ? round(($totalMarks / $maxPossible) * 100, 2) : 0;
        
        $gradeText = 'مقبول';
        if ($percentage >= 90) $gradeText = 'ممتاز';
        elseif ($percentage >= 80) $gradeText = 'جيد جداً';
        elseif ($percentage >= 70) $gradeText = 'جيد';

        $qrData = "Student: {$user->name} | ID: {$student->id} | Semester: {$semester->name} | Total: {$totalMarks} | Pct: {$percentage}% | Grade: {$gradeText} | Verified by Smart-School";
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($qrData);

        return Inertia::render('Student/Grades/Certificate', [
            'studentName' => $user->name,
            'studentId' => $student->id,
            'gradeName' => $currentEnrollment->division->grade->name ?? 'غير محدد',
            'semesterName' => $semester->name,
            'academicYear' => $semester->academicYear->name ?? '',
            'results' => $results,
            'totalMarks' => $totalMarks,
            'maxPossible' => $maxPossible,
            'percentage' => $percentage,
            'gradeText' => $gradeText,
            'qrUrl' => $qrUrl,
            'issueDate' => now()->format('Y-m-d')
        ]);
    }

    public function monthlyCertificate(Request $request, $period_id)
    {
        [$student, $children] = $this->resolveStudent($request);
        if (!$student) abort(404, 'لا يوجد طالب');
        $currentEnrollment = $student->currentEnrollment()->with('division.grade')->first();
        
        if (!$currentEnrollment) {
            abort(404, 'لا يوجد تسجيل حالي للطالب.');
        }

        $period = \App\Models\ResultPeriod::with('semester.academicYear')->findOrFail($period_id);

        $results = MonthlyGrade::with('subject')
            ->where('enrollment_id', $currentEnrollment->id)
            ->where('period_id', $period_id)
            ->where('is_submitted', true) // Only submitted ones
            ->get();

        if ($results->isEmpty()) {
            abort(404, 'لا توجد درجات معتمدة لهذا الشهر.');
        }

        // total grand_total from scores JSON
        $totalMarks = $results->sum(function($r) {
            return $r->scores['grand_total'] ?? 0;
        });

        // max possible depends on the maximum grade per subject. Usually 100 for monthly.
        $maxPossible = $results->count() * 100;
        $percentage = $maxPossible > 0 ? round(($totalMarks / $maxPossible) * 100, 2) : 0;
        
        $gradeText = 'مقبول';
        if ($percentage >= 90) $gradeText = 'ممتاز';
        elseif ($percentage >= 80) $gradeText = 'جيد جداً';
        elseif ($percentage >= 70) $gradeText = 'جيد';

        $qrData = "Student: {$user->name} | ID: {$student->id} | Period: {$period->name} | Total: {$totalMarks} | Pct: {$percentage}% | Grade: {$gradeText}";
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($qrData);

        return Inertia::render('Student/Grades/MonthlyCertificate', [
            'studentName' => $user->name,
            'studentId' => $student->id,
            'gradeName' => $currentEnrollment->division->grade->name ?? 'غير محدد',
            'periodName' => $period->name,
            'semesterName' => $period->semester->name ?? '',
            'academicYear' => $period->semester->academicYear->name ?? '',
            'results' => $results,
            'totalMarks' => $totalMarks,
            'maxPossible' => $maxPossible,
            'percentage' => $percentage,
            'gradeText' => $gradeText,
            'qrUrl' => $qrUrl,
            'issueDate' => now()->format('Y-m-d')
        ]);
    }
}
