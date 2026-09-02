<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\ClinicVisit;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClinicController extends Controller
{
    /**
     * Display the clinic dashboard.
     */
    public function index(Request $request)
    {
        $recentVisits = ClinicVisit::with(['student.user'])
            ->latest('visited_at')
            ->take(10)
            ->get()
            ->map(function ($visit) {
                // Map to what frontend expects
                return [
                    'id' => $visit->id,
                    'student_id' => $visit->student_id,
                    'visited_at' => $visit->visited_at,
                    'symptoms' => $visit->symptoms,
                    'action_taken' => $visit->action_taken,
                    'status' => $visit->status,
                    'student' => [
                        'name' => $visit->student->user->name ?? 'غير معروف',
                    ],
                ];
            });

        // Count of today's visits
        $todayVisitsCount = ClinicVisit::whereDate('visited_at', today())->count();

        return Inertia::render('Clinic/Index', [
            'recentVisits' => $recentVisits,
            'todayVisitsCount' => $todayVisitsCount,
        ]);
    }
    
    /**
     * API endpoint to search students for clinic.
     */
    public function searchStudents(Request $request)
    {
        try {
            $search = $request->query('query');
            
            if (empty($search) || mb_strlen($search) < 2) {
                return response()->json([]);
            }

            // Test if "all" is typed
            if ($search === 'all') {
                $students = Student::with(['user', 'currentEnrollment.division.grade', 'medicalRecord'])->take(5)->get();
            } else {
                $students = Student::whereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('username', 'like', "%{$search}%");
                    })
                    ->with(['user', 'currentEnrollment.division.grade', 'medicalRecord'])
                    ->take(10)
                    ->get();
            }

            $formatted = $students->map(function ($student) {
                $enrollment = $student->currentEnrollment;
                return [
                    'id' => $student->id,
                    'name' => $student->user->name ?? 'غير معروف',
                    'national_id' => $student->user->username ?? '---',
                    'grade' => $enrollment && $enrollment->division && $enrollment->division->grade ? ['name' => $enrollment->division->grade->name] : null,
                    'division' => $enrollment && $enrollment->division ? ['name' => $enrollment->division->name] : null,
                    'medical_record' => $student->medicalRecord ? clone $student->medicalRecord : null,
                ];
            });

            return response()->json($formatted);
        } catch (\Throwable $e) {
            return response()->json([
                [
                    'id' => 999999,
                    'name' => 'Error: ' . $e->getMessage() . ' line: ' . $e->getLine(),
                    'national_id' => 'ERROR',
                    'grade' => ['name' => 'Error'],
                    'division' => null,
                    'medical_record' => null
                ]
            ]);
        }
    }

    /**
     * تقرير السجلات الطبية والزيارات اليومية
     */
    public function getClinicReportFilterData(Request $request)
    {
        $query = ClinicVisit::with(['student.user', 'student.currentEnrollment.division.grade', 'student.medicalRecord']);

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status'); // روتيني، طارئ، محول

        if ($startDate) {
            $query->whereDate('visited_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('visited_at', '<=', $endDate);
        }
        if ($status) {
            $query->where('status', $status);
        }

        $visits = $query->orderBy('visited_at', 'desc')->get();

        return [
            'visits' => $visits,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
            ]
        ];
    }

    public function report(Request $request)
    {
        $data = $this->getClinicReportFilterData($request);
        return Inertia::render('Clinic/Report', $data);
    }

    public function downloadClinicReportPdf(Request $request)
    {
        $data = $this->getClinicReportFilterData($request);
        
        $printSettings = json_decode($request->input('printSettings', '{}'), true);
        $paperSize = $printSettings['paperSize'] ?? 'A4';
        $brandColor = $printSettings['brandColor'] ?? '#059669';
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

        $pdf = \Spatie\LaravelPdf\Facades\Pdf::view('pdf.clinic.visits-report', $data)
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
            ->download('clinic_visits_report.pdf');
    }
}
