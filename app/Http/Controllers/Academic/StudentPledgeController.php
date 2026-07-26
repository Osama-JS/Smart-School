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
}
