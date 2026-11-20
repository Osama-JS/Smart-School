<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Division;
use App\Models\Enrollment;
use App\Models\ResultPeriod;
use App\Models\Semester;
use App\Models\Student;
use App\Models\User;
use App\Services\StudentCertificateService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Spatie\LaravelPdf\Facades\Pdf;

class StudentCertificateController extends Controller implements HasMiddleware
{
    public function __construct(private readonly StudentCertificateService $certificateService)
    {
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:عرض درجات الطلاب'),
        ];
    }

    public function index(Request $request)
    {
        $branchId = $this->resolveBranchId();

        $academicYears = AcademicYear::with(['semesters' => fn ($q) => $q->orderBy('term_number')->orderBy('start_date')])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('start_date')
            ->get();

        $studentIdParam = $request->query('student_id');
        $preselectedEnrollment = null;
        if ($studentIdParam) {
            $studentModel = Student::find($studentIdParam);
            if ($studentModel) {
                $this->authorizeStudentBranch($studentModel);
                $preselectedEnrollment = $studentModel->currentEnrollment()->with('division')->first();
            }
        }

        $activeYear = $academicYears->firstWhere('is_active', true) ?? $academicYears->first();
        $selectedYearId = $request->query('academic_year_id')
            ?: ($preselectedEnrollment?->academic_year_id ?: $activeYear?->id);

        $selectedYear = $academicYears->firstWhere('id', (int) $selectedYearId) ?? $activeYear;
        $semesters = $selectedYear ? $selectedYear->semesters : collect();
        $activeSemester = $semesters->firstWhere('is_active', true) ?? $semesters->first();
        $selectedSemesterId = $request->query('semester_id') ?: $activeSemester?->id;

        $periods = collect();
        if ($selectedSemesterId) {
            $periods = ResultPeriod::where('semester_id', $selectedSemesterId)
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->where(function ($q) {
                    $q->where('period_type', 'monthly')->orWhereNull('period_type');
                })
                ->orderBy('fill_start_date')
                ->get();
        }

        $certType = $request->query('type') === 'monthly' ? 'monthly' : 'semester';
        $selectedPeriodId = $request->query('period_id') ?: ($periods->first()?->id);

        $divisions = Division::with('grade.section')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($selectedYearId, fn ($q) => $q->where('academic_year_id', $selectedYearId))
            ->orderBy('grade_id')
            ->orderBy('name')
            ->get();

        $selectedDivisionId = $request->query('division_id') ?: $preselectedEnrollment?->division_id;
        $roster = [];
        $selectedDivision = null;

        if ($selectedDivisionId) {
            $selectedDivision = Division::with('grade')->find($selectedDivisionId);
            if ($selectedDivision) {
                $this->authorizeDivisionBranch($selectedDivision);
                $targetId = $certType === 'monthly' ? (int) $selectedPeriodId : (int) $selectedSemesterId;
                if ($targetId > 0) {
                    $roster = $this->certificateService->getDivisionCertificateRoster(
                        $selectedDivision,
                        $certType,
                        $targetId
                    );
                }
            }
        }

        return Inertia::render('Academic/Certificates/Index', [
            'academicYears' => $academicYears,
            'semesters'     => $semesters->values(),
            'periods'       => $periods->values(),
            'divisions'     => $divisions,
            'roster'        => $roster,
            'filters'       => [
                'academic_year_id' => $selectedYearId ? (int) $selectedYearId : '',
                'semester_id'      => $selectedSemesterId ? (int) $selectedSemesterId : '',
                'period_id'        => $selectedPeriodId ? (int) $selectedPeriodId : '',
                'division_id'      => $selectedDivisionId ? (int) $selectedDivisionId : '',
                'type'             => $certType,
                'student_id'       => $studentIdParam ? (int) $studentIdParam : '',
            ],
        ]);
    }

    public function monthly(Request $request, Student $student, ResultPeriod $period)
    {
        $this->authorizeStudentBranch($student);
        $onlySubmitted = $request->boolean('only_submitted', false);

        $data = $this->certificateService->buildMonthlyCertificateData($student, $period, $onlySubmitted, true);
        if (!$data) {
            abort(404, 'لا توجد درجات شهرية مسجلة لهذا الطالب في هذه الفترة.');
        }

        return Inertia::render('Student/Grades/MonthlyCertificate', [
            'certificate' => $data,
            'isAdminView' => true,
            'pdfUrl'      => route('academic.certificates.monthly.pdf', [
                'student'        => $student->id,
                'period'         => $period->id,
                'only_submitted' => $onlySubmitted ? 1 : 0,
            ]),
        ]);
    }

    public function semester(Request $request, Student $student, Semester $semester)
    {
        $this->authorizeStudentBranch($student);
        $onlyLocked = $request->boolean('only_locked', false);

        $data = $this->certificateService->buildSemesterCertificateData($student, $semester, $onlyLocked, true);
        if (!$data) {
            abort(404, 'لا توجد نتائج فصلية مسجلة لهذا الطالب في هذا الفصل.');
        }

        return Inertia::render('Student/Grades/Certificate', [
            'certificate' => $data,
            'isAdminView' => true,
            'pdfUrl'      => route('academic.certificates.semester.pdf', [
                'student'     => $student->id,
                'semester'    => $semester->id,
                'only_locked' => $onlyLocked ? 1 : 0,
            ]),
        ]);
    }

    public function monthlyPdf(Request $request, Student $student, ResultPeriod $period)
    {
        $this->authorizeStudentBranch($student);
        $onlySubmitted = $request->boolean('only_submitted', false);

        $data = $this->certificateService->buildMonthlyCertificateData($student, $period, $onlySubmitted, true);
        if (!$data) {
            abort(404, 'لا توجد درجات شهرية مسجلة لهذا الطالب في هذه الفترة.');
        }

        $data['showRank'] = $request->boolean('show_rank', true);
        $data['showNotes'] = $request->boolean('show_notes', true);
        $data['logoDataUri'] = $this->resolvePdfLogoDataUri($data['design'] ?? []);
        $data['stampDataUri'] = $this->resolvePdfStampDataUri($data['design'] ?? []);

        return $this->renderCertificatePdf(
            'pdf.academic.student-monthly-certificate',
            $data,
            "monthly_certificate_{$student->id}_{$period->id}.pdf"
        );
    }

    public function semesterPdf(Request $request, Student $student, Semester $semester)
    {
        $this->authorizeStudentBranch($student);
        $onlyLocked = $request->boolean('only_locked', false);

        $data = $this->certificateService->buildSemesterCertificateData($student, $semester, $onlyLocked, true);
        if (!$data) {
            abort(404, 'لا توجد نتائج فصلية مسجلة لهذا الطالب في هذا الفصل.');
        }

        $data['showRank'] = $request->boolean('show_rank', true);
        $data['logoDataUri'] = $this->resolvePdfLogoDataUri($data['design'] ?? []);
        $data['stampDataUri'] = $this->resolvePdfStampDataUri($data['design'] ?? []);

        return $this->renderCertificatePdf(
            'pdf.academic.student-semester-certificate',
            $data,
            "semester_certificate_{$student->id}_{$semester->id}.pdf"
        );
    }

    public function divisionBatch(Request $request, Division $division)
    {
        $this->authorizeDivisionBranch($division);

        $validated = $request->validate([
            'type'          => 'required|in:monthly,semester',
            'period_id'     => 'required_if:type,monthly|nullable|integer|exists:result_periods,id',
            'semester_id'   => 'required_if:type,semester|nullable|integer|exists:semesters,id',
            'only_official' => 'nullable|boolean',
        ]);

        $type = $validated['type'];
        $targetId = $type === 'monthly' ? (int) $validated['period_id'] : (int) $validated['semester_id'];
        $onlyOfficial = (bool) ($validated['only_official'] ?? false);

        $certificates = $this->certificateService->buildDivisionBatchCertificates(
            $division,
            $type,
            $targetId,
            $onlyOfficial
        );

        return Inertia::render('Academic/Certificates/BatchPrint', [
            'certificates' => $certificates,
            'division'     => $division->load('grade.section'),
            'type'         => $type,
        ]);
    }

    private function renderCertificatePdf(string $view, array $data, string $filename)
    {
        $brandColor = $data['design']['default_brand_color'] ?? '#059669';
        $footerHtml = '
            <div style="width: 100%; padding: 0 36px 8px 36px; font-family: Tahoma, Arial, sans-serif; direction: rtl; box-sizing: border-box;">
                <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b;">
                    <div><strong style="color: ' . e($brandColor) . ';">' . e($data['design']['school_name'] ?? 'Smart School') . '</strong></div>
                    <div>' . e($data['design']['footer_notice'] ?? 'وثيقة رسمية صادرة آلياً') . '</div>
                    <div>تاريخ الطباعة: ' . now()->format('Y-m-d') . '</div>
                </div>
            </div>
        ';

        return Pdf::view($view, $data)
            ->format('a4')
            ->margins(10, 10, 14, 10)
            ->footerHtml($footerHtml)
            ->withBrowsershot(function ($browsershot) {
                $browsershot->setChromePath('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
                    ->noSandbox()
                    ->showBackground()
                    ->waitUntilNetworkIdle()
                    ->delay(500);
            })
            ->download($filename);
    }

    private function resolvePdfLogoDataUri(array $design): ?string
    {
        $candidates = [];
        if (!empty($design['logo']) && !str_starts_with($design['logo'], 'http')) {
            $candidates[] = public_path('storage/' . ltrim($design['logo'], '/'));
        }
        $candidates[] = public_path('images/logo.png');
        $candidates[] = public_path('images/school_logo.png');

        return $this->fileToDataUri($candidates);
    }

    private function resolvePdfStampDataUri(array $design): ?string
    {
        if (empty($design['stamp_image']) || str_starts_with($design['stamp_image'], 'http')) {
            return null;
        }

        return $this->fileToDataUri([public_path('storage/' . ltrim($design['stamp_image'], '/'))]);
    }

    private function fileToDataUri(array $paths): ?string
    {
        foreach ($paths as $path) {
            if ($path && file_exists($path) && is_file($path)) {
                $mime = @mime_content_type($path) ?: 'image/png';
                $raw = @file_get_contents($path);
                if ($raw !== false) {
                    return 'data:' . $mime . ';base64,' . base64_encode($raw);
                }
            }
        }

        return null;
    }

    private function resolveBranchId(): ?int
    {
        $user = auth()->user();
        if (!$user) {
            return null;
        }

        if ($user->role?->name === 'مدير النظام') {
            return (request()->hasSession() && session()->has('active_branch_id'))
                ? (int) session('active_branch_id')
                : null;
        }

        return $user->branch_id ? (int) $user->branch_id : null;
    }

    private function authorizeStudentBranch(Student $student): void
    {
        $branchId = $this->resolveBranchId();
        if (!$branchId) {
            return;
        }

        $studentUser = User::withoutGlobalScope('branch_isolation')->find($student->user_id);
        if (!$studentUser || (int) $studentUser->branch_id !== $branchId) {
            abort(403, 'لا يمكنك عرض شهادات طالب خارج فرعك.');
        }
    }

    private function authorizeDivisionBranch(Division $division): void
    {
        $branchId = $this->resolveBranchId();
        if ($branchId && $division->branch_id && (int) $division->branch_id !== $branchId) {
            abort(403, 'لا يمكنك عرض شهادات شعبة خارج فرعك.');
        }
    }
}
