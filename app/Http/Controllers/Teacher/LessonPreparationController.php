<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\LessonPreparation;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\AcademicYear;
use App\Models\MasterTimetable;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LessonPreparationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->branch_id;
        $activeYear = AcademicYear::where('is_active', true)->first();
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        $query = LessonPreparation::with(['grade', 'division', 'subject', 'period', 'reviewer:id,name'])
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
        $validated = $this->validatePreparation($request);
        $payload = Arr::except($validated, ['new_attachments', 'existing_attachments']);

        $activeYear = AcademicYear::where('is_active', true)->first();
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        $preparation = new LessonPreparation($payload);
        $preparation->teacher_id = Auth::id();
        $preparation->branch_id = Auth::user()->branch_id;
        $preparation->academic_year_id = $activeYear ? $activeYear->id : null;
        $preparation->semester_id = $activeSemester ? $activeSemester->id : null;

        // Database requires 'content' to not be null.
        $preparation->content = !empty($payload['topics_covered'])
            ? $payload['topics_covered']
            : ($payload['lesson_title'] ?? '');

        $preparation->attachments = $preparation->syncAttachmentsFromRequest($request, false);
        $preparation->save();

        $this->checkAndSendHomeworkNotification($preparation, true); // It's newly published, so treated as previously draft

        return redirect()->back()->with('success', 'تم حفظ سجل الحصة بنجاح.');
    }

    public function update(Request $request, LessonPreparation $lessonPreparation)
    {
        if ($lessonPreparation->teacher_id !== Auth::id() && !Auth::user()->hasPermission('إدارة النظام')) {
            abort(403);
        }

        if ($lessonPreparation->status === 'published' && !Auth::user()->hasPermission('إدارة النظام') && !Auth::user()->is_super_admin) {
            return redirect()->back()->with('error', 'لا يمكن تعديل سجل تحضير تم اعتماده ونشره مسبقاً.');
        }

        $validated = $this->validatePreparation($request);
        $payload = Arr::except($validated, ['new_attachments', 'existing_attachments']);

        // FormData omits empty arrays; ensure deselected chip groups clear properly.
        if (!array_key_exists('teaching_strategies', $payload)) {
            $payload['teaching_strategies'] = [];
        }
        if (!array_key_exists('educational_aids', $payload)) {
            $payload['educational_aids'] = [];
        }

        $wasDraft = $lessonPreparation->status === 'draft';

        $lessonPreparation->content = !empty($payload['topics_covered'])
            ? $payload['topics_covered']
            : ($payload['lesson_title'] ?? '');
        $payload['attachments'] = $lessonPreparation->syncAttachmentsFromRequest($request, true);
        $lessonPreparation->update($payload);

        $this->checkAndSendHomeworkNotification($lessonPreparation, $wasDraft);

        return redirect()->back()->with('success', 'تم تحديث سجل الحصة بنجاح.');
    }

    /**
     * Validate teacher lesson preparation payload based on draft/published status.
     */
    private function validatePreparation(Request $request): array
    {
        $isPublished = $request->input('status') === 'published';

        $rules = [
            'period_id' => 'nullable|exists:daily_periods,id',
            'unit_title' => 'nullable|string|max:255',
            'lesson_title' => 'required|string|max:255',
            'page_numbers' => 'nullable|string|max:100',
            'curriculum_progress' => 'nullable|string|max:255',
            'subject_id' => 'required|exists:subjects,id',
            'grade_id' => 'required|exists:grades,id',
            'division_id' => 'nullable|exists:divisions,id',
            'preparation_date' => 'required|date',
            'learning_objectives' => $isPublished ? 'required|string' : 'nullable|string',
            'warm_up' => 'nullable|string',
            'teaching_strategies' => $isPublished ? 'required|array|min:1' : 'nullable|array',
            'teaching_strategies.*' => 'string|max:100',
            'educational_aids' => $isPublished ? 'required|array|min:1' : 'nullable|array',
            'educational_aids.*' => 'string|max:100',
            'educational_activities' => 'nullable|string',
            'behavioral_value' => 'nullable|string',
            'acquired_skills' => 'nullable|string',
            'topics_covered' => $isPublished ? 'required|string' : 'nullable|string',
            'assessment_methods' => 'nullable|string',
            'reinforcements' => 'nullable|string',
            'notes' => 'nullable|string',
            'homework' => 'nullable|string',
            'existing_attachments' => 'nullable|array',
            'new_attachments' => 'nullable|array',
            'new_attachments.*' => 'file|max:20480|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,webp,zip',
            'status' => 'required|in:draft,published',
        ];

        return $request->validate($rules, [
            'lesson_title.required' => 'عنوان الدرس مطلوب.',
            'subject_id.required' => 'المادة الدراسية مطلوبة.',
            'grade_id.required' => 'الصف الدراسي مطلوب.',
            'preparation_date.required' => 'تاريخ التنفيذ مطلوب.',
            'learning_objectives.required' => 'الأهداف التعليمية مطلوبة عند نشر الحصة.',
            'teaching_strategies.required' => 'يرجى اختيار استراتيجية تدريس واحدة على الأقل عند نشر الحصة.',
            'teaching_strategies.min' => 'يرجى اختيار استراتيجية تدريس واحدة على الأقل عند نشر الحصة.',
            'educational_aids.required' => 'يرجى اختيار وسيلة تعليمية واحدة على الأقل عند نشر الحصة.',
            'educational_aids.min' => 'يرجى اختيار وسيلة تعليمية واحدة على الأقل عند نشر الحصة.',
            'topics_covered.required' => 'ملخص الشرح (ما تم دراسته) مطلوب عند نشر الحصة.',
            'new_attachments.*.max' => 'حجم كل ملف مرفق يجب ألا يتجاوز 20 ميجابايت.',
            'new_attachments.*.mimes' => 'صيغة الملف غير مدعومة. الصيغ المسموحة: PDF, Word, PowerPoint, Excel, صور, ZIP.',
        ]);
    }

    public function destroy(LessonPreparation $lessonPreparation)
    {
        if ($lessonPreparation->teacher_id !== Auth::id() && !Auth::user()->hasPermission('إدارة النظام')) {
            abort(403);
        }

        if ($lessonPreparation->status === 'published' && !Auth::user()->hasPermission('إدارة النظام') && !Auth::user()->is_super_admin) {
            return redirect()->back()->with('error', 'لا يمكن حذف سجل تحضير تم اعتماده ونشره مسبقاً.');
        }

        $lessonPreparation->deleteStoredAttachments();
        $lessonPreparation->delete();

        return redirect()->back()->with('success', 'تم حذف سجل الحصة بنجاح.');
    }

    private function checkAndSendHomeworkNotification(LessonPreparation $preparation, $wasDraft)
    {
        if ($preparation->status === 'published' && $wasDraft && !empty($preparation->homework) && $preparation->division_id) {
            app(\App\Services\AutomaticNotificationService::class)->notifyHomeworkPublished($preparation);
        }
    }
}
