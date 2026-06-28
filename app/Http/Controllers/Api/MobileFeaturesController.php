<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MasterTimetable;
use App\Models\LessonPreparation;
use App\Models\EmployeeRequest;
use App\Models\Subject;
use App\Models\Grade;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MobileFeaturesController extends Controller
{
    /**
     * Get Timetable for Teacher
     */
    public function getTimetable(Request $request)
    {
        $user = $request->user();
        
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        $schedules = MasterTimetable::with(['division.grade', 'subject', 'period'])
            ->where('teacher_id', $user->id)
            ->when($activeSemester, function ($q) use ($activeSemester) {
                return $q->where('semester_id', $activeSemester->id);
            })
            ->get();

        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    /**
     * Get Lesson Preparations
     */
    public function getPreparations(Request $request)
    {
        $user = $request->user();
        
        $preparations = LessonPreparation::with(['grade', 'division', 'subject'])
            ->where('teacher_id', $user->id)
            ->latest('preparation_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $preparations
        ]);
    }

    /**
     * Get Subjects and Grades for Dropdowns
     */
    public function getPreparationFormData(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $grades = Grade::with('divisions')->when($branchId, fn($q) => $q->where('branch_id', $branchId))->get();
        $subjects = Subject::when($branchId, fn($q) => $q->where('branch_id', $branchId))->get(['id', 'name']);

        return response()->json([
            'success' => true,
            'data' => [
                'grades' => $grades,
                'subjects' => $subjects
            ]
        ]);
    }

    /**
     * Store Lesson Preparation
     */
    public function storePreparation(Request $request)
    {
        $validated = $request->validate([
            'lesson_title' => 'required|string|max:255',
            'subject_id' => 'required|exists:subjects,id',
            'grade_id' => 'required|exists:grades,id',
            'division_id' => 'nullable|exists:divisions,id',
            'preparation_date' => 'required|date',
            'topics_covered' => 'nullable|string',
            'notes' => 'nullable|string',
            'homework' => 'nullable|string',
            'status' => 'required|in:draft,published',
        ]);

        $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        $preparation = new LessonPreparation($validated);
        $preparation->teacher_id = $request->user()->id;
        $preparation->branch_id = $request->user()->branch_id;
        $preparation->academic_year_id = $activeYear ? $activeYear->id : null;
        $preparation->semester_id = $activeSemester ? $activeSemester->id : null;
        $preparation->content = $request->input('topics_covered', $request->input('lesson_title', ''));
        
        $preparation->save();

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ تحضير الدرس بنجاح'
        ]);
    }

    /**
     * Get Employee Requests
     */
    public function getEmployeeRequests(Request $request)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Not an employee'], 403);
        }

        $requests = EmployeeRequest::where('employee_id', $employee->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    /**
     * Store Employee Request
     */
    public function storeEmployeeRequest(Request $request)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Not an employee'], 403);
        }

        $request->validate([
            'type' => 'required|string',
            'details' => 'nullable|array',
            'employee_notes' => 'nullable|string',
        ]);

        $newRequest = new EmployeeRequest();
        $newRequest->employee_id = $employee->id;
        $newRequest->branch_id = $request->user()->branch_id;
        $newRequest->type = $request->type;
        $newRequest->details = $request->details ?? [];
        $newRequest->employee_notes = $request->employee_notes;
        $newRequest->status = 'pending';
        // Mocking signature for mobile app for now, or you can send base64
        $newRequest->employee_signature = 'mobile_app_submission'; 

        $newRequest->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تقديم الطلب بنجاح'
        ]);
    }
}
