<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\ParentSummon;
use App\Models\Student;
use App\Models\StudentViolation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ParentSummonController extends Controller
{
    public function index()
    {
        $branchId = auth()->user()->branch_id;
        
        $summons = ParentSummon::with(['student.user', 'violation.violationType'])
            ->where('branch_id', $branchId)
            ->latest()
            ->get();
            
        // For simple lookup in the form
        $students = Student::with('user')->whereHas('user', function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        })->get();

        $violations = StudentViolation::with('violationType')
            ->where('branch_id', $branchId)
            ->where('status', 'pending') // Maybe only show pending violations for summons
            ->get();

        return Inertia::render('Academic/StudentDiscipline/Summons/Index', [
            'summons' => $summons,
            'students' => $students,
            'violations' => $violations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'student_violation_id' => 'nullable|exists:student_violations,id',
            'summon_date' => 'required|date',
            'reason' => 'required|string',
        ]);

        $validated['branch_id'] = auth()->user()->branch_id;
        $validated['status'] = 'scheduled';

        $summon = ParentSummon::create($validated);

        // Parent Notification
        $student = Student::with(['parents'])->find($validated['student_id']);
        if ($student) {
            foreach ($student->parents as $parent) {
                $parent->notify(new \App\Notifications\ParentSummonIssuedNotification($summon));
            }
        }

        return redirect()->back()->with('success', 'تم إنشاء استدعاء ولي الأمر بنجاح وإرسال الإشعارات.');
    }

    public function update(Request $request, ParentSummon $parentSummon)
    {
        $validated = $request->validate([
            'summon_date' => 'required|date',
            'reason' => 'required|string',
            'status' => 'required|string', // scheduled, attended, no_show
            'notes' => 'nullable|string',
        ]);

        $parentSummon->update($validated);

        return redirect()->back()->with('success', 'تم تحديث حالة الاستدعاء بنجاح');
    }

    public function destroy(ParentSummon $parentSummon)
    {
        $parentSummon->delete();
        return redirect()->back()->with('success', 'تم الحذف بنجاح');
    }

    public function getParentSummonsReportFilterData(Request $request)
    {
        $branchId = auth()->user()->branch_id;
        $query = ParentSummon::with(['student.user', 'student.currentEnrollment.division.grade', 'violation.violationType'])
            ->where('branch_id', $branchId);

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status');

        if ($startDate) {
            $query->whereDate('summon_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('summon_date', '<=', $endDate);
        }
        if ($status) {
            $query->where('status', $status);
        }

        $summons = $query->orderBy('summon_date', 'desc')->get();

        return [
            'summons' => $summons,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
            ]
        ];
    }

    public function report(Request $request)
    {
        $data = $this->getParentSummonsReportFilterData($request);
        return Inertia::render('Academic/StudentDiscipline/Summons/Report', $data);
    }

    public function downloadParentSummonsReportPdf(Request $request)
    {
        $data = $this->getParentSummonsReportFilterData($request);
        
        $printSettings = json_decode($request->input('printSettings', '{}'), true);
        $paperSize = $printSettings['paperSize'] ?? 'A4';
        $brandColor = $printSettings['brandColor'] ?? '#475569';
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

        $pdf = \Spatie\LaravelPdf\Facades\Pdf::view('pdf.academic.student-parent-summons', $data)
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
            ->download('parent_summons_report.pdf');
    }
}
