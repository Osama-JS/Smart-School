<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentMedicalRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicalRecordController extends Controller
{
    /**
     * Show the medical record of a student.
     */
    public function show(Student $student)
    {
        $student->load('medicalRecord', 'parents', 'user', 'currentEnrollment.division.grade');
        
        // Ensure a blank medical record exists so the form doesn't crash if null
        if (!$student->medicalRecord) {
            $student->medicalRecord = new StudentMedicalRecord();
        }

        $enrollment = $student->currentEnrollment;
        
        // Map to what frontend expects
        $formattedStudent = [
            'id' => $student->id,
            'name' => $student->user->name ?? 'غير معروف',
            'national_id' => $student->user->username ?? '---',
            'grade' => $enrollment && $enrollment->division && $enrollment->division->grade ? ['name' => $enrollment->division->grade->name] : null,
            'division' => $enrollment && $enrollment->division ? ['name' => $enrollment->division->name] : null,
            'medicalRecord' => clone $student->medicalRecord,
        ];

        return Inertia::render('Clinic/Records/Show', [
            'student' => (object) $formattedStudent,
        ]);
    }

    /**
     * Update or create the medical record.
     */
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'height' => 'nullable|numeric|min:30|max:250',
            'weight' => 'nullable|numeric|min:10|max:200',
            'blood_type' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'chronic_diseases' => 'nullable|string',
            'regular_medications' => 'nullable|string',
            'past_surgeries' => 'nullable|string',
            'consent_given' => 'boolean',
        ]);

        $record = $student->medicalRecord()->updateOrCreate(
            ['student_id' => $student->id],
            $validated
        );

        return back()->with('success', 'تم تحديث الملف الطبي بنجاح.');
    }
}
