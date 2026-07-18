<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\StudyPlan;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class StudyPlanController extends Controller
{
    public function index(Request $request)
    {
        $branchId = \Illuminate\Support\Facades\Auth::user()->branch_id ?? null;

        $query = StudyPlan::with(['grade', 'subject', 'teacher']);

        if ($branchId) {
            $query->whereHas('teacher', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $query->latest();

        if ($request->has('grade_id') && $request->grade_id) {
            $query->where('grade_id', $request->grade_id);
        }

        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('teacher_id') && $request->teacher_id) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $studyPlans = $query->paginate(15)->withQueryString();

        $user = \Illuminate\Support\Facades\Auth::user();
        $branchId = $user->branch_id ?? null;
        $isTeacher = $user->role && $user->role->name === 'معلم';

        $gradesQuery = Grade::query();
        if ($branchId) {
            $gradesQuery->where('branch_id', $branchId);
        }

        $subjectsQuery = Subject::query();
        if ($branchId) {
            $subjectsQuery->where('branch_id', $branchId);
        }

        if ($isTeacher) {
            $teacherAssignments = \App\Models\DivisionSubjectTeacher::where('teacher_id', $user->id)
                ->with('division')
                ->get();
                
            $teacherGradeIds = $teacherAssignments->pluck('division.grade_id')->unique()->filter()->toArray();
            $gradesQuery->whereIn('id', $teacherGradeIds);
            
            $teacherSubjectIds = $teacherAssignments->pluck('subject_id')->unique()->filter()->toArray();
            $subjectsQuery->whereIn('id', $teacherSubjectIds);
        }

        $grades = $gradesQuery->get();
        $subjects = $subjectsQuery->get(['id', 'name']);
        
        $teacherIds = StudyPlan::distinct()->pluck('teacher_id');
        $teachersQuery = User::whereIn('id', $teacherIds);
        if ($branchId) {
            $teachersQuery->where('branch_id', $branchId);
        }
        $teachers = $teachersQuery->get(['id', 'name']);

        $divisionsQuery = \App\Models\Division::query();
        if ($branchId) {
            $divisionsQuery->where('branch_id', $branchId);
        }
        $divisions = $divisionsQuery->get(['id', 'name']);

        return Inertia::render('Academic/StudyPlans/Index', [
            'studyPlans' => $studyPlans,
            'grades' => $grades,
            'subjects' => $subjects,
            'divisions' => $divisions,
            'teachers' => $teachers,
            'filters' => $request->only(['grade_id', 'subject_id', 'teacher_id', 'status'])
        ]);
    }

    public function destroy(StudyPlan $studyPlan)
    {
        if ($studyPlan->attachment_path) {
            Storage::disk('public')->delete($studyPlan->attachment_path);
        }

        $studyPlan->delete();

        return redirect()->back()->with('success', 'تم حذف الخطة الدراسية بنجاح.');
    }

    public function review(Request $request, StudyPlan $studyPlan)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_feedback' => 'nullable|string',
        ]);

        $studyPlan->update([
            'status' => $validated['status'],
            'admin_feedback' => $validated['admin_feedback'] ?? null,
        ]);

        // Create a notification for the teacher
        $title = $validated['status'] === 'approved' ? 'اعتماد الخطة الدراسية' : 'رفض الخطة الدراسية';
        $message = $validated['status'] === 'approved' 
            ? 'تم اعتماد خطتك الدراسية: ' . $studyPlan->title
            : 'تم رفض خطتك الدراسية: ' . $studyPlan->title . ' بسبب: ' . $validated['admin_feedback'];

        \App\Models\Notification::create([
            'sender_id' => \Illuminate\Support\Facades\Auth::id(),
            'branch_id' => $studyPlan->teacher->branch_id ?? 1,
            'title' => $title,
            'message' => $message,
            'type' => 'academic',
            'target_type' => 'specific_users',
            'target_users' => [$studyPlan->teacher_id],
        ]);

        return redirect()->back()->with('success', 'تم حفظ التقييم وإشعار المعلم بنجاح.');
    }

    public function download(StudyPlan $studyPlan)
    {
        if (!Storage::disk('public')->exists($studyPlan->attachment_path)) {
            abort(404, 'الملف غير موجود');
        }

        return Storage::disk('public')->download($studyPlan->attachment_path, $studyPlan->title . '.' . pathinfo($studyPlan->attachment_path, PATHINFO_EXTENSION));
    }
}
