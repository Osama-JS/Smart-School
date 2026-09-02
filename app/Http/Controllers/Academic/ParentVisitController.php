<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\ParentVisit;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\StudentAchievementType;
use App\Models\StudentViolationType;
use App\Models\AcademicYear;
use App\Models\StudentAchievement;
use App\Models\StudentViolation;

class ParentVisitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $branchId = auth()->user()->branch_id;

        $query = ParentVisit::with(['student:id,user_id', 'student.user:id,name', 'employee:id,name'])
            ->where('branch_id', $branchId);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('visitor_name', 'like', "%{$search}%")
                  ->orWhereHas('student.user', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('visit_date', $request->date);
        }

        $visits = $query->latest('visit_date')->latest('visit_time')->paginate(15)->withQueryString();

        // Get students and employees for the forms
        $students = Student::with('user:id,name')->whereHas('user', function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        })->get()->map(function($student) {
            return [
                'id' => $student->id,
                'name' => $student->user->name
            ];
        });

        $employees = User::where('branch_id', $branchId)
            ->whereHas('role', function($q) {
                $q->whereNotIn('name', ['طالب', 'ولي أمر']);
            })
            ->select('id', 'name')
            ->get();

        $achievementTypes = StudentAchievementType::select('id', 'name')->get();
        $violationTypes = StudentViolationType::select('id', 'name')->get();
        $activeAcademicYear = AcademicYear::where('is_active', true)->first();

        return Inertia::render('Academic/ParentVisits/Index', [
            'visits' => $visits,
            'filters' => $request->only(['search', 'status', 'date']),
            'students' => $students,
            'employees' => $employees,
            'achievementTypes' => $achievementTypes,
            'violationTypes' => $violationTypes,
            'activeAcademicYear' => $activeAcademicYear,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'visitor_name' => 'required|string|max:255',
            'visitor_relation' => 'required|string|max:255',
            'employee_id' => 'nullable|exists:users,id',
            'visit_date' => 'required|date',
            'visit_time' => 'nullable',
            'purpose_category' => 'required|in:أكاديمي,سلوكي,مالي,إداري/أخرى',
            'purpose' => 'nullable|string',
            'status' => 'required|in:مجدولة,جارية,مكتملة,ملغاة',
            'notes' => 'nullable|string',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;

        ParentVisit::create($validated);

        return redirect()->back()->with('success', 'تم تسجيل زيارة ولي الأمر بنجاح.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ParentVisit $parentVisit)
    {
        // Ensure user can only update visits in their branch
        if ($parentVisit->branch_id !== auth()->user()->branch_id && auth()->user()->role?->name !== 'مدير النظام') {
            abort(403);
        }

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'visitor_name' => 'required|string|max:255',
            'visitor_relation' => 'required|string|max:255',
            'employee_id' => 'nullable|exists:users,id',
            'visit_date' => 'required|date',
            'visit_time' => 'nullable',
            'purpose_category' => 'required|in:أكاديمي,سلوكي,مالي,إداري/أخرى',
            'purpose' => 'nullable|string',
            'status' => 'required|in:مجدولة,جارية,مكتملة,ملغاة',
            'notes' => 'nullable|string',
        ]);

        $originalStatus = $parentVisit->status;
        
        $parentVisit->update($validated);

        if ($originalStatus !== 'مكتملة' && $validated['status'] === 'مكتملة') {
            try {
                $notificationService = app(\App\Services\NotificationService::class);
                $parentVisit->load('student.parents', 'student.user');
                $studentName = $parentVisit->student->user->name ?? 'الطالب';
                $title = 'شكر على زيارتكم للمدرسة';
                
                $message = "نشكركم على زيارتكم الكريمة بخصوص الطالب {$studentName}. ";
                if (!empty($validated['notes'])) {
                    $message .= "أهم الملاحظات: {$validated['notes']}";
                }

                if ($parentVisit->student && $parentVisit->student->parents) {
                    foreach ($parentVisit->student->parents as $parent) {
                        $notificationService->sendComprehensiveNotification(
                            $parent,
                            $title,
                            $message,
                            'visit_completed',
                            false
                        );
                    }
                }
            } catch (\Exception $e) {
                \Log::error('فشل إرسال إشعار الزيارة: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'تم تحديث الزيارة بنجاح.');
    }

    public function convertToAchievement(Request $request, ParentVisit $parentVisit)
    {
        if ($parentVisit->status !== 'مكتملة') {
            abort(400, 'يجب أن تكون الزيارة مكتملة لتحويلها إلى إنجاز.');
        }

        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'student_achievement_type_id' => 'required|exists:student_achievement_types,id',
            'points' => 'required|integer|min:1',
            'description' => 'required|string|max:60000',
        ]);

        StudentAchievement::create([
            'student_id' => $parentVisit->student_id,
            'academic_year_id' => $validated['academic_year_id'],
            'branch_id' => $parentVisit->branch_id,
            'student_achievement_type_id' => $validated['student_achievement_type_id'],
            'description' => $validated['description'] . " (بناءً على زيارة ولي الأمر)",
            'points' => $validated['points'],
            'date_awarded' => now(),
            'awarded_by' => auth()->id(),
            'status' => 'approved',
        ]);

        return redirect()->back()->with('success', 'تم إضافة الإنجاز للطالب بنجاح.');
    }

    public function convertToViolation(Request $request, ParentVisit $parentVisit)
    {
        if ($parentVisit->status !== 'مكتملة') {
            abort(400, 'يجب أن تكون الزيارة مكتملة لتحويلها إلى مخالفة.');
        }

        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'violation_type_id' => 'required|exists:student_violation_types,id',
            'action_taken' => 'required|string|max:255',
            'details' => 'required|string|max:60000',
        ]);

        StudentViolation::create([
            'branch_id' => $parentVisit->branch_id,
            'academic_year_id' => $validated['academic_year_id'],
            'student_id' => $parentVisit->student_id,
            'violation_type_id' => $validated['violation_type_id'],
            'supervisor_id' => auth()->id(),
            'violation_date' => now(),
            'details' => $validated['details'] . " (بناءً على زيارة ولي الأمر)",
            'action_taken' => $validated['action_taken'],
            'status' => 'مفتوحة', // Default status for violations
        ]);

        return redirect()->back()->with('success', 'تم تسجيل المخالفة للطالب بنجاح.');
    }

    public function analytics(Request $request)
    {
        $branchId = auth()->user()->branch_id;
        
        $filter = $request->query('filter', 'year'); // 'year', 'semester', 'month'
        
        $activeYear = \App\Models\AcademicYear::where('branch_id', $branchId)->where('is_active', true)->first();
        
        $startDate = null;
        $endDate = null;
        
        if ($filter === 'month') {
            $startDate = now()->startOfMonth();
            $endDate = now()->endOfMonth();
        } elseif ($filter === 'semester' && $activeYear) {
            $activeSemester = clone $activeYear;
            $activeSemester = \App\Models\Semester::where('academic_year_id', $activeYear->id)->where('is_active', true)->first();
            if ($activeSemester) {
                $startDate = $activeSemester->start_date;
                $endDate = $activeSemester->end_date;
            } else {
                $startDate = $activeYear->start_date;
                $endDate = $activeYear->end_date;
            }
        } elseif ($activeYear) {
            $startDate = $activeYear->start_date;
            $endDate = $activeYear->end_date;
        }

        $baseQuery = ParentVisit::where('branch_id', $branchId);
        if ($startDate && $endDate) {
            $baseQuery->whereBetween('visit_date', [$startDate, $endDate]);
        }
        
        // Total Visits
        $totalVisits = (clone $baseQuery)->count();

        // 1. Visits by status (DB Query)
        $statusCounts = (clone $baseQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $statusChart = [
            ['name' => 'مجدولة', 'value' => $statusCounts->get('مجدولة', 0)],
            ['name' => 'جارية', 'value' => $statusCounts->get('جارية', 0)],
            ['name' => 'مكتملة', 'value' => $statusCounts->get('مكتملة', 0)],
            ['name' => 'ملغاة', 'value' => $statusCounts->get('ملغاة', 0)],
        ];

        // 2. Peak times (DB Query)
        $timeCounts = (clone $baseQuery)
            ->whereNotNull('visit_time')
            ->select(DB::raw('HOUR(visit_time) as hour'), DB::raw('count(*) as count'))
            ->groupBy('hour')
            ->orderBy('hour')
            ->pluck('count', 'hour');

        $timeChart = [];
        foreach ($timeCounts as $hour => $count) {
            $formattedHour = str_pad($hour, 2, '0', STR_PAD_LEFT) . ':00';
            $timeChart[] = ['name' => $formattedHour, 'الزيارات' => $count];
        }

        // 3. Purpose Classification (DB Query - Now using purpose_category column)
        $purposeCounts = (clone $baseQuery)
            ->whereNotNull('purpose_category')
            ->select('purpose_category', DB::raw('count(*) as count'))
            ->groupBy('purpose_category')
            ->pluck('count', 'purpose_category');

        $purposeChart = [
            ['name' => 'أكاديمي', 'value' => $purposeCounts->get('أكاديمي', 0)],
            ['name' => 'سلوكي', 'value' => $purposeCounts->get('سلوكي', 0)],
            ['name' => 'مالي', 'value' => $purposeCounts->get('مالي', 0)],
            ['name' => 'إداري/أخرى', 'value' => $purposeCounts->get('إداري/أخرى', 0)],
        ];

        // 4. Top visited students
        $topStudents = (clone $baseQuery)
            ->with('student.user')
            ->select('student_id', DB::raw('count(*) as total'))
            ->groupBy('student_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function($v) {
                return [
                    'name' => $v->student->user->name ?? 'غير معروف',
                    'total' => $v->total
                ];
            });

        return Inertia::render('Academic/ParentVisits/Analytics', [
            'statusChart' => $statusChart,
            'timeChart' => $timeChart,
            'purposeChart' => $purposeChart,
            'topStudents' => $topStudents,
            'totalVisits' => $totalVisits,
            'currentFilter' => $filter
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ParentVisit $parentVisit)
    {
        if ($parentVisit->branch_id !== auth()->user()->branch_id && auth()->user()->role?->name !== 'مدير النظام') {
            abort(403);
        }

        $parentVisit->delete();

        return redirect()->back()->with('success', 'تم حذف الزيارة بنجاح.');
    }

    /**
     * Report for parent visits with filters and printable view.
     */
    public function getParentVisitsReportFilterData(Request $request)
    {
        $branchId = auth()->user()->branch_id;
        $query = ParentVisit::with(['student.user', 'student.currentEnrollment.division.grade', 'employee:id,name'])
            ->where('branch_id', $branchId);

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status');
        $purposeCategory = $request->query('purpose_category');

        if ($startDate) {
            $query->whereDate('visit_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('visit_date', '<=', $endDate);
        }
        if ($status) {
            $query->where('status', $status);
        }
        if ($purposeCategory) {
            $query->where('purpose_category', $purposeCategory);
        }

        $visits = $query->orderBy('visit_date', 'desc')->orderBy('visit_time', 'desc')->get();

        $stats = [
            'total' => $visits->count(),
            'completed' => $visits->where('status', 'مكتملة')->count(),
            'scheduled' => $visits->where('status', 'مجدولة')->count(),
            'in_progress' => $visits->where('status', 'جارية')->count(),
            'cancelled' => $visits->where('status', 'ملغاة')->count(),
        ];

        return [
            'visits' => $visits,
            'stats' => $stats,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
                'purpose_category' => $purposeCategory,
            ]
        ];
    }

    public function report(Request $request)
    {
        $data = $this->getParentVisitsReportFilterData($request);
        return Inertia::render('Academic/ParentVisits/Report', $data);
    }

    public function downloadParentVisitsReportPdf(Request $request)
    {
        $data = $this->getParentVisitsReportFilterData($request);
        
        $printSettings = json_decode($request->input('printSettings', '{}'), true);
        $paperSize = $printSettings['paperSize'] ?? 'A4';
        $brandColor = $printSettings['brandColor'] ?? '#0ea5e9';
        $orientation = $printSettings['orientation'] ?? 'landscape';
        $marginSetting = $printSettings['margins'] ?? 'normal';
        
        $margins = match ($marginSetting) {
            'none' => [0, 0, 0, 0],
            '1cm' => [10, 10, 10, 10],
            '2cm' => [20, 20, 20, 20],
            default => [15, 15, 15, 15],
        };

        if ($orientation === 'landscape') {
            $paperSize = \Spatie\LaravelPdf\Enums\Format::tryFrom(strtolower($paperSize)) ?? \Spatie\LaravelPdf\Enums\Format::A4;
            $margins = [$margins[0], $margins[1], $margins[2], $margins[3]];
        }

        $data['printSettings'] = $printSettings;
        $data['brandColor'] = $brandColor;
        $data['watermark'] = $printSettings['watermark'] ?? 'none';
        $data['orientation'] = $orientation;

        $footerHtml = '
            <div style="width: 100%; padding: 0 40px 10px 40px; margin: 0; font-family: tahoma, arial, sans-serif; direction: rtl; box-sizing: border-box;">
                <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 9px; color: #64748b;">
                    <div style="width: 33%; text-align: right;">
                        <strong style="color: ' . $brandColor . ';">نظام الإدارة الذكية</strong> (Smart School)
                    </div>
                    <div style="width: 33%; text-align: center; color: #94a3b8;">
                        طُبع بتاريخ: ' . now()->format('Y-m-d H:i') . '
                    </div>
                    <div style="width: 33%; text-align: left;">
                        <span style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 12px; font-weight: bold; color: #475569; display: inline-block;">
                            صفحة <span class="pageNumber"></span> / <span class="totalPages"></span>
                        </span>
                    </div>
                </div>
            </div>
        ';

        $pdf = \Spatie\LaravelPdf\Facades\Pdf::view('pdf.academic.parent-visits', $data)
            ->format($paperSize)
            ->margins($margins[0], $margins[1], $margins[2] + 12, $margins[3])
            ->footerHtml($footerHtml);

        if ($orientation === 'landscape') {
            $pdf->landscape();
        }

        return $pdf->withBrowsershot(function ($browsershot) {
                $browsershot->setChromePath('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
                           ->noSandbox()
                           ->showBackground()
                           ->waitUntilNetworkIdle()
                           ->delay(2000);
            })
            ->download('parent_visits_report.pdf');
    }
}
