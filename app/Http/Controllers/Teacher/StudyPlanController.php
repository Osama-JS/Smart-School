<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\StudyPlan;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\Division;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class StudyPlanController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->branch_id;

        $query = StudyPlan::with(['grade', 'subject', 'template'])
            ->where('teacher_id', $user->id)
            ->latest();

        if ($request->has('grade_id') && $request->grade_id) {
            $query->where('grade_id', $request->grade_id);
        }

        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        $studyPlans = $query->paginate(15)->withQueryString();

        $formData = $this->getFormData();

        return Inertia::render('Teacher/StudyPlans/Index', [
            'studyPlans' => $studyPlans,
            'filters' => $request->only(['grade_id', 'subject_id']),
            ...$formData
        ]);
    }

    private function getFormData()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $branchId = $user->branch_id;

        $gradesQuery = Grade::query();
        if ($branchId) {
            $gradesQuery->where('branch_id', $branchId);
        }

        $subjectsQuery = Subject::query();
        if ($branchId) {
            $subjectsQuery->where('branch_id', $branchId);
        }

        $divisionsQuery = Division::query();
        if ($branchId) {
            $divisionsQuery->where('branch_id', $branchId);
        }

        // Restrict based on teacher's assignments (check both assignments and timetable)
        $divisionTeacherIds = \App\Models\DivisionSubjectTeacher::where('teacher_id', $user->id)->pluck('division_id')->toArray();
        $timetableDivisionIds = \App\Models\MasterTimetable::where('teacher_id', $user->id)->pluck('division_id')->toArray();
        $allDivisionIds = array_unique(array_merge($divisionTeacherIds, $timetableDivisionIds));

        $divisionsAssigned = \App\Models\Division::whereIn('id', $allDivisionIds)->get();
        $teacherGradeIds = $divisionsAssigned->pluck('grade_id')->unique()->filter()->toArray();

        if (empty($teacherGradeIds)) {
            $gradesQuery->whereRaw('1 = 0');
        } else {
            $gradesQuery->whereIn('id', $teacherGradeIds);
        }
        
        $teacherSubjectIds1 = \App\Models\DivisionSubjectTeacher::where('teacher_id', $user->id)->pluck('subject_id')->toArray();
        $teacherSubjectIds2 = \App\Models\MasterTimetable::where('teacher_id', $user->id)->pluck('subject_id')->toArray();
        $allSubjectIds = array_unique(array_merge($teacherSubjectIds1, $teacherSubjectIds2));

        if (empty($allSubjectIds)) {
            $subjectsQuery->whereRaw('1 = 0');
        } else {
            $subjectsQuery->whereIn('id', $allSubjectIds);
        }

        if (empty($allDivisionIds)) {
            $divisionsQuery->whereRaw('1 = 0');
        } else {
            $divisionsQuery->whereIn('id', $allDivisionIds);
        }

        $grades = $gradesQuery->get();
        $subjects = $subjectsQuery->get(['id', 'name']);
        $divisions = $divisionsQuery->get(['id', 'name', 'grade_id']);

        $currentYear = \App\Models\AcademicYear::currentForBranch($branchId);
        $currentSemester = $currentYear ? $currentYear->activeSemester : null;

        $templates = \App\Models\StudyPlanTemplate::where('is_active', true)
            ->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            })
            ->where(function($q) use ($currentYear, $currentSemester) {
                if ($currentYear) {
                    $q->where('academic_year_id', $currentYear->id)
                      ->where(function($sq) use ($currentSemester) {
                          $sq->whereNull('semester_id');
                          if ($currentSemester) {
                              $sq->orWhere('semester_id', $currentSemester->id);
                          }
                      });
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->with('semester')
            ->get(['id', 'name', 'month', 'columns', 'weeks', 'semester_id']);

        return [
            'grades' => $grades,
            'subjects' => $subjects,
            'divisions' => $divisions,
            'templates' => $templates,
        ];
    }

    public function create()
    {
        $formData = $this->getFormData();
        return Inertia::render('Teacher/StudyPlans/Form', $formData);
    }

    public function edit(StudyPlan $studyPlan)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if ($studyPlan->teacher_id !== $user->id) {
            abort(403);
        }

        $formData = $this->getFormData();
        
        return Inertia::render('Teacher/StudyPlans/Form', array_merge($formData, [
            'studyPlan' => $studyPlan,
        ]));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subject_id' => 'required|exists:subjects,id',
            'grade_id' => 'required|exists:grades,id',
            'division_ids' => 'nullable|array',
            'division_ids.*' => 'exists:divisions,id',
            'notes' => 'nullable|string',
            'template_id' => 'nullable|exists:study_plan_templates,id',
            'content' => 'nullable|array',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // Max 10MB
            'action' => 'required|in:draft,pending',
        ]);

        if (empty($validated['content']) && !$request->hasFile('attachment')) {
            return redirect()->back()->withErrors(['error' => 'يجب إما تعبئة الجدول الإلكتروني أو إرفاق ملف الخطة.']);
        }

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('study_plans', 'public');
        }

        $month = null;
        if (!empty($validated['template_id'])) {
            $template = \App\Models\StudyPlanTemplate::find($validated['template_id']);
            if ($template && $template->month) {
                $month = $template->month;
            }
        }

        $structuredContent = null;
        if (isset($validated['content']) || $month) {
            $structuredContent = [
                'month' => $month,
                'rows' => $validated['content'] ?? []
            ];
        }

        StudyPlan::create([
            'teacher_id' => Auth::id(),
            'grade_id' => $validated['grade_id'],
            'subject_id' => $validated['subject_id'],
            'division_ids' => $validated['division_ids'] ?? [],
            'title' => $validated['title'],
            'month' => $month,
            'notes' => $validated['notes'] ?? null,
            'template_id' => $validated['template_id'] ?? null,
            'content' => $structuredContent,
            'attachment_path' => $path,
            'status' => $validated['action'],
        ]);

        $msg = $validated['action'] === 'pending' ? 'تم رفع الخطة وإرسالها للمراجعة بنجاح.' : 'تم حفظ الخطة كمسودة بنجاح.';
        return redirect()->back()->with('success', $msg);
    }

    public function update(Request $request, StudyPlan $studyPlan)
    {
        if ($studyPlan->teacher_id !== Auth::id()) {
            abort(403);
        }

        if (in_array($studyPlan->status, ['pending', 'approved'])) {
            return redirect()->back()->withErrors(['error' => 'لا يمكن تعديل الخطة وهي قيد المراجعة أو معتمدة.']);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subject_id' => 'required|exists:subjects,id',
            'grade_id' => 'required|exists:grades,id',
            'division_ids' => 'nullable|array',
            'division_ids.*' => 'exists:divisions,id',
            'notes' => 'nullable|string',
            'template_id' => 'nullable|exists:study_plan_templates,id',
            'content' => 'nullable|array',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'action' => 'required|in:draft,pending',
        ]);

        if (empty($validated['content']) && !$studyPlan->attachment_path && !$request->hasFile('attachment')) {
            return redirect()->back()->withErrors(['error' => 'يجب إما تعبئة الجدول الإلكتروني أو إرفاق ملف الخطة.']);
        }

        $month = null;
        if (!empty($validated['template_id'])) {
            $template = \App\Models\StudyPlanTemplate::find($validated['template_id']);
            if ($template && $template->month) {
                $month = $template->month;
            }
        }

        $structuredContent = null;
        if (isset($validated['content']) || $month) {
            $structuredContent = [
                'month' => $month,
                'rows' => $validated['content'] ?? []
            ];
        }

        $updateData = [
            'title' => $validated['title'],
            'month' => $month,
            'subject_id' => $validated['subject_id'],
            'grade_id' => $validated['grade_id'],
            'division_ids' => $validated['division_ids'] ?? [],
            'notes' => $validated['notes'] ?? null,
            'template_id' => $validated['template_id'] ?? null,
            'content' => $structuredContent,
            'status' => $validated['action'],
            'admin_feedback' => null,
        ];

        if ($request->hasFile('attachment')) {
            if ($studyPlan->attachment_path) {
                Storage::disk('public')->delete($studyPlan->attachment_path);
            }
            $updateData['attachment_path'] = $request->file('attachment')->store('study_plans', 'public');
        }

        $studyPlan->update($updateData);

        $msg = $validated['action'] === 'pending' ? 'تم تحديث الخطة وإرسالها للمراجعة بنجاح.' : 'تم تحديث المسودة بنجاح.';
        return redirect()->back()->with('success', $msg);
    }

    public function destroy(StudyPlan $studyPlan)
    {
        if ($studyPlan->teacher_id !== Auth::id()) {
            abort(403);
        }

        if (in_array($studyPlan->status, ['pending', 'approved'])) {
            return redirect()->back()->withErrors(['error' => 'لا يمكن حذف الخطة وهي قيد المراجعة أو معتمدة.']);
        }

        if ($studyPlan->attachment_path) {
            Storage::disk('public')->delete($studyPlan->attachment_path);
        }

        $studyPlan->delete();

        return redirect()->back()->with('success', 'تم حذف الخطة الدراسية بنجاح.');
    }

    public function download(StudyPlan $studyPlan)
    {
        if ($studyPlan->teacher_id !== Auth::id()) {
            abort(403);
        }

        if (!Storage::disk('public')->exists($studyPlan->attachment_path)) {
            abort(404, 'الملف غير موجود');
        }

        return Storage::disk('public')->download($studyPlan->attachment_path, $studyPlan->title . '.' . pathinfo($studyPlan->attachment_path, PATHINFO_EXTENSION));
    }
}
