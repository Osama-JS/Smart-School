<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\LessonPreparation;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\AcademicYear;
use App\Models\MasterTimetable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class LessonPreparationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->branch_id;
        $activeYear = AcademicYear::where('is_active', true)->first();
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        $query = LessonPreparation::with(['grade', 'division', 'subject'])
            ->where('teacher_id', $user->id)
            ->latest('preparation_date');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        
        if ($activeYear) {
            $query->where('academic_year_id', $activeYear->id);
        }

        if ($request->has('grade_id') && $request->grade_id) {
            $query->where('grade_id', $request->grade_id);
        }

        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('date_range') && $request->date_range) {
            $dates = explode(' to ', $request->date_range);
            if (count($dates) == 2) {
                $query->whereDate('preparation_date', '>=', trim($dates[0]))
                      ->whereDate('preparation_date', '<=', trim($dates[1]));
            } else {
                $query->whereDate('preparation_date', trim($dates[0]));
            }
        }

        $preparations = $query->paginate(15)->withQueryString();

        $gradesQuery = Grade::with('divisions');
        if ($branchId) {
            $gradesQuery->where('branch_id', $branchId);
        }
        $grades = $gradesQuery->get();

        $subjectsQuery = Subject::query();
        if ($branchId) {
            $subjectsQuery->where('branch_id', $branchId);
        }
        $subjects = $subjectsQuery->get(['id', 'name']);

        $schedulesQuery = MasterTimetable::with(['division.grade', 'subject', 'period'])
            ->where('teacher_id', $user->id);
        
        if ($activeSemester) {
            $schedulesQuery->where('semester_id', $activeSemester->id);
        }
        
        $schedules = $schedulesQuery->get();

        return Inertia::render('Teacher/LessonPreparations/Index', [
            'preparations' => $preparations,
            'grades' => $grades,
            'subjects' => $subjects,
            'schedules' => $schedules,
            'filters' => $request->only(['grade_id', 'subject_id', 'date_range'])
        ]);
    }

    public function store(Request $request)
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

        $activeYear = AcademicYear::where('is_active', true)->first();
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        $preparation = new LessonPreparation($validated);
        $preparation->teacher_id = Auth::id();
        $preparation->branch_id = Auth::user()->branch_id;
        $preparation->academic_year_id = $activeYear ? $activeYear->id : null;
        $preparation->semester_id = $activeSemester ? $activeSemester->id : null;
        
        // Database requires 'content' to not be null. Fallback to topics_covered or empty string.
        $preparation->content = $request->input('topics_covered', $request->input('lesson_title', ''));
        
        $preparation->save();

        $this->checkAndSendHomeworkNotification($preparation, true); // It's newly published, so treated as previously draft

        return redirect()->back()->with('success', 'تم حفظ سجل الحصة بنجاح.');
    }

    public function update(Request $request, LessonPreparation $lessonPreparation)
    {
        if ($lessonPreparation->teacher_id !== Auth::id()) {
            abort(403);
        }

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

        $wasDraft = $lessonPreparation->status === 'draft';

        $lessonPreparation->content = $request->input('topics_covered', $request->input('lesson_title', ''));
        $lessonPreparation->update($validated);

        $this->checkAndSendHomeworkNotification($lessonPreparation, $wasDraft);

        return redirect()->back()->with('success', 'تم تحديث سجل الحصة بنجاح.');
    }

    public function destroy(LessonPreparation $lessonPreparation)
    {
        if ($lessonPreparation->teacher_id !== Auth::id()) {
            abort(403);
        }

        $lessonPreparation->delete();

        return redirect()->back()->with('success', 'تم حذف سجل الحصة بنجاح.');
    }

    private function checkAndSendHomeworkNotification(LessonPreparation $preparation, $wasDraft)
    {
        if ($preparation->status === 'published' && $wasDraft && !empty($preparation->homework) && $preparation->division_id) {
            $studentUserIds = \App\Models\Student::whereIn('id', 
                \App\Models\Enrollment::where('division_id', $preparation->division_id)->pluck('student_id')
            )->pluck('user_id')->toArray();

            if (!empty($studentUserIds)) {
                $subjectName = $preparation->subject ? $preparation->subject->name : 'المادة';
                \App\Models\Notification::create([
                    'sender_id' => Auth::id(),
                    'branch_id' => $preparation->branch_id,
                    'title' => 'واجب منزلي جديد: ' . $subjectName,
                    'message' => 'تم تحديد واجب جديد: ' . $preparation->homework,
                    'type' => 'homework',
                    'target_type' => 'students',
                    'target_role' => 'student',
                    'target_users' => $studentUserIds,
                    'is_read' => false
                ]);
            }
        }
    }
}
