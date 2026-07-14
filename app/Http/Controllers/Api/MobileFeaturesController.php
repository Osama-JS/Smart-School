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
        
        $query = LessonPreparation::with(['grade', 'division', 'subject'])
            ->where('teacher_id', $user->id)
            ->latest('preparation_date');

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

        $preparations = $query->paginate(15);

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

        $this->checkAndSendHomeworkNotification($preparation, true, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ تحضير الدرس بنجاح',
            'data' => $preparation
        ]);
    }

    /**
     * Update Lesson Preparation
     */
    public function updatePreparation(Request $request, LessonPreparation $lessonPreparation)
    {
        if ($lessonPreparation->teacher_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
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

        $this->checkAndSendHomeworkNotification($lessonPreparation, $wasDraft, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث سجل الحصة بنجاح',
            'data' => $lessonPreparation
        ]);
    }

    /**
     * Delete Lesson Preparation
     */
    public function deletePreparation(Request $request, LessonPreparation $lessonPreparation)
    {
        if ($lessonPreparation->teacher_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $lessonPreparation->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف سجل الحصة بنجاح'
        ]);
    }

    private function checkAndSendHomeworkNotification(LessonPreparation $preparation, $wasDraft, $user)
    {
        if ($preparation->status === 'published' && $wasDraft && !empty($preparation->homework) && $preparation->division_id) {
            $studentUserIds = \App\Models\Student::whereIn('id', 
                \App\Models\Enrollment::where('division_id', $preparation->division_id)->pluck('student_id')
            )->pluck('user_id')->toArray();

            if (!empty($studentUserIds)) {
                $subjectName = $preparation->subject ? $preparation->subject->name : 'المادة';
                \App\Models\Notification::create([
                    'sender_id' => $user->id,
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

    /**
     * Get Employee Requests
     */
    public function getEmployeeRequests(Request $request)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Not an employee'], 403);
        }

        $query = EmployeeRequest::where('employee_id', $employee->id)->latest();

        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('type') && !empty($request->type) && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        $requests = $query->paginate(15);

        // Fetch summary across all requests for this employee
        $summary = [
            'total' => EmployeeRequest::where('employee_id', $employee->id)->count(),
            'pending' => EmployeeRequest::where('employee_id', $employee->id)->where('status', 'pending')->count(),
            'approved' => EmployeeRequest::where('employee_id', $employee->id)->where('status', 'approved')->count(),
            'rejected' => EmployeeRequest::where('employee_id', $employee->id)->where('status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'summary' => $summary,
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
            'employee_signature' => 'required|string',
        ]);

        $newRequest = new EmployeeRequest();
        $newRequest->employee_id = $employee->id;
        $newRequest->branch_id = $request->user()->branch_id;
        $newRequest->type = $request->type;
        $newRequest->details = $request->details ?? [];
        $newRequest->employee_notes = $request->employee_notes;
        $newRequest->status = 'pending';
        
        if ($request->filled('employee_signature') && Str::startsWith($request->employee_signature, 'data:image')) {
            $newRequest->employee_signature = $this->saveBase64Signature($request->employee_signature, 'employee');
        } else {
            $newRequest->employee_signature = 'mobile_app_submission'; // fallback
        }

        $newRequest->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تقديم الطلب بنجاح'
        ]);
    }

    public function getAttendanceReview(Request $request)
    {
        abort_unless($request->user()->hasPermission('مراجعة الحضور والانصراف') || $request->user()->hasPermission('عرض الحضور والانصراف'), 403, 'لا تملك صلاحية مراجعة الحضور');
        
        $branchId = $request->user()->branch_id;
        $date = $request->input('date', now()->format('Y-m-d'));

        $employees = \App\Models\Employee::with(['attendances' => function ($query) use ($date) {
            $query->whereDate('attendance_date', $date);
        }, 'user.role', 'department', 'jobGrade'])
        ->when($branchId, fn($q) => $q->whereHas('user', function($uq) use ($branchId) {
            $uq->where('branch_id', $branchId);
        }))
        ->get();

        return response()->json([
            'success' => true,
            'data' => $employees,
            'date' => $date
        ]);
    }

    public function getMyClassroomVisits(Request $request)
    {
        abort_unless($request->user()->hasPermission('عرض زياراتي الصفية'), 403, 'لا تملك صلاحية عرض زياراتك الصفية');
        
        $visits = \App\Models\ClassroomVisit::with(['supervisor', 'grade', 'division'])
            ->where('teacher_id', $request->user()->id)
            ->latest('visit_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $visits
        ]);
    }

    public function getManageClassroomVisits(Request $request)
    {
        abort_unless($request->user()->hasPermission('عرض الزيارات الصفية') || $request->user()->hasPermission('إدارة الزيارات الصفية'), 403, 'لا تملك صلاحية عرض الزيارات الصفية');
        
        $visits = \App\Models\ClassroomVisit::with(['teacher', 'grade', 'division'])
            ->where('supervisor_id', $request->user()->id)
            ->latest('visit_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $visits
        ]);
    }

    public function storeClassroomVisit(Request $request)
    {
        abort_unless($request->user()->hasPermission('إضافة زيارة صفية'), 403, 'لا تملك صلاحية إضافة زيارة صفية');
        
        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'grade_id' => 'required|exists:grades,id',
            'division_id' => 'nullable|exists:divisions,id',
            'visit_date' => 'required|date',
            'score' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'discussed_points' => 'nullable|string',
        ]);

        $visit = new \App\Models\ClassroomVisit($validated);
        $visit->supervisor_id = $request->user()->id;
        $visit->branch_id = $request->user()->branch_id;
        $visit->save();

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة الزيارة بنجاح',
            'data' => $visit
        ]);
    }

    public function getInfractions(Request $request)
    {
        abort_unless($request->user()->hasPermission('عرض مخالفاتي'), 403, 'لا تملك صلاحية عرض مخالفاتك');
        
        $infractions = \App\Models\EmployeeViolation::with('violationType')
            ->where('user_id', $request->user()->id)
            ->latest('violation_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $infractions
        ]);
    }

    public function getAchievements(Request $request)
    {
        abort_unless($request->user()->hasPermission('عرض إنجازاتي'), 403, 'لا تملك صلاحية عرض إنجازاتك');
        
        $achievements = \App\Models\EmployeeAchievement::with('achievementType')
            ->where('user_id', $request->user()->id)
            ->latest('achievement_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $achievements
        ]);
    }

    public function getMyReportTemplates(Request $request)
    {
        $user = $request->user();
        
        $templates = \App\Models\ReportTemplate::with('jobGrade')
            ->where(function($q) use ($user) {
                if ($user->employee && $user->employee->job_grade_id) {
                    $q->where('job_grade_id', $user->employee->job_grade_id);
                } else {
                    $q->where('id', 0);
                }
            })
            ->get();

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    public function getReportTemplateDetails(Request $request, $id)
    {
        $template = \App\Models\ReportTemplate::with('fields')->findOrFail($id);
        $user = $request->user();

        $templateArray = $template->toArray();

        $activeYear = \App\Models\AcademicYear::currentForBranch($user->branch_id);
        $workingDays = $activeYear && $activeYear->working_days ? $activeYear->working_days : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
        
        $daysAr = [
            'Saturday' => 'السبت',
            'Sunday' => 'الأحد',
            'Monday' => 'الإثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
        ];
        
        $templateArray['working_days'] = array_map(function($day) use ($daysAr) {
            return $daysAr[$day] ?? $day;
        }, $workingDays);

        $fieldsArray = $template->fields->map(function ($field) use ($user, $template, $request) {
            $fieldArr = $field->toArray();

            if ($field->type === 'data_source') {
                $options = is_array($field->options) ? $field->options : json_decode($field->options, true) ?? [];
                $source = $options['source'] ?? null;

                if ($source === 'classroom_visits') {
                    $startDate = $request->has('start_date') ? \Carbon\Carbon::parse($request->get('start_date')) : now()->startOfWeek();
                    $endDate   = $request->has('end_date') ? \Carbon\Carbon::parse($request->get('end_date')) : now()->endOfWeek();

                    if (!$request->has('start_date') && !$request->has('end_date')) {
                        if ($template->period_type === 'monthly') {
                            $startDate = now()->startOfMonth();
                            $endDate   = now()->endOfMonth();
                        } elseif ($template->period_type === 'daily') {
                            $startDate = now()->startOfDay();
                            $endDate   = now()->endOfDay();
                        }
                    }

                    $visits = \App\Models\ClassroomVisit::with('teacher')
                        ->where('supervisor_id', $user->id)
                        ->whereBetween('visit_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($visit) {
                            return [
                                'id'               => $visit->id,
                                'day'              => $visit->visit_date->locale('ar')->isoFormat('dddd'),
                                'date'             => $visit->visit_date->format('Y-m-d'),
                                'teacher_name'     => $visit->teacher ? $visit->teacher->name : '',
                                'visit_type'       => $visit->visit_type,
                                'notes'            => $visit->notes,
                                'evaluation'       => $visit->score,
                                'discussed_points' => $visit->discussed_points,
                            ];
                        });

                    $fieldArr['prefilled_data'] = $visits;
                }
            }

            return $fieldArr;
        })->toArray();

        $templateArray['fields'] = $fieldsArray;

        return response()->json([
            'success' => true,
            'data' => $templateArray
        ]);
    }

    public function submitReport(Request $request, $id)
    {
        $template = \App\Models\ReportTemplate::with('fields')->findOrFail($id);
        
        $inputData = $request->input('data');
        if (is_string($inputData)) {
            $inputData = json_decode($inputData, true) ?? [];
        }

        $user = $request->user();
        $activeYear = \App\Models\AcademicYear::currentForBranch($user->branch_id);
        $activeSemester = $activeYear ? $activeYear->activeSemester : null;

        $finalData = [];
        foreach ($template->fields as $field) {
            $key = 'field_' . $field->id;
            
            if ($request->hasFile($key)) {
                $path = $request->file($key)->store('reports/files', 'public');
                $finalData[$field->id] = $path;
            } else {
                $finalData[$field->id] = $inputData[$field->id] ?? null;
            }
        }

        \App\Models\Report::create([
            'branch_id' => $user->branch_id,
            'report_template_id' => $template->id,
            'submitter_id' => $user->id,
            'status' => 'pending',
            'data' => $finalData,
            'period_type' => $template->period_type,
            'period_start_date' => $request->period_start_date ?? null,
            'period_end_date' => $request->period_end_date ?? null,
            'period_label' => $request->period_label ?? null,
            'academic_year_id' => $activeYear ? $activeYear->id : null,
            'semester_id' => $activeSemester ? $activeSemester->id : null,
        ]);

        return response()->json(['success' => true, 'message' => 'تم الإرسال بنجاح']);
    }

    public function getMyReports(Request $request)
    {
        $user = $request->user();
        
        $myReports = \App\Models\Report::with(['template.fields', 'reviewer'])
            ->where('submitter_id', $user->id)
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $myReports
        ]);
    }

    private function saveBase64Signature(string $base64String, string $prefix): ?string
    {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            return null;
        }
        $data     = substr($base64String, strpos($base64String, ',') + 1);
        $ext      = strtolower($type[1]);
        $decoded  = base64_decode($data);
        $fileName = 'employee-requests/signatures/' . $prefix . '_' . uniqid() . '.' . $ext;
        Storage::disk('public')->put($fileName, $decoded);
        return $fileName;
    }
}
