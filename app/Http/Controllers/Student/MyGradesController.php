<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\MonthlyGrade;
use App\Models\ResultPeriod;
use App\Models\Semester;
use App\Models\SemesterResult;
use App\Services\StudentCertificateService;
use App\Traits\ResolvesStudent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MyGradesController extends Controller
{
    use ResolvesStudent;

    public function __construct(private readonly StudentCertificateService $certificateService)
    {
    }

    public function index(Request $request)
    {
        [$student, $children] = $this->resolveStudent($request);
        $isParent = auth()->user()?->role?->name === 'ولي أمر';

        if (!$student) {
            return Inertia::render('Student/Grades/Index', [
                'monthlyGrades'   => [],
                'semesterResults' => [],
                'children'        => $children,
                'activeChildId'   => null,
                'isResultBlocked' => false,
                'isParent'        => $isParent,
            ]);
        }

        $currentEnrollment = $student->currentEnrollment()->first();
        $isResultBlocked = (bool) ($currentEnrollment?->is_result_blocked ?? false);

        $monthlyGrades = collect();
        $semesterResults = collect();

        if ($currentEnrollment && !$isResultBlocked) {
            $monthlyGrades = MonthlyGrade::with(['subject', 'period'])
                ->where('enrollment_id', $currentEnrollment->id)
                ->where('is_submitted', true)
                ->orderBy('period_id')
                ->get()
                ->groupBy(fn ($g) => $g->period?->month_name ?? 'غير محدد');

            $semesterResults = SemesterResult::with(['semester.academicYear', 'subject'])
                ->where('enrollment_id', $currentEnrollment->id)
                ->where('status', 'locked')
                ->orderBy('semester_id', 'desc')
                ->get()
                ->groupBy(fn ($r) => $r->semester?->name ?? 'غير محدد');
        }

        return Inertia::render('Student/Grades/Index', [
            'monthlyGrades'   => $monthlyGrades,
            'semesterResults' => $semesterResults,
            'children'        => $children,
            'activeChildId'   => $student->id,
            'isResultBlocked' => $isResultBlocked,
            'isParent'        => $isParent,
        ]);
    }

    public function certificate(Request $request, $semester_id)
    {
        [$student] = $this->resolveStudent($request);
        if (!$student) {
            abort(404, 'لا يوجد طالب');
        }

        $semester = Semester::with('academicYear')->findOrFail($semester_id);
        $enrollment = $this->certificateService->resolveEnrollmentForYear($student, $semester->academic_year_id);

        if (!$enrollment) {
            abort(404, 'لا يوجد تسجيل حالي للطالب.');
        }

        if ($enrollment->is_result_blocked) {
            abort(403, 'عذراً، النتيجة محجوبة حالياً من قبل الإدارة.');
        }

        $data = $this->certificateService->buildSemesterCertificateData($student, $semester, true, true);
        if (!$data) {
            abort(404, 'لا توجد نتائج معتمدة لهذا الفصل.');
        }

        return Inertia::render('Student/Grades/Certificate', [
            'certificate' => $data,
            'isAdminView' => false,
            'pdfUrl'      => null,
        ]);
    }

    public function monthlyCertificate(Request $request, $period_id)
    {
        [$student] = $this->resolveStudent($request);
        if (!$student) {
            abort(404, 'لا يوجد طالب');
        }

        $period = ResultPeriod::with('semester.academicYear')->findOrFail($period_id);
        $enrollment = $this->certificateService->resolveEnrollmentForYear($student, $period->semester?->academic_year_id);

        if (!$enrollment) {
            abort(404, 'لا يوجد تسجيل حالي للطالب.');
        }

        if ($enrollment->is_result_blocked) {
            abort(403, 'عذراً، النتيجة محجوبة حالياً من قبل الإدارة.');
        }

        $data = $this->certificateService->buildMonthlyCertificateData($student, $period, true, true);
        if (!$data) {
            abort(404, 'لا توجد درجات معتمدة لهذا الشهر.');
        }

        return Inertia::render('Student/Grades/MonthlyCertificate', [
            'certificate' => $data,
            'isAdminView' => false,
            'pdfUrl'      => null,
        ]);
    }
}
