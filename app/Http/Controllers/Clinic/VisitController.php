<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\ClinicVisit;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Notifications\ParentNotification;
use Illuminate\Support\Facades\Notification;

class VisitController extends Controller
{
    /**
     * Show form to create a visit.
     */
    public function create(Request $request)
    {
        $studentId = $request->query('student_id');
        $formattedStudent = null;
        if ($studentId) {
            $student = Student::with('medicalRecord', 'currentEnrollment.division.grade', 'user')->findOrFail($studentId);
            $enrollment = $student->currentEnrollment;
            $formattedStudent = [
                'id' => $student->id,
                'name' => $student->user->name ?? 'غير معروف',
                'national_id' => $student->user->username ?? '---',
                'grade' => $enrollment && $enrollment->division && $enrollment->division->grade ? ['name' => $enrollment->division->grade->name] : null,
                'division' => $enrollment && $enrollment->division ? ['name' => $enrollment->division->name] : null,
                'medical_record' => $student->medicalRecord ? clone $student->medicalRecord : null,
            ];
        }

        return Inertia::render('Clinic/Visits/Create', [
            'student' => $formattedStudent ? (object) $formattedStudent : null,
        ]);
    }

    /**
     * Store a new clinic visit.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'symptoms' => 'required|string',
            'action_taken' => 'required|string',
            'status' => 'required|in:returned_to_class,sent_home,emergency',
        ]);

        $visit = ClinicVisit::create([
            'student_id' => $validated['student_id'],
            'user_id' => auth()->id(),
            'visited_at' => now(),
            'symptoms' => $validated['symptoms'],
            'action_taken' => $validated['action_taken'],
            'status' => $validated['status'],
        ]);

        // Notify parent if parent exists
        $student = Student::with(['parents', 'user'])->find($validated['student_id']);
        if ($student && $student->parents->isNotEmpty()) {
            $studentName = $student->user->name ?? 'طالب';
            $message = "تمت زيارة ابنكم/ابنتكم ({$studentName}) للعيادة المدرسية الساعة " . now()->format('H:i') . 
                       ". الأعراض: {$validated['symptoms']}. الإجراء: {$validated['action_taken']}.";
            
            foreach ($student->parents as $parentUser) {
                try {
                    \App\Models\Notification::create([
                        'user_id' => $parentUser->id,
                        'title' => 'زيارة للعيادة المدرسية',
                        'message' => $message,
                        'type' => 'info',
                        'link' => '#'
                    ]);
                } catch (\Exception $e) {
                    // Ignore if Notification table structure is different
                }
            }
        }

        return redirect()->route('clinic.index')->with('success', 'تم تسجيل الزيارة وإشعار ولي الأمر بنجاح.');
    }
}
