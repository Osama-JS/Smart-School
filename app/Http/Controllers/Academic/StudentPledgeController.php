<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudentPledge;
use App\Models\Student;
use App\Models\StudentViolation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class StudentPledgeController extends Controller
{
    public function index()
    {
        $branchId = auth()->user()->branch_id;
        
        $pledges = StudentPledge::with(['student.user', 'violation.violationType'])
            ->where('branch_id', $branchId)
            ->latest()
            ->get();
            
        $students = Student::with('user')->whereHas('user', function($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        })->get();

        $violations = StudentViolation::with('violationType')
            ->where('branch_id', $branchId)
            ->get();

        return Inertia::render('Academic/StudentDiscipline/Pledges/Index', [
            'pledges' => $pledges,
            'students' => $students,
            'violations' => $violations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'student_violation_id' => 'nullable|exists:student_violations,id',
            'pledge_text' => 'required|string',
            'date' => 'required|date',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $data = $validated;
        unset($data['attachment']);

        if ($request->hasFile('attachment')) {
            $data['attachment_path'] = $request->file('attachment')->store('student_pledges', 'public');
        }

        $data['branch_id'] = auth()->user()->branch_id;
        $data['is_signed_by_student'] = $request->input('is_signed_by_student', false);
        $data['is_signed_by_parent'] = $request->input('is_signed_by_parent', false);

        $pledge = StudentPledge::create($data);

        // Notify parent
        $student = Student::with(['parents'])->find($validated['student_id']);
        if ($student) {
            foreach ($student->parents as $parent) {
                $parent->notify(new \App\Notifications\StudentPledgeIssuedNotification($pledge));
            }
        }

        return redirect()->back()->with('success', 'تم إنشاء التعهد بنجاح وإرسال إشعار لولي الأمر');
    }

    public function update(Request $request, StudentPledge $studentPledge)
    {
        $validated = $request->validate([
            'pledge_text' => 'required|string',
            'date' => 'required|date',
            'is_signed_by_student' => 'boolean',
            'is_signed_by_parent' => 'boolean',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $data = $validated;
        unset($data['attachment']);

        if ($request->hasFile('attachment')) {
            // Delete old attachment if exists
            if ($studentPledge->attachment_path) {
                Storage::disk('public')->delete($studentPledge->attachment_path);
            }
            $data['attachment_path'] = $request->file('attachment')->store('student_pledges', 'public');
        }

        $studentPledge->update($data);

        return redirect()->back()->with('success', 'تم التحديث بنجاح');
    }

    public function destroy(StudentPledge $studentPledge)
    {
        if ($studentPledge->attachment_path) {
            Storage::disk('public')->delete($studentPledge->attachment_path);
        }
        $studentPledge->delete();
        return redirect()->back()->with('success', 'تم الحذف بنجاح');
    }

    public function sign(Request $request, StudentPledge $studentPledge)
    {
        $request->validate([
            'signature_type' => 'required|in:student,parent',
            'signature_data' => 'required|string', // base64
        ]);

        $base64String = $request->signature_data;
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            return back()->with('error', 'صيغة التوقيع غير صالحة.');
        }

        $base64String = substr($base64String, strpos($base64String, ',') + 1);
        $type = strtolower($type[1]); // png
        $base64String = base64_decode($base64String);

        $fileName = 'pledges/signatures/' . $request->signature_type . '_' . uniqid() . '.' . $type;
        Storage::disk('public')->put($fileName, $base64String);

        if ($request->signature_type === 'student') {
            if ($studentPledge->student_signature_path) {
                Storage::disk('public')->delete($studentPledge->student_signature_path);
            }
            $studentPledge->student_signature_path = $fileName;
            $studentPledge->is_signed_by_student = true;
        } else {
            if ($studentPledge->parent_signature_path) {
                Storage::disk('public')->delete($studentPledge->parent_signature_path);
            }
            $studentPledge->parent_signature_path = $fileName;
            $studentPledge->is_signed_by_parent = true;
        }

        $studentPledge->save();

        return redirect()->back()->with('success', 'تم حفظ التوقيع الإلكتروني بنجاح');
    }

    /**
     * Display a printable report for student pledges.
     */
    public function getStudentPledgesReportFilterData(Request $request)
    {
        $branchId = auth()->user()->branch_id;
        
        $query = StudentPledge::with(['student.user', 'student.currentEnrollment.division.grade', 'violation.violationType'])
            ->where('branch_id', $branchId);

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status'); // fully_signed, partially_signed, unsigned

        if ($startDate) {
            $query->whereDate('date', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('date', '<=', $endDate);
        }
        if ($status === 'fully_signed') {
            $query->where('is_signed_by_student', true)->where('is_signed_by_parent', true);
        } elseif ($status === 'partially_signed') {
            $query->where(function($q) {
                $q->where(function($sub) {
                    $sub->where('is_signed_by_student', true)->where('is_signed_by_parent', false);
                })->orWhere(function($sub) {
                    $sub->where('is_signed_by_student', false)->where('is_signed_by_parent', true);
                });
            });
        } elseif ($status === 'unsigned') {
            $query->where('is_signed_by_student', false)->where('is_signed_by_parent', false);
        }

        $pledges = $query->orderBy('date', 'desc')->get();

        $allBranchPledges = StudentPledge::where('branch_id', $branchId)->get();
        $stats = [
            'total' => $allBranchPledges->count(),
            'fully_signed' => $allBranchPledges->where('is_signed_by_student', true)->where('is_signed_by_parent', true)->count(),
            'partially_signed' => $allBranchPledges->filter(function($p) {
                return ($p->is_signed_by_student xor $p->is_signed_by_parent);
            })->count(),
            'unsigned' => $allBranchPledges->where('is_signed_by_student', false)->where('is_signed_by_parent', false)->count(),
        ];

        return [
            'pledges' => $pledges,
            'stats' => $stats,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
            ]
        ];
    }

    public function report(Request $request)
    {
        $data = $this->getStudentPledgesReportFilterData($request);
        return Inertia::render('Academic/StudentDiscipline/Pledges/Report', $data);
    }

    public function downloadStudentPledgesReportPdf(Request $request)
    {
        $data = $this->getStudentPledgesReportFilterData($request);
        
        $printSettings = json_decode($request->input('printSettings', '{}'), true);
        $paperSize = $printSettings['paperSize'] ?? 'A4';
        $brandColor = $printSettings['brandColor'] ?? '#d97706';
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

        $pdf = \Spatie\LaravelPdf\Facades\Pdf::view('pdf.academic.student-pledges-report', $data)
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
            ->download('student_pledges_report.pdf');
    }
}
