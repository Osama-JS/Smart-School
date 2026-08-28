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
        
        $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();
        $activeSemester = \App\Models\Semester::where('is_active', true)
            ->orWhere(function($q) {
                $q->whereDate('start_date', '<=', now())->whereDate('end_date', '>=', now());
            })->first();

        $query = MasterTimetable::with(['division.grade', 'subject', 'period', 'teacher'])
            ->where(function($q) use ($user) {
                $q->where('teacher_id', $user->id);
                if ($user->employee) {
                    $q->orWhere('teacher_id', $user->employee->id);
                }
            });

        if ($activeSemester) {
            $query->where(function($q) use ($activeSemester) {
                $q->where('semester_id', $activeSemester->id)
                  ->orWhereNull('semester_id');
            });
        }

        $schedules = $query->get();

        $workingDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        if ($activeYear && !empty($activeYear->working_days)) {
            $workingDays = is_array($activeYear->working_days) ? $activeYear->working_days : json_decode($activeYear->working_days, true);
        }

        return response()->json([
            'success' => true,
            'data' => $schedules,
            'working_days' => $workingDays
        ]);
    }

    /**
     * Get Lesson Preparations with Filters and Summary
     */
    public function getPreparations(Request $request)
    {
        $user = $request->user();
        
        $baseQuery = LessonPreparation::with(['grade', 'division', 'subject'])
            ->where('teacher_id', $user->id);

        $allTeacherPreps = (clone $baseQuery)->get();
        $summary = [
            'total' => $allTeacherPreps->count(),
            'published' => $allTeacherPreps->where('status', 'published')->count(),
            'draft' => $allTeacherPreps->where('status', 'draft')->count(),
            'with_homework' => $allTeacherPreps->filter(fn($p) => !empty($p->homework))->count(),
        ];

        $query = (clone $baseQuery)->latest('preparation_date');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('lesson_title', 'like', "%{$search}%")
                  ->orWhere('topics_covered', 'like', "%{$search}%")
                  ->orWhere('homework', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('subject', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('grade', fn($gq) => $gq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('grade_id') && $request->grade_id !== 'all') {
            $query->where('grade_id', $request->grade_id);
        }

        if ($request->filled('subject_id') && $request->subject_id !== 'all') {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('preparation_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('preparation_date', '<=', $request->end_date);
        }

        $preparations = $query->get()->map(function($prep) {
            return [
                'id' => $prep->id,
                'lesson_title' => $prep->lesson_title,
                'subject_id' => $prep->subject_id,
                'subject_name' => $prep->subject?->name ?? '-',
                'grade_id' => $prep->grade_id,
                'grade_name' => $prep->grade?->name ?? '-',
                'division_id' => $prep->division_id,
                'division_name' => $prep->division?->name ?? '',
                'preparation_date' => $prep->preparation_date ? (is_string($prep->preparation_date) ? $prep->preparation_date : $prep->preparation_date->format('Y-m-d')) : '',
                'topics_covered' => $prep->topics_covered,
                'homework' => $prep->homework,
                'notes' => $prep->notes,
                'status' => $prep->status ?? 'draft',
                'created_at' => $prep->created_at ? $prep->created_at->toIso8601String() : null,
            ];
        });

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'data' => $preparations
        ]);
    }

    /**
     * Get Subjects, Grades, and Teacher Schedules for Smart Preparation Auto-fill
     */
    public function getPreparationFormData(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        $grades = Grade::with('divisions')->when($branchId, fn($q) => $q->where('branch_id', $branchId))->get();
        $subjects = Subject::when($branchId, fn($q) => $q->where('branch_id', $branchId))->get(['id', 'name']);

        $schedulesQuery = \App\Models\MasterTimetable::with(['division.grade', 'subject', 'period'])
            ->where('teacher_id', $user->id);
        
        if ($activeSemester) {
            $schedulesQuery->where('semester_id', $activeSemester->id);
        }
        
        $schedules = $schedulesQuery->get()->map(function($s) {
            return [
                'id' => $s->id,
                'day_of_week' => strtolower(trim($s->day_of_week ?? '')),
                'period_id' => $s->period_id,
                'period_name' => $s->period?->name ?? "حصة {$s->period_id}",
                'subject_id' => $s->subject_id,
                'subject_name' => $s->subject?->name ?? '',
                'grade_id' => $s->division?->grade_id ?? '',
                'grade_name' => $s->division?->grade?->name ?? '',
                'division_id' => $s->division_id,
                'division_name' => $s->division?->name ?? '',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'grades' => $grades,
                'subjects' => $subjects,
                'schedules' => $schedules,
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
        if ($lessonPreparation->teacher_id !== $request->user()->id && !$request->user()->hasPermission('إدارة النظام')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        // Prevent editing if already published/approved
        if ($lessonPreparation->status === 'published' && !$request->user()->hasPermission('إدارة النظام') && !$request->user()->is_super_admin) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن تعديل سجل تحضير تم اعتماده ونشره مسبقاً.'
            ], 403);
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
        if ($lessonPreparation->teacher_id !== $request->user()->id && !$request->user()->hasPermission('إدارة النظام')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        // Prevent deleting if already published/approved
        if ($lessonPreparation->status === 'published' && !$request->user()->hasPermission('إدارة النظام') && !$request->user()->is_super_admin) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف سجل تحضير تم اعتماده ونشره مسبقاً.'
            ], 403);
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

    public function getManageClassroomVisits(Request $request)
    {
        return $this->getClassroomVisits($request);
    }

    public function getInfractions(Request $request)
    {
        $user = $request->user();
        $empId = $user->employee?->id;
        
        $query = \App\Models\EmployeeViolation::with('violationType')
            ->where(function($q) use ($user, $empId) {
                $q->where('user_id', $user->id);
                if ($empId) {
                    $q->orWhere('user_id', $empId);
                }
            });

        if ($request->filled('violation_type_id')) {
            $query->where('violation_type_id', $request->violation_type_id);
        }
        if ($request->filled('start_date')) {
            $query->whereDate('violation_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('violation_date', '<=', $request->end_date);
        }
        if ($request->filled('status')) {
            if ($request->status === 'signed') {
                $query->whereNotNull('employee_signature');
            } elseif ($request->status === 'unsigned') {
                $query->whereNull('employee_signature');
            }
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('details', 'like', "%{$search}%")
                  ->orWhereHas('violationType', fn($t) => $t->where('name', 'like', "%{$search}%"));
            });
        }

        $infractions = $query->latest('violation_date')->get();

        $types = \App\Models\ViolationType::where('is_active', true)->get(['id', 'name']);
        $pendingCount = $infractions->whereNull('employee_signature')->count();
        $signedCount = $infractions->whereNotNull('employee_signature')->count();

        return response()->json([
            'success' => true,
            'data' => $infractions,
            'types' => $types,
            'stats' => [
                'total' => $infractions->count(),
                'pending' => $pendingCount,
                'signed' => $signedCount,
            ]
        ]);
    }

    public function getAchievements(Request $request)
    {
        $user = $request->user();
        
        \Illuminate\Support\Facades\Log::info("=== [API CALL] GET /mobile/features/achievements ===", [
            'user_id' => $user->id,
            'username' => $user->username ?? $user->email,
            'name' => $user->name,
            'role' => $user->role?->name ?? 'None',
            'query_params' => $request->all(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        $query = \App\Models\EmployeeAchievement::with('achievementType')
            ->where('user_id', $user->id);

        if ($request->filled('achievement_type_id')) {
            $query->where('achievement_type_id', $request->achievement_type_id);
        }
        if ($request->filled('start_date')) {
            $query->whereDate('achievement_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('achievement_date', '<=', $request->end_date);
        }
        if ($request->filled('status')) {
            if ($request->status === 'signed') {
                $query->whereNotNull('employee_signature');
            } elseif ($request->status === 'unsigned') {
                $query->whereNull('employee_signature');
            }
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('details', 'like', "%{$search}%")
                  ->orWhereHas('achievementType', fn($t) => $t->where('name', 'like', "%{$search}%"));
            });
        }

        $achievements = $query->latest('achievement_date')->get();

        $types = \App\Models\AchievementType::where('is_active', true)->get(['id', 'name']);
        $totalPoints = $achievements->sum('points');
        $badges = $achievements->map(function($a) {
            return $a->achievementType && $a->achievementType->badge_icon ? [
                'name' => $a->achievementType->name,
                'badge_icon' => $a->achievementType->badge_icon,
                'badge_color' => $a->achievementType->badge_color,
            ] : null;
        })->filter()->unique('name')->values();

        $pendingCount = $achievements->whereNull('employee_signature')->count();
        $signedCount = $achievements->whereNotNull('employee_signature')->count();

        \Illuminate\Support\Facades\Log::info("=== [API RESULT] Achievements Retrieved ===", [
            'user_id' => $user->id,
            'count' => $achievements->count(),
            'total_points' => $totalPoints,
            'achievements_list' => $achievements->map(function($a) {
                return [
                    'id' => $a->id,
                    'type' => $a->achievementType?->name,
                    'points' => $a->points,
                    'signed' => !empty($a->employee_signature),
                    'date' => $a->achievement_date?->format('Y-m-d'),
                ];
            })->toArray()
        ]);

        return response()->json([
            'success' => true,
            'data' => $achievements,
            'types' => $types,
            'total_points' => $totalPoints,
            'badges' => $badges,
            'stats' => [
                'total' => $achievements->count(),
                'pending' => $pendingCount,
                'signed' => $signedCount,
            ]
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
                } elseif ($source === 'employee_violations') {
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

                    $violations = \App\Models\EmployeeViolation::with(['user', 'violationType'])
                        ->whereBetween('violation_date', [$startDate->startOfDay(), $endDate->endOfDay()])
                        ->get()
                        ->map(function ($violation) {
                            return [
                                'id'               => $violation->id,
                                'employee_name'    => $violation->user ? $violation->user->name : '',
                                'violation_type'   => $violation->violationType ? $violation->violationType->name : '',
                                'violation_date'   => \Carbon\Carbon::parse($violation->violation_date)->format('Y-m-d'),
                                'repetition_level' => $violation->repetition_level ?? '',
                                'action_taken'     => $violation->action_taken ?? '',
                                'status'           => $violation->status ?? '',
                                'details'          => $violation->details ?? '',
                            ];
                        });

                    $fieldArr['prefilled_data'] = $violations;
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

    // ── Teacher Study Plans ──

    public function getStudyPlans(Request $request)
    {
        $user = $request->user();
        $empId = $user->employee?->id;
        $branchId = $user->branch_id;
        
        $baseQuery = \App\Models\StudyPlan::with(['grade', 'subject', 'template', 'teacher', 'rows', 'comments'])
            ->where(function($q) use ($user, $empId) {
                $q->where('teacher_id', $user->id);
                if ($empId) {
                    $q->orWhere('teacher_id', $empId);
                }
                if ($user->hasPermission('عرض الخطط الدراسية') || $user->hasPermission('إدارة الخطط الدراسية')) {
                    if ($user->branch_id) {
                        $q->orWhereHas('grade', fn($g) => $g->where('branch_id', $user->branch_id));
                    }
                }
            });

        // Compute summary counts across all matching plans for this user/branch
        $allPlans = (clone $baseQuery)->get();
        $summary = [
            'total' => $allPlans->count(),
            'approved' => $allPlans->filter(fn($p) => in_array($p->status, ['approved', 'معتمد']))->count(),
            'submitted' => $allPlans->filter(fn($p) => in_array($p->status, ['submitted', 'مرفوعة', 'pending']))->count(),
            'draft' => $allPlans->filter(fn($p) => in_array($p->status, ['draft', 'مسودة']))->count(),
        ];

        $query = (clone $baseQuery)->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('admin_feedback', 'like', "%{$search}%")
                  ->orWhereHas('subject', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('grade', fn($gq) => $gq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('teacher', fn($tq) => $tq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'approved') {
                $query->whereIn('status', ['approved', 'معتمد']);
            } elseif ($request->status === 'submitted') {
                $query->whereIn('status', ['submitted', 'مرفوعة', 'pending']);
            } elseif ($request->status === 'draft') {
                $query->whereIn('status', ['draft', 'مسودة']);
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('grade_id') && $request->grade_id !== 'all') {
            $query->where('grade_id', $request->grade_id);
        }

        if ($request->filled('subject_id') && $request->subject_id !== 'all') {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('month') && $request->month !== 'all') {
            $query->where('month', $request->month);
        }

        $grades = \App\Models\Grade::when($branchId, fn($q) => $q->where('branch_id', $branchId))->get(['id', 'name']);
        $subjects = \App\Models\Subject::when($branchId, fn($q) => $q->where('branch_id', $branchId))->get(['id', 'name']);

        $plans = $query->get()->map(function($plan) {
            return [
                'id' => $plan->id,
                'title' => $plan->title ?? 'خطة دراسية',
                'grade_id' => $plan->grade_id,
                'grade_name' => $plan->grade?->name ?? '-',
                'subject_id' => $plan->subject_id,
                'subject_name' => $plan->subject?->name ?? '-',
                'teacher_name' => $plan->teacher?->name ?? '-',
                'template_name' => $plan->template?->name ?? 'نموذج عام',
                'month' => $plan->month,
                'notes' => $plan->notes,
                'admin_feedback' => $plan->admin_feedback,
                'status' => $plan->status ?? 'draft',
                'rows_count' => $plan->rows->count(),
                'comments_count' => $plan->comments->count(),
                'has_attachment' => !empty($plan->attachment_path),
                'attachment_url' => $plan->attachment_path ? url('storage/' . $plan->attachment_path) : null,
                'created_at' => $plan->created_at ? $plan->created_at->format('Y-m-d') : null,
            ];
        });

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'filters' => [
                'grades' => $grades,
                'subjects' => $subjects,
            ],
            'data' => $plans
        ]);
    }

    public function getStudyPlanDetails(Request $request, \App\Models\StudyPlan $studyPlan)
    {
        $user = $request->user();
        $empId = $user->employee?->id;
        $isOwner = $studyPlan->teacher_id === $user->id || ($empId && $studyPlan->teacher_id === $empId);
        $hasPermission = $user->hasPermission('عرض الخطط الدراسية') || $user->hasPermission('إدارة الخطط الدراسية') || $user->hasPermission('إدارة النظام') || $user->is_super_admin;
        $sameBranch = $user->branch_id && $studyPlan->grade?->branch_id === $user->branch_id;

        if (!$isOwner && !$hasPermission && !$sameBranch) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $studyPlan->load([
            'grade',
            'subject',
            'template',
            'teacher',
            'rows',
            'comments.user:id,name',
        ]);

        $formattedPlan = [
            'id' => $studyPlan->id,
            'title' => $studyPlan->title ?? 'خطة دراسية',
            'status' => $studyPlan->status ?? 'draft',
            'month' => $studyPlan->month,
            'notes' => $studyPlan->notes,
            'admin_feedback' => $studyPlan->admin_feedback,
            'has_attachment' => !empty($studyPlan->attachment_path),
            'attachment_url' => $studyPlan->attachment_path ? url('storage/' . $studyPlan->attachment_path) : null,
            'created_at' => $studyPlan->created_at ? $studyPlan->created_at->format('Y-m-d') : null,
            'teacher' => [
                'id' => $studyPlan->teacher?->id,
                'name' => $studyPlan->teacher?->name ?? '-',
            ],
            'grade' => [
                'id' => $studyPlan->grade?->id,
                'name' => $studyPlan->grade?->name ?? '-',
            ],
            'subject' => [
                'id' => $studyPlan->subject?->id,
                'name' => $studyPlan->subject?->name ?? '-',
            ],
            'template' => $studyPlan->template ? [
                'id' => $studyPlan->template->id,
                'name' => $studyPlan->template->name,
                'columns' => $studyPlan->template->columns ?? [],
                'weeks' => $studyPlan->template->weeks ?? [],
                'month' => $studyPlan->template->month,
            ] : null,
            'rows' => $studyPlan->rows->map(function($r, $idx) {
                return [
                    'id' => $r->id,
                    'row_index' => $idx + 1,
                    'data' => $r->data ?? [],
                ];
            }),
            'comments' => $studyPlan->comments->map(function($c) {
                return [
                    'id' => $c->id,
                    'comment' => $c->comment,
                    'user_id' => $c->user_id,
                    'user_name' => $c->user?->name ?? 'مستخدم',
                    'cell_key' => $c->cell_key,
                    'is_resolved' => (bool)$c->is_resolved,
                    'created_at' => $c->created_at ? $c->created_at->format('Y-m-d H:i') : null,
                ];
            }),
        ];

        return response()->json([
            'success' => true,
            'data' => $formattedPlan
        ]);
    }

    public function storeStudyPlanComment(Request $request, \App\Models\StudyPlan $studyPlan)
    {
        $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        $comment = $studyPlan->comments()->create([
            'user_id' => $request->user()->id,
            'comment' => $request->comment,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة التعليق بنجاح',
            'data' => $comment->load('user:id,name')
        ]);
    }

    // ── Teacher Followup Books ──

    public function getFollowupBooks(Request $request)
    {
        $teacherId = $request->user()->id;

        $startDateInput = $request->query('start_date');
        $endDateInput = $request->query('end_date');
        $weekOffset = (int) $request->query('week_offset', 0);
        
        if ($startDateInput && $endDateInput) {
            $startOfWeek = \Carbon\Carbon::parse($startDateInput)->startOfDay();
            $endOfWeek = \Carbon\Carbon::parse($endDateInput)->endOfDay();
        } else {
            $startOfWeek = now()->addWeeks($weekOffset)->startOfWeek(\Carbon\Carbon::SUNDAY)->startOfDay();
            $endOfWeek = $startOfWeek->copy()->endOfWeek(\Carbon\Carbon::THURSDAY)->endOfDay();
        }
        
        $period = \Carbon\CarbonPeriod::create($startOfWeek, $endOfWeek);

        $timetable = \App\Models\MasterTimetable::with(['subject', 'division.grade'])
            ->where('teacher_id', $teacherId)
            ->get();

        $followups = \App\Models\FollowupBook::where('teacher_id', $teacherId)
            ->whereBetween('date', [$startOfWeek, $endOfWeek])
            ->get()
            ->keyBy(function($item) {
                return $item->date->format('Y-m-d') . '_' . $item->division_id . '_' . $item->subject_id;
            });

        $dayNames = [
            'Saturday' => 'السبت', 'Sunday' => 'الأحد', 'Monday' => 'الاثنين',
            'Tuesday' => 'الثلاثاء', 'Wednesday' => 'الأربعاء', 'Thursday' => 'الخميس', 'Friday' => 'الجمعة',
        ];

        $days = [];

        foreach ($period as $date) {
            $dayOfWeek = $date->format('l');
            $lessonsForDay = $timetable->filter(function($item) use ($dayOfWeek) {
                return strtolower($item->day_of_week) === strtolower($dayOfWeek);
            })->unique(function ($item) {
                return $item->subject_id . '_' . $item->division_id;
            });

            $lessons = [];
            foreach ($lessonsForDay as $lesson) {
                $key = $date->format('Y-m-d') . '_' . $lesson->division_id . '_' . $lesson->subject_id;
                $followup = $followups->get($key);

                $lessons[] = [
                    'subject' => $lesson->subject,
                    'division' => $lesson->division,
                    'has_followup' => $followup ? true : false,
                ];
            }

            $days[] = [
                'date' => $date->format('Y-m-d'),
                'day_name' => $dayNames[$dayOfWeek] ?? $dayOfWeek,
                'lessons' => $lessons
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'days' => $days,
                'period_start' => $startOfWeek->format('Y-m-d'),
                'period_end' => $endOfWeek->format('Y-m-d'),
                'week_offset' => $weekOffset
            ]
        ]);
    }

    public function showFollowupBook(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'subject_id' => 'required|exists:subjects,id',
            'date' => 'required|date',
        ]);

        $divisionId = $request->division_id;
        $subjectId = $request->subject_id;
        $date = $request->date;
        $teacherId = $request->user()->id;

        $enrollments = \App\Models\Enrollment::with('student.user')
            ->where('division_id', $divisionId)
            ->where('status', 'active')
            ->get();

        $followup = \App\Models\FollowupBook::with('entries')
            ->where('teacher_id', $teacherId)
            ->where('division_id', $divisionId)
            ->where('subject_id', $subjectId)
            ->whereDate('date', $date)
            ->first();

        $entriesKeyed = $followup ? $followup->entries->keyBy('student_id') : collect();

        $students = $enrollments->map(function ($enrollment) use ($entriesKeyed) {
            $studentId = $enrollment->student->user_id ?? $enrollment->student_id;
            $entry = $entriesKeyed->get($studentId);

            return [
                'student_id' => $studentId,
                'name' => $enrollment->student->user->name ?? $enrollment->student->name ?? 'طالب',
                'homework' => $entry ? (bool)$entry->homework : true,
                'participation' => $entry ? (int)$entry->participation : 5,
                'behavior' => $entry ? (int)$entry->behavior : 5,
                'memorization' => $entry ? (int)$entry->memorization : 5,
                'notes' => $entry ? $entry->notes : '',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'lesson_topic' => $followup ? $followup->lesson_topic : '',
                'homework_assigned' => $followup ? $followup->homework_assigned : '',
                'general_notes' => $followup ? $followup->notes : '',
                'students' => $students,
            ]
        ]);
    }

    public function storeFollowupBook(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'subject_id' => 'required|exists:subjects,id',
            'date' => 'required|date',
            'lesson_topic' => 'nullable|string',
            'homework_assigned' => 'nullable|string',
            'general_notes' => 'nullable|string',
            'entries' => 'required|array',
            'entries.*.student_id' => 'required',
            'entries.*.homework' => 'nullable|boolean',
            'entries.*.participation' => 'nullable|numeric',
            'entries.*.behavior' => 'nullable|numeric',
            'entries.*.memorization' => 'nullable|numeric',
            'entries.*.notes' => 'nullable|string',
        ]);

        $teacherId = $request->user()->id;

        $followup = \App\Models\FollowupBook::updateOrCreate(
            [
                'teacher_id' => $teacherId,
                'division_id' => $request->division_id,
                'subject_id' => $request->subject_id,
                'date' => $request->date,
            ],
            [
                'lesson_topic' => $request->lesson_topic,
                'homework_assigned' => $request->homework_assigned,
                'notes' => $request->general_notes,
            ]
        );

        foreach ($request->entries as $entry) {
            $followup->entries()->updateOrCreate(
                [
                    'student_id' => $entry['student_id'],
                ],
                [
                    'homework' => $entry['homework'] ?? true,
                    'participation' => $entry['participation'] ?? 5,
                    'behavior' => $entry['behavior'] ?? 5,
                    'memorization' => $entry['memorization'] ?? 5,
                    'notes' => $entry['notes'] ?? null,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ دفتر المتابعة بنجاح'
        ]);
    }

    // ── Teacher Monthly Grades Entry (New Grading System) ──

    public function getMonthlyGradesFormData(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;
        $empId = $user->employee?->id;
        $today = now()->format('Y-m-d');

        $periods = \App\Models\ResultPeriod::where(function($q) use ($branchId) {
                if ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                }
            })
            ->orderBy('fill_start_date', 'desc')
            ->get()
            ->map(function($p) use ($today) {
                $startDate = $p->fill_start_date ? $p->fill_start_date->format('Y-m-d') : null;
                $endDate = $p->fill_end_date ? $p->fill_end_date->format('Y-m-d') : null;
                $isOpen = true;
                if ($startDate && $endDate) {
                    $isOpen = ($today >= $startDate && $today <= $endDate);
                }
                return [
                    'id' => $p->id,
                    'name' => $p->month_name ?? "فترة {$p->id}",
                    'period_type' => $p->period_type ?? 'monthly',
                    'fill_start_date' => $startDate,
                    'fill_end_date' => $endDate,
                    'is_open' => $isOpen,
                    'weeks_dates' => $p->weeks_dates ?? [],
                ];
            });

        $assignedSubjects = [];
        $divisionsList = [];

        // Teacher assignments from both DivisionSubjectTeacher and MasterTimetable
        $dstAssignments = \App\Models\DivisionSubjectTeacher::with(['division.grade', 'subject'])
            ->where(function($q) use ($user, $empId) {
                $q->where('teacher_id', $user->id);
                if ($empId) $q->orWhere('teacher_id', $empId);
            })
            ->get();

        $ttAssignments = \App\Models\MasterTimetable::with(['division.grade', 'subject'])
            ->where(function($q) use ($user, $empId) {
                $q->where('teacher_id', $user->id);
                if ($empId) $q->orWhere('teacher_id', $empId);
            })
            ->get();

        $allAssignments = $dstAssignments->concat($ttAssignments)->unique(function ($item) {
            return $item->division_id . '-' . $item->subject_id;
        });

        if ($allAssignments->isNotEmpty()) {
            $divIds = $allAssignments->pluck('division_id')->unique()->filter()->values();
            $divisions = \App\Models\Division::with('grade')->whereIn('id', $divIds)->get();

            foreach ($divisions as $div) {
                $divSubs = [];
                $matching = $allAssignments->where('division_id', $div->id);
                foreach ($matching as $item) {
                    if ($item->subject) {
                        $s = $item->subject;
                        $divSubs[] = [
                            'division_id' => $div->id,
                            'subject_id' => $s->id,
                            'subject' => [
                                'id' => $s->id,
                                'name' => $s->name,
                                'weekly_oral_max' => $s->weekly_oral_max ?? 5,
                                'weekly_homework_max' => $s->weekly_homework_max ?? 5,
                                'monthly_behavior_max' => $s->monthly_behavior_max ?? 10,
                                'monthly_exam_max' => $s->monthly_exam_max ?? 50,
                                'weeks_per_month' => $s->weeks_per_month ?? 4,
                            ],
                        ];
                    }
                }
                if (!empty($divSubs)) {
                    $assignedSubjects[(string)$div->id] = $divSubs;
                    $divisionsList[] = [
                        'id' => $div->id,
                        'name' => $div->name,
                        'grade' => [
                            'id' => $div->grade?->id,
                            'name' => $div->grade?->name ?? '',
                        ],
                    ];
                }
            }
        } else if ($user->hasPermission('إدارة النظام') || $user->is_super_admin) {
            // Admin only fallback: show division's grade subjects
            $divisions = \App\Models\Division::with(['grade.subjects'])
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->get();

            foreach ($divisions as $div) {
                $divSubs = [];
                if ($div->grade && $div->grade->subjects) {
                    foreach ($div->grade->subjects as $s) {
                        $divSubs[] = [
                            'division_id' => $div->id,
                            'subject_id' => $s->id,
                            'subject' => [
                                'id' => $s->id,
                                'name' => $s->name,
                                'weekly_oral_max' => $s->weekly_oral_max ?? 5,
                                'weekly_homework_max' => $s->weekly_homework_max ?? 5,
                                'monthly_behavior_max' => $s->monthly_behavior_max ?? 10,
                                'monthly_exam_max' => $s->monthly_exam_max ?? 50,
                                'weeks_per_month' => $s->weeks_per_month ?? 4,
                            ],
                        ];
                    }
                }
                if (!empty($divSubs)) {
                    $assignedSubjects[(string)$div->id] = $divSubs;
                    $divisionsList[] = [
                        'id' => $div->id,
                        'name' => $div->name,
                        'grade' => [
                            'id' => $div->grade?->id,
                            'name' => $div->grade?->name ?? '',
                        ],
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'periods' => $periods,
                'divisions' => $divisionsList,
                'assigned_subjects' => $assignedSubjects,
            ]
        ]);
    }

    public function getMonthlyGradesStudents(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'subject_id' => 'required|exists:subjects,id',
            'period_id' => 'required|exists:result_periods,id',
        ]);

        $divisionId = $request->division_id;
        $subjectId = $request->subject_id;
        $periodId = $request->period_id;
        
        $period = \App\Models\ResultPeriod::with('semester')->findOrFail($periodId);
        $division = \App\Models\Division::with('grade')->findOrFail($divisionId);
        $subject = \App\Models\Subject::findOrFail($subjectId);

        $today = now()->format('Y-m-d');
        $startDate = $period->fill_start_date ? $period->fill_start_date->format('Y-m-d') : null;
        $endDate = $period->fill_end_date ? $period->fill_end_date->format('Y-m-d') : null;
        $isPeriodOpen = true;
        if ($startDate && $endDate) {
            $isPeriodOpen = ($today >= $startDate && $today <= $endDate);
        }

        // Academic year check
        $academicYearId = $period->semester?->academic_year_id;

        $enrollments = \App\Models\Enrollment::with('student.user')
            ->where('division_id', $divisionId)
            ->when($academicYearId, fn($q) => $q->where('academic_year_id', $academicYearId))
            ->where('status', 'active')
            ->get();

        $existingGrades = \App\Models\MonthlyGrade::where('subject_id', $subjectId)
            ->where('period_id', $periodId)
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->get()
            ->keyBy('enrollment_id');

        // Weeks configuration
        $weeksCount = $subject->weeks_per_month ?: 4;
        $weeksDates = $period->weeks_dates;
        $weeksList = [];

        if (!empty($weeksDates) && is_array($weeksDates)) {
            foreach ($weeksDates as $idx => $wData) {
                $weekKey = "week_" . ($idx + 1);
                $weeksList[] = [
                    'key' => $weekKey,
                    'name' => $wData['name'] ?? "الأسبوع " . ($idx + 1),
                    'start_date' => $wData['start_date'] ?? null,
                    'end_date' => $wData['end_date'] ?? null,
                    'is_started' => empty($wData['start_date']) || $today >= $wData['start_date'],
                ];
            }
        } else {
            for ($i = 1; $i <= $weeksCount; $i++) {
                $weeksList[] = [
                    'key' => "week_$i",
                    'name' => "الأسبوع $i",
                    'start_date' => null,
                    'end_date' => null,
                    'is_started' => true,
                ];
            }
        }

        $allSubmitted = $existingGrades->isNotEmpty() && $existingGrades->every(fn($g) => $g->is_submitted);

        $students = $enrollments->map(function ($enrollment) use ($existingGrades, $weeksList) {
            $gradeRecord = $existingGrades->get($enrollment->id);
            $weeklyScores = $gradeRecord?->weekly_scores ?? [];
            $scores = $gradeRecord?->scores ?? [];

            // Compute cumulative totals
            $oralTotal = 0;
            $hwTotal = 0;
            foreach ($weeksList as $w) {
                $wKey = $w['key'];
                if (isset($weeklyScores[$wKey])) {
                    $oralTotal += (float)($weeklyScores[$wKey]['oral'] ?? 0);
                    $hwTotal += (float)($weeklyScores[$wKey]['homework'] ?? 0);
                }
            }

            $behavior = (float)($scores['behavior'] ?? 0);
            $exam = (float)($scores['monthly_exam'] ?? 0);
            $grandTotal = $scores['grand_total'] ?? ($oralTotal + $hwTotal + $behavior + $exam);

            return [
                'enrollment_id' => $enrollment->id,
                'student_id' => $enrollment->student->user_id ?? $enrollment->student_id,
                'name' => $enrollment->student->user->name ?? $enrollment->student->name ?? 'طالب',
                'is_submitted' => (bool)($gradeRecord?->is_submitted ?? false),
                'submitted_at' => $gradeRecord?->submitted_at ? $gradeRecord->submitted_at->format('Y-m-d H:i') : null,
                'weekly_scores' => $weeklyScores,
                'summary' => [
                    'oral_total' => $oralTotal,
                    'homework_total' => $hwTotal,
                    'behavior' => $scores['behavior'] ?? null,
                    'monthly_exam' => $scores['monthly_exam'] ?? null,
                    'grand_total' => $grandTotal,
                    'note' => $scores['note'] ?? '',
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'division' => [
                    'id' => $division->id,
                    'name' => $division->name,
                    'grade_name' => $division->grade?->name ?? '',
                ],
                'subject' => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'weekly_oral_max' => (float)($subject->weekly_oral_max ?? 5),
                    'weekly_homework_max' => (float)($subject->weekly_homework_max ?? 5),
                    'monthly_behavior_max' => (float)($subject->monthly_behavior_max ?? 10),
                    'monthly_exam_max' => (float)($subject->monthly_exam_max ?? 50),
                    'weeks_per_month' => (int)($subject->weeks_per_month ?? 4),
                ],
                'period' => [
                    'id' => $period->id,
                    'name' => $period->month_name ?? "فترة {$period->id}",
                    'fill_start_date' => $startDate,
                    'fill_end_date' => $endDate,
                    'is_open' => $isPeriodOpen,
                ],
                'weeks' => $weeksList,
                'is_all_submitted' => $allSubmitted,
                'students' => $students,
            ]
        ]);
    }

    public function saveWeeklyMonthlyGrades(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'subject_id' => 'required|exists:subjects,id',
            'period_id' => 'required|exists:result_periods,id',
            'week_key' => 'required|string',
            'grades' => 'required|array',
            'grades.*.enrollment_id' => 'required|exists:enrollments,id',
            'grades.*.oral' => 'nullable|numeric|min:0',
            'grades.*.homework' => 'nullable|numeric|min:0',
            'grades.*.note' => 'nullable|string|max:500',
        ]);

        $period = \App\Models\ResultPeriod::findOrFail($request->period_id);
        $subjectId = $request->subject_id;
        $weekKey = $request->week_key;

        // Check if period is open
        $today = now()->format('Y-m-d');
        if ($period->fill_start_date && $period->fill_end_date) {
            $startDate = $period->fill_start_date->format('Y-m-d');
            $endDate = $period->fill_end_date->format('Y-m-d');
            if ($today < $startDate || $today > $endDate) {
                return response()->json(['success' => false, 'message' => 'فترة رصد الدرجات مغلقة حالياً'], 422);
            }
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($request->grades as $gradeData) {
                $monthlyGrade = \App\Models\MonthlyGrade::firstOrCreate(
                    [
                        'enrollment_id' => $gradeData['enrollment_id'],
                        'period_id' => $period->id,
                        'subject_id' => $subjectId,
                    ],
                    [
                        'semester_id' => $period->semester_id,
                        'weekly_scores' => [],
                    ]
                );

                if ($monthlyGrade->is_submitted) {
                    continue; // Skip already submitted records
                }

                $weeklyScores = $monthlyGrade->weekly_scores ?? [];
                $weeklyScores[$weekKey] = [
                    'oral' => isset($gradeData['oral']) && $gradeData['oral'] !== '' ? (float)$gradeData['oral'] : null,
                    'homework' => isset($gradeData['homework']) && $gradeData['homework'] !== '' ? (float)$gradeData['homework'] : null,
                    'note' => $gradeData['note'] ?? null,
                ];

                $monthlyGrade->update(['weekly_scores' => $weeklyScores]);
            }
            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم حفظ درجات الأسبوع بنجاح ✅'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء الحفظ: ' . $e->getMessage()], 500);
        }
    }

    public function submitFinalMonthlyGrades(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'subject_id' => 'required|exists:subjects,id',
            'period_id' => 'required|exists:result_periods,id',
            'grades' => 'required|array',
            'grades.*.enrollment_id' => 'required|exists:enrollments,id',
            'grades.*.behavior' => 'required|numeric|min:0',
            'grades.*.monthly_exam' => 'required|numeric|min:0',
            'grades.*.note' => 'nullable|string|max:500',
        ]);

        $period = \App\Models\ResultPeriod::findOrFail($request->period_id);
        $subjectId = $request->subject_id;

        // Check if period is open
        $today = now()->format('Y-m-d');
        if ($period->fill_start_date && $period->fill_end_date) {
            $startDate = $period->fill_start_date->format('Y-m-d');
            $endDate = $period->fill_end_date->format('Y-m-d');
            if ($today < $startDate || $today > $endDate) {
                return response()->json(['success' => false, 'message' => 'فترة رصد الدرجات مغلقة حالياً'], 422);
            }
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($request->grades as $gradeData) {
                $monthlyGrade = \App\Models\MonthlyGrade::firstOrCreate(
                    [
                        'enrollment_id' => $gradeData['enrollment_id'],
                        'period_id' => $period->id,
                        'subject_id' => $subjectId,
                    ],
                    [
                        'semester_id' => $period->semester_id,
                    ]
                );

                if ($monthlyGrade->is_submitted) {
                    continue;
                }

                $behavior = (float)$gradeData['behavior'];
                $exam = (float)$gradeData['monthly_exam'];

                $finalScores = $monthlyGrade->buildFinalScores($behavior, $exam);
                if (!empty($gradeData['note'])) {
                    $finalScores['note'] = $gradeData['note'];
                }

                $monthlyGrade->update([
                    'scores' => $finalScores,
                    'is_submitted' => true,
                    'submitted_at' => now(),
                    'submitted_by' => $request->user()->id,
                ]);
            }
            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم اعتماد ورفع درجات الشهر وقفل الرصد بنجاح 🔒✅'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء الرفع: ' . $e->getMessage()], 500);
        }
    }

    public function storeMonthlyGrades(Request $request)
    {
        // Alias for backward compatibility
        return $this->submitFinalMonthlyGrades($request);
    }

    // ── Teacher Exam Invigilation Schedules ──

    public function getTeacherExamSchedules(Request $request)
    {
        $user = $request->user();
        $empId = $user->employee?->id;
        $todayStr = now()->format('Y-m-d');

        $baseQuery = \App\Models\ExamScheduleItem::with([
            'schedule.period.semester.academicYear',
            'division.grade',
            'subject',
            'proctors'
        ])
        ->whereHas('proctors', function($q) use ($user, $empId) {
            $q->where('users.id', $user->id);
            if ($empId) $q->orWhere('users.id', $empId);
        });

        // Compute summary counts across all assigned tasks
        $allTasks = (clone $baseQuery)->get();
        $summary = [
            'total_tasks' => $allTasks->count(),
            'today_tasks' => $allTasks->filter(fn($i) => ($i->exam_date ? $i->exam_date->format('Y-m-d') : '') === $todayStr)->count(),
            'upcoming_tasks' => $allTasks->filter(fn($i) => ($i->exam_date ? $i->exam_date->format('Y-m-d') : '') > $todayStr)->count(),
            'past_tasks' => $allTasks->filter(fn($i) => ($i->exam_date ? $i->exam_date->format('Y-m-d') : '') < $todayStr)->count(),
        ];

        $query = (clone $baseQuery);

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'today') {
                $query->whereDate('exam_date', $todayStr);
            } elseif ($request->status === 'upcoming') {
                $query->whereDate('exam_date', '>', $todayStr);
            } elseif ($request->status === 'past') {
                $query->whereDate('exam_date', '<', $todayStr);
            }
        }

        if ($request->filled('period_id') && $request->period_id !== 'all') {
            $query->where('schedule_id', $request->period_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('room', 'like', "%{$search}%")
                  ->orWhere('syllabus', 'like', "%{$search}%")
                  ->orWhere('exam_date', 'like', "%{$search}%")
                  ->orWhereHas('subject', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('division', function($dq) use ($search) {
                      $dq->where('name', 'like', "%{$search}%")
                         ->orWhereHas('grade', fn($gq) => $gq->where('name', 'like', "%{$search}%"));
                  });
            });
        }

        $items = $query->orderBy('exam_date')->orderBy('start_time')->get();

        // Map Arabic day names
        $dayNames = [
            'Sunday' => 'الأحد',
            'Monday' => 'الإثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
            'Saturday' => 'السبت',
        ];

        $formattedItems = $items->map(function($item) use ($todayStr, $user, $dayNames) {
            $dateStr = $item->exam_date ? $item->exam_date->format('Y-m-d') : '';
            $dayEnglish = $item->exam_date ? $item->exam_date->format('l') : '';
            $dayArabic = $dayNames[$dayEnglish] ?? $dayEnglish;

            $startTime = $item->start_time ? substr($item->start_time, 0, 5) : '';
            $endTime = $item->end_time ? substr($item->end_time, 0, 5) : '';

            $durationMinutes = 0;
            if ($startTime && $endTime) {
                try {
                    $start = \Carbon\Carbon::parse($startTime);
                    $end = \Carbon\Carbon::parse($endTime);
                    $durationMinutes = $start->diffInMinutes($end);
                } catch (\Exception $e) {}
            }

            $colleagues = $item->proctors
                ->filter(fn($p) => $p->id !== $user->id)
                ->map(fn($p) => ['id' => $p->id, 'name' => $p->name])
                ->values();

            $allProctors = $item->proctors
                ->map(fn($p) => ['id' => $p->id, 'name' => $p->name])
                ->values();

            return [
                'id' => $item->id,
                'schedule_id' => $item->schedule_id,
                'schedule_title' => $item->schedule?->period?->month_name ?? $item->schedule?->title ?? 'فترة اختبارات',
                'academic_year' => $item->schedule?->period?->semester?->academicYear?->name ?? null,
                'semester' => $item->schedule?->period?->semester?->name ?? null,
                'exam_date' => $dateStr,
                'day_name' => $dayArabic,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'duration_minutes' => $durationMinutes,
                'subject_id' => $item->subject_id,
                'subject_name' => $item->subject?->name ?? 'مادة غير محددة',
                'grade_id' => $item->division?->grade_id,
                'grade_name' => $item->division?->grade?->name ?? '-',
                'division_id' => $item->division_id,
                'division_name' => $item->division?->name ?? '-',
                'room' => $item->room ?: 'قاعة الاختبار العامة',
                'syllabus' => $item->syllabus,
                'is_today' => $dateStr === $todayStr,
                'is_upcoming' => $dateStr > $todayStr,
                'is_past' => $dateStr < $todayStr,
                'colleagues' => $colleagues,
                'all_proctors' => $allProctors,
                'proctors_count' => $item->proctors->count(),
            ];
        });

        // Get available periods for filter
        $periods = \App\Models\ExamSchedule::with('period')
            ->whereHas('items.proctors', function($q) use ($user, $empId) {
                $q->where('users.id', $user->id);
                if ($empId) $q->orWhere('users.id', $empId);
            })
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'title' => $s->period?->month_name ?? $s->title ?? "جدول {$s->id}",
            ]);

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'periods' => $periods,
            'data' => $formattedItems
        ]);
    }

    // ── Teacher Class Coverages ──

    public function getTeacherCoverages(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;
        $empId = $user->employee?->id;

        $coverages = \App\Models\ClassCoverage::with([
            'absentTeacher:id,name',
            'substituteTeacher:id,name',
            'period:id,period_name,start_time,end_time',
            'division.grade',
            'subject:id,name',
        ])
        ->where(function($q) use ($user, $empId) {
            $q->where('substitute_teacher_id', $user->id)
              ->orWhere('absent_teacher_id', $user->id);
            if ($empId) {
                $q->orWhere('substitute_teacher_id', $empId)
                  ->orWhere('absent_teacher_id', $empId);
            }
        })
        ->latest('coverage_date')
        ->paginate(15);

        if ($coverages->isEmpty()) {
            $coverages = \App\Models\ClassCoverage::with([
                'absentTeacher:id,name',
                'substituteTeacher:id,name',
                'period:id,period_name,start_time,end_time',
                'division.grade',
                'subject:id,name',
            ])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->latest('coverage_date')
            ->paginate(15);
        }

        return response()->json([
            'success' => true,
            'data' => $coverages
        ]);
    }

    // ── Classroom Visits Management (Supervisor & Academic) ──

    public function getClassroomVisits(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $canView = $user->hasPermission('عرض الزيارات الصفية') || $user->hasPermission('إدارة النظام') || $user->is_super_admin;
        if (!$canView) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك بعرض الزيارات الصفية'], 403);
        }

        $baseQuery = \App\Models\ClassroomVisit::with(['teacher:id,name', 'supervisor:id,name', 'grade:id,name', 'division:id,name'])
            ->whereHas('grade', function ($q) use ($branchId) {
                if ($branchId) {
                    $q->where('branch_id', $branchId);
                }
            });

        // Compute KPIs summary before filters
        $allVisits = (clone $baseQuery)->get();
        $totalCount = $allVisits->count();
        $approvedCount = $allVisits->where('is_approved', true)->count();
        $pendingSignCount = $allVisits->whereNull('teacher_signature')->count();
        $pendingApproveCount = $allVisits->filter(fn($v) => !empty($v->teacher_signature) && !$v->is_approved)->count();
        $avgScore = $approvedCount > 0 ? round($allVisits->where('is_approved', true)->avg('score'), 1) : 0;

        $summary = [
            'total' => $totalCount,
            'approved' => $approvedCount,
            'pending_teacher_sign' => $pendingSignCount,
            'pending_approval' => $pendingApproveCount,
            'avg_score' => $avgScore,
        ];

        $query = clone $baseQuery;

        // Filters
        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }
        if ($request->filled('supervisor_id')) {
            $query->where('supervisor_id', $request->supervisor_id);
        }
        if ($request->filled('grade_id')) {
            $query->where('grade_id', $request->grade_id);
        }
        if ($request->filled('division_id')) {
            $query->where('division_id', $request->division_id);
        }
        if ($request->filled('visit_type')) {
            $query->where('visit_type', $request->visit_type);
        }
        if ($request->filled('status')) {
            if ($request->status === 'approved') {
                $query->where('is_approved', true);
            } elseif ($request->status === 'pending_sign') {
                $query->whereNull('teacher_signature');
            } elseif ($request->status === 'pending_approval') {
                $query->whereNotNull('teacher_signature')->where('is_approved', false);
            } elseif ($request->status === 'not_approved') {
                $query->where('is_approved', false);
            }
        }
        if ($request->filled('score_range')) {
            if ($request->score_range === 'excellent') {
                $query->where('score', '>=', 90);
            } elseif ($request->score_range === 'very_good') {
                $query->whereBetween('score', [80, 89.99]);
            } elseif ($request->score_range === 'good') {
                $query->whereBetween('score', [70, 79.99]);
            } elseif ($request->score_range === 'needs_followup') {
                $query->where('score', '<', 70);
            }
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->whereHas('teacher', fn($t) => $t->where('name', 'like', "%{$s}%"))
                  ->orWhereHas('supervisor', fn($sup) => $sup->where('name', 'like', "%{$s}%"))
                  ->orWhere('discussed_points', 'like', "%{$s}%")
                  ->orWhere('notes', 'like', "%{$s}%");
            });
        }
        if ($request->filled('date_from')) {
            $query->whereDate('visit_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('visit_date', '<=', $request->date_to);
        }

        $visits = $query->latest('visit_date')->paginate(15);

        $formatted = $visits->getCollection()->map(function($v) {
            return [
                'id' => $v->id,
                'teacher_id' => $v->teacher_id,
                'teacher_name' => $v->teacher?->name ?? 'معلم',
                'supervisor_id' => $v->supervisor_id,
                'supervisor_name' => $v->supervisor?->name ?? 'مشرف تربوي',
                'grade_id' => $v->grade_id,
                'grade_name' => $v->grade?->name ?? '',
                'division_id' => $v->division_id,
                'division_name' => $v->division?->name ?? '',
                'visit_date' => $v->visit_date ? (is_string($v->visit_date) ? substr($v->visit_date, 0, 10) : $v->visit_date->format('Y-m-d')) : '',
                'visit_type' => $v->visit_type ?? 'توجيهية',
                'score' => $v->score !== null ? (float)$v->score : null,
                'discussed_points' => $v->discussed_points ?? '',
                'notes' => $v->notes ?? '',
                'is_approved' => (bool)$v->is_approved,
                'has_supervisor_signature' => !empty($v->supervisor_signature),
                'supervisor_signature_url' => $v->supervisor_signature ? asset('storage/' . $v->supervisor_signature) : null,
                'has_teacher_signature' => !empty($v->teacher_signature),
                'teacher_signature_url' => $v->teacher_signature ? asset('storage/' . $v->teacher_signature) : null,
            ];
        });

        $permissions = [
            'can_create' => $user->hasPermission('إضافة زيارة صفية') || $user->hasPermission('إدارة النظام'),
            'can_edit' => $user->hasPermission('تعديل زيارة صفية') || $user->hasPermission('إدارة النظام'),
            'can_delete' => $user->hasPermission('حذف زيارة صفية') || $user->hasPermission('إدارة النظام'),
            'can_approve' => $user->hasPermission('اعتماد زيارة صفية') || $user->hasPermission('إدارة النظام'),
        ];

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'permissions' => $permissions,
            'data' => $formatted,
            'pagination' => [
                'current_page' => $visits->currentPage(),
                'last_page' => $visits->lastPage(),
                'total' => $visits->total(),
            ]
        ]);
    }

    public function getClassroomVisitsFormData(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $teachers = \App\Models\User::whereHas('role', fn($q) => $q->where('name', 'معلم'))
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get(['id', 'name']);

        $supervisors = \App\Models\User::whereHas('role', fn($q) => $q->whereIn('name', ['مشرف تربوي', 'مدير النظام', 'وكيل']))
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get(['id', 'name']);

        $grades = \App\Models\Grade::with(['divisions:id,grade_id,name'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get(['id', 'name']);

        $visitTypes = ['توجيهية', 'تقويمية', 'تشخيصية', 'استطلاعية', 'تبادل خبرات'];

        return response()->json([
            'success' => true,
            'data' => [
                'teachers' => $teachers,
                'supervisors' => $supervisors,
                'grades' => $grades,
                'visit_types' => $visitTypes,
            ]
        ]);
    }

    public function storeClassroomVisit(Request $request)
    {
        $user = $request->user();
        if (!$user->hasPermission('إضافة زيارة صفية') && !$user->hasPermission('إدارة النظام') && !$user->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك بإضافة زيارة صفية'], 403);
        }

        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'grade_id' => 'required|exists:grades,id',
            'division_id' => 'required|exists:divisions,id',
            'visit_date' => 'required|date',
            'visit_type' => 'required|string',
            'score' => 'nullable|numeric|min:0|max:100',
            'discussed_points' => 'nullable|string',
            'notes' => 'nullable|string',
            'supervisor_signature' => 'nullable|string',
        ]);

        $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();

        $visit = new \App\Models\ClassroomVisit($validated);
        $visit->supervisor_id = $user->id;
        $visit->academic_year_id = $activeYear?->id;
        $visit->score = $request->input('score', null);

        if ($request->filled('supervisor_signature') && \Illuminate\Support\Str::startsWith($request->supervisor_signature, 'data:image')) {
            $sigPath = $this->saveBase64Signature($request->supervisor_signature, 'visits_supervisor');
            $visit->supervisor_signature = $sigPath;
        }

        $visit->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الزيارة الصفية بنجاح ✅',
            'data' => $visit
        ]);
    }

    public function updateClassroomVisit(Request $request, \App\Models\ClassroomVisit $classroomVisit)
    {
        $user = $request->user();
        if (!$user->hasPermission('تعديل زيارة صفية') && !$user->hasPermission('إدارة النظام') && !$user->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك بتعديل الزيارة الصفية'], 403);
        }

        if ($classroomVisit->is_approved) {
            return response()->json(['success' => false, 'message' => 'لا يمكن تعديل زيارة معتمدة 🔒'], 422);
        }

        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'grade_id' => 'required|exists:grades,id',
            'division_id' => 'required|exists:divisions,id',
            'visit_date' => 'required|date',
            'visit_type' => 'required|string',
            'score' => 'nullable|numeric|min:0|max:100',
            'discussed_points' => 'nullable|string',
            'notes' => 'nullable|string',
            'supervisor_signature' => 'nullable|string',
        ]);

        $classroomVisit->fill($request->except('supervisor_signature'));

        if ($request->filled('supervisor_signature') && \Illuminate\Support\Str::startsWith($request->supervisor_signature, 'data:image')) {
            if ($classroomVisit->supervisor_signature) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($classroomVisit->supervisor_signature);
            }
            $sigPath = $this->saveBase64Signature($request->supervisor_signature, 'visits_supervisor');
            $classroomVisit->supervisor_signature = $sigPath;
        }

        $classroomVisit->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تعديل الزيارة الصفية بنجاح ✅',
            'data' => $classroomVisit
        ]);
    }

    public function destroyClassroomVisit(Request $request, \App\Models\ClassroomVisit $classroomVisit)
    {
        $user = $request->user();
        if (!$user->hasPermission('حذف زيارة صفية') && !$user->hasPermission('إدارة النظام') && !$user->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك بحذف الزيارة الصفية'], 403);
        }

        if ($classroomVisit->is_approved) {
            return response()->json(['success' => false, 'message' => 'لا يمكن حذف زيارة معتمدة 🔒'], 422);
        }

        if ($classroomVisit->supervisor_signature) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($classroomVisit->supervisor_signature);
        }
        if ($classroomVisit->teacher_signature) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($classroomVisit->teacher_signature);
        }

        $classroomVisit->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الزيارة الصفية بنجاح 🗑️'
        ]);
    }

    public function approveClassroomVisit(Request $request, \App\Models\ClassroomVisit $classroomVisit)
    {
        $user = $request->user();
        if (!$user->hasPermission('اعتماد زيارة صفية') && !$user->hasPermission('إدارة النظام') && !$user->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك باعتماد الزيارة الصفية'], 403);
        }

        $request->validate([
            'score' => 'required|numeric|min:0|max:100',
        ]);

        $classroomVisit->score = $request->score;
        $classroomVisit->is_approved = true;
        $classroomVisit->save();

        return response()->json([
            'success' => true,
            'message' => 'تم اعتماد الزيارة وتقييم المعلم بنجاح 🔒🌟',
            'data' => $classroomVisit
        ]);
    }

    // ── Teacher's Classroom Visits (My Visits) ──

    public function getMyClassroomVisits(Request $request)
    {
        $user = $request->user();

        $baseQuery = \App\Models\ClassroomVisit::with([
            'supervisor:id,name',
            'grade:id,name',
            'division:id,name'
        ])
        ->where('teacher_id', $user->id);

        $allMyVisits = (clone $baseQuery)->get();
        $totalCount = $allMyVisits->count();
        $approvedCount = $allMyVisits->where('is_approved', true)->count();
        $pendingSignCount = $allMyVisits->whereNull('teacher_signature')->count();
        $avgScore = $approvedCount > 0 ? round($allMyVisits->where('is_approved', true)->avg('score'), 1) : 0;

        $summary = [
            'total' => $totalCount,
            'approved' => $approvedCount,
            'pending_sign' => $pendingSignCount,
            'avg_score' => $avgScore,
        ];

        $query = clone $baseQuery;

        // Filters for Teacher Screen
        if ($request->filled('visit_type')) {
            $query->where('visit_type', $request->visit_type);
        }
        if ($request->filled('status')) {
            if ($request->status === 'approved') {
                $query->where('is_approved', true);
            } elseif ($request->status === 'pending_sign') {
                $query->whereNull('teacher_signature');
            } elseif ($request->status === 'signed') {
                $query->whereNotNull('teacher_signature');
            }
        }
        if ($request->filled('grade_id')) {
            $query->where('grade_id', $request->grade_id);
        }
        if ($request->filled('division_id')) {
            $query->where('division_id', $request->division_id);
        }
        if ($request->filled('supervisor_id')) {
            $query->where('supervisor_id', $request->supervisor_id);
        }
        if ($request->filled('score_range')) {
            if ($request->score_range === 'excellent') {
                $query->where('score', '>=', 90);
            } elseif ($request->score_range === 'very_good') {
                $query->whereBetween('score', [80, 89.99]);
            } elseif ($request->score_range === 'good') {
                $query->whereBetween('score', [70, 79.99]);
            } elseif ($request->score_range === 'needs_followup') {
                $query->where('score', '<', 70);
            }
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->whereHas('supervisor', fn($sup) => $sup->where('name', 'like', "%{$s}%"))
                  ->orWhere('discussed_points', 'like', "%{$s}%")
                  ->orWhere('notes', 'like', "%{$s}%");
            });
        }
        if ($request->filled('date_from')) {
            $query->whereDate('visit_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('visit_date', '<=', $request->date_to);
        }

        $visits = $query->latest('visit_date')->paginate(15);

        $formatted = $visits->getCollection()->map(function($v) {
            return [
                'id' => $v->id,
                'supervisor_name' => $v->supervisor?->name ?? 'مشرف تربوي',
                'grade_name' => $v->grade?->name ?? '',
                'division_name' => $v->division?->name ?? '',
                'visit_date' => $v->visit_date ? (is_string($v->visit_date) ? substr($v->visit_date, 0, 10) : $v->visit_date->format('Y-m-d')) : '',
                'visit_type' => $v->visit_type ?? 'توجيهية',
                'score' => $v->score !== null ? (float)$v->score : null,
                'discussed_points' => $v->discussed_points ?? '',
                'notes' => $v->notes ?? '',
                'is_approved' => (bool)$v->is_approved,
                'has_supervisor_signature' => !empty($v->supervisor_signature),
                'supervisor_signature_url' => $v->supervisor_signature ? asset('storage/' . $v->supervisor_signature) : null,
                'has_teacher_signature' => !empty($v->teacher_signature),
                'teacher_signature_url' => $v->teacher_signature ? asset('storage/' . $v->teacher_signature) : null,
            ];
        });

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'data' => $formatted,
            'pagination' => [
                'current_page' => $visits->currentPage(),
                'last_page' => $visits->lastPage(),
                'total' => $visits->total(),
            ]
        ]);
    }

    public function signClassroomVisit(Request $request, \App\Models\ClassroomVisit $classroomVisit)
    {
        $user = $request->user();
        if ($classroomVisit->teacher_id !== $user->id && !$user->hasPermission('إدارة النظام') && !$user->is_super_admin) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك بتوقيع هذه الزيارة'], 403);
        }

        if ($classroomVisit->is_approved) {
            return response()->json(['success' => false, 'message' => 'الزيارة معتمدة مسبقاً ولا يمكن تعديل التوقيع 🔒'], 422);
        }

        $request->validate([
            'teacher_signature' => 'nullable|string',
            'notes' => 'nullable|string|max:500',
        ]);

        $signaturePath = $classroomVisit->teacher_signature;
        if ($request->filled('teacher_signature') && \Illuminate\Support\Str::startsWith($request->teacher_signature, 'data:image')) {
            if ($classroomVisit->teacher_signature) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($classroomVisit->teacher_signature);
            }
            $signaturePath = $this->saveBase64Signature($request->teacher_signature, 'visits_teacher');
        }

        $classroomVisit->teacher_signature = $signaturePath;
        $classroomVisit->save();

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ توقيع المعلم وتأكيد استلام تقرير الزيارة بنجاح ✍️✅',
            'data' => $classroomVisit
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

    // ── Academic Daily Student Attendance (Matching academic/attendances) ──

    public function getDailyAttendancesList(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;
        $date = $request->filled('date') ? $request->date : today()->toDateString();

        $query = \App\Models\User::with([
            'student.currentEnrollment.division.grade',
            'attendanceLogs' => function($q) use ($date) {
                $q->whereDate('attendance_date', $date);
            }
        ])
        ->whereHas('role', fn($q) => $q->where('name', 'طالب'))
        ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        if ($request->filled('division_id')) {
            $query->whereHas('student.currentEnrollment', function($q) use ($request) {
                $q->where('division_id', $request->division_id);
            });
        } elseif ($request->filled('grade_id')) {
            $query->whereHas('student.currentEnrollment.division', function($q) use ($request) {
                $q->where('grade_id', $request->grade_id);
            });
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('name', 'like', "%{$s}%");
        }

        // Summary Stats (Total, Present, Absent, Late, Excused)
        $allMatchingUsers = (clone $query)->get();
        $totalStudentsCount = $allMatchingUsers->count();
        $presentCount = 0;
        $absentCount = 0;
        $lateCount = 0;
        $excusedCount = 0;

        foreach ($allMatchingUsers as $u) {
            $log = $u->attendanceLogs->first();
            $status = $log ? $log->status : 'absent';
            if ($status === 'present' || $status === 'حاضر') $presentCount++;
            elseif ($status === 'absent' || $status === 'غائب') $absentCount++;
            elseif ($status === 'late' || $status === 'متأخر') $lateCount++;
            elseif ($status === 'excused') $excusedCount++;
            else $absentCount++;
        }

        // Status filter
        if ($request->filled('status')) {
            $filterStatus = $request->status;
            if ($filterStatus === 'absent' || $filterStatus === 'غائب') {
                $query->where(function($q) use ($date) {
                    $q->whereDoesntHave('attendanceLogs', fn($sub) => $sub->whereDate('attendance_date', $date))
                      ->orWhereHas('attendanceLogs', fn($sub) => $sub->whereDate('attendance_date', $date)->whereIn('status', ['absent', 'غائب']));
                });
            } else {
                $query->whereHas('attendanceLogs', function($q) use ($date, $filterStatus) {
                    $q->whereDate('attendance_date', $date)->where('status', $filterStatus);
                });
            }
        }

        $users = $query->paginate(20);

        $mappedData = $users->getCollection()->map(function($u) use ($date) {
            $log = $u->attendanceLogs->first();
            $division = $u->student?->currentEnrollment?->division;
            $gradeName = $division?->grade?->name ?? '';
            $divName = $division?->name ?? '';

            $status = $log ? $log->status : 'absent';

            return [
                'id' => $u->id,
                'student_id' => $u->id,
                'name' => $u->name,
                'avatar' => $u->avatar ? asset('storage/' . $u->avatar) : null,
                'grade_name' => $gradeName,
                'division_name' => $divName,
                'class_display' => $gradeName ? "$gradeName - $divName" : $divName,
                'attendance_date' => $date,
                'status' => $status,
            ];
        });

        $summary = [
            'total' => $totalStudentsCount,
            'present' => $presentCount,
            'absent' => $absentCount,
            'late' => $lateCount,
            'excused' => $excusedCount,
        ];

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'data' => $mappedData,
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ]
        ]);
    }

    public function getDailyAttendanceFormData(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $grades = \App\Models\Grade::with(['divisions:id,grade_id,name'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'grades' => $grades,
            ]
        ]);
    }

    public function getDailyAttendanceStudents(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'date' => 'nullable|date',
        ]);

        $date = $request->input('date', today()->toDateString());
        $divisionId = $request->division_id;

        $enrollments = \App\Models\Enrollment::with('student.user')
            ->where('division_id', $divisionId)
            ->get();

        $dailyAttendances = \App\Models\AttendanceLog::whereIn('user_id', $enrollments->pluck('student.user_id')->filter())
            ->whereDate('attendance_date', $date)
            ->get()
            ->keyBy('user_id');

        $studentsList = $enrollments->map(function ($enrollment) use ($dailyAttendances) {
            $studentUser = $enrollment->student?->user;
            if (!$studentUser) return null;

            $userId = $studentUser->id;
            $dailyRecord = $dailyAttendances->get($userId);

            return [
                'student_id' => $userId,
                'name' => $studentUser->name,
                'avatar' => $studentUser->avatar ? asset('storage/' . $studentUser->avatar) : null,
                'status' => $dailyRecord ? $dailyRecord->status : 'present',
                'is_saved' => $dailyRecord !== null,
            ];
        })->filter()->values();

        return response()->json([
            'success' => true,
            'date' => $date,
            'data' => $studentsList
        ]);
    }

    public function saveDailyAttendance(Request $request)
    {
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.status' => 'required|in:present,absent,late,excused',
        ]);

        foreach ($request->attendances as $attendance) {
            \App\Models\AttendanceLog::updateOrCreate(
                [
                    'user_id' => $attendance['student_id'],
                    'attendance_date' => $request->date,
                ],
                [
                    'status' => $attendance['status'],
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ واعتماد الغياب المدرسي اليومي بنجاح ✅'
        ]);
    }

    // ── Teacher Digital Library (View, Filter, Bookmark, and Upload) ──

    public function getTeacherLibraryItems(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $baseQuery = \App\Models\LibraryItem::with(['subject', 'grade', 'uploader', 'bookmarks', 'ratings']);

        // Overall stats
        $allAccessible = (clone $baseQuery)->get();
        $summary = [
            'total' => $allAccessible->count(),
            'books' => $allAccessible->whereIn('item_type', ['pdf', 'books'])->count(),
            'worksheets' => $allAccessible->whereIn('item_type', ['worksheets', 'doc', 'docx'])->count(),
            'exams' => $allAccessible->whereIn('item_type', ['exams', 'exam'])->count(),
            'videos' => $allAccessible->whereIn('item_type', ['video', 'videos'])->count(),
            'my_uploads' => $allAccessible->where('uploader_id', $user->id)->count(),
            'bookmarked' => $allAccessible->filter(fn($i) => $i->bookmarks->contains($user->id))->count(),
        ];

        $query = clone $baseQuery;

        // Filter: Only my uploads
        if ($request->boolean('only_my_items') || $request->input('scope') === 'my') {
            $query->where('uploader_id', $user->id);
        }

        // Filter: Only bookmarked
        if ($request->boolean('only_bookmarked') || $request->input('scope') === 'bookmarked') {
            $query->whereHas('bookmarks', function($bq) use ($user) {
                $bq->where('user_id', $user->id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhereHas('subject', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('grade', fn($gq) => $gq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('uploader', fn($uq) => $uq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('subject_id') && $request->subject_id !== 'all') {
            $query->where('subject_id', $request->input('subject_id'));
        }

        if ($request->filled('grade_id') && $request->grade_id !== 'all') {
            $query->where('grade_id', $request->input('grade_id'));
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('item_type') && $request->item_type !== 'all') {
            $query->where('item_type', $request->input('item_type'));
        }

        $items = $query->orderBy('created_at', 'desc')->get()->map(function ($item) use ($user) {
            $isBookmarked = $item->bookmarks->contains($user->id);
            $userRating = $item->ratings->firstWhere('id', $user->id)?->pivot?->rating ?? 0;

            return [
                'id' => $item->id,
                'title' => $item->title,
                'category' => $item->category ?? 'عام',
                'item_type' => $item->item_type ?? 'pdf',
                'target_audience' => $item->target_audience ?? 'all',
                'file_url' => $item->file_url,
                'thumbnail_url' => $item->thumbnail_url,
                'subject_id' => $item->subject_id,
                'subject_name' => $item->subject?->name ?? 'عام',
                'grade_id' => $item->grade_id,
                'grade_name' => $item->grade?->name ?? 'جميع الصفوف',
                'uploader_id' => $item->uploader_id,
                'uploader_name' => $item->uploader?->name ?? 'المدرسة',
                'is_my_upload' => ($item->uploader_id === $user->id),
                'views_count' => (int)$item->views_count,
                'downloads_count' => (int)$item->downloads_count,
                'created_at_formatted' => $item->created_at ? $item->created_at->format('Y-m-d') : '',
                'average_rating' => (float)$item->average_rating,
                'is_bookmarked' => $isBookmarked,
                'user_rating' => $userRating,
            ];
        });

        // Available Grades and Subjects for filtering & uploading
        $grades = \App\Models\Grade::orderBy('id')->get(['id', 'name']);
        $subjects = \App\Models\Subject::orderBy('name')->get(['id', 'name']);

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'grades' => $grades,
            'subjects' => $subjects,
            'data' => $items
        ]);
    }

    public function storeLibraryItem(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check permission: 'إضافة للمكتبة الرقمية' or 'إدارة المكتبة الرقمية' or role 'معلم'
        if (!$user->hasPermission('إضافة للمكتبة الرقمية') && !$user->hasPermission('إدارة المكتبة الرقمية') && !$user->hasPermission('إدارة النظام') && $user->role?->name !== 'معلم') {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك بإضافة أو نشر موارد في المكتبة الرقمية.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'subject_id' => 'required|exists:subjects,id',
            'file' => 'required_without:external_url|nullable|file|max:20480', // 20MB max
            'external_url' => 'required_without:file|nullable|url|max:1000',
            'item_type' => 'required|string',
            'category' => 'nullable|string',
            'target_audience' => 'nullable|string|in:all,students,teachers',
            'thumbnail' => 'nullable|image|max:5120', // 5MB max
        ]);

        $path = null;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('library_items', 'public');
        }
        
        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('library_thumbnails', 'public');
        }

        $item = \App\Models\LibraryItem::create([
            'title' => $request->title,
            'grade_id' => $request->grade_id,
            'subject_id' => $request->subject_id,
            'item_type' => $request->item_type,
            'category' => $request->category ?? 'كتب ومناهج',
            'target_audience' => $request->target_audience ?? 'all',
            'uploader_id' => $user->id,
            'file_path' => $path,
            'external_url' => $request->external_url,
            'thumbnail_path' => $thumbnailPath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة المورد التعليمي للمكتبة بنجاح ✓',
            'data' => [
                'id' => $item->id,
                'title' => $item->title,
                'file_url' => $item->file_url,
            ]
        ]);
    }

    public function toggleLibraryBookmark(Request $request, $id)
    {
        $user = $request->user();
        $item = \App\Models\LibraryItem::findOrFail($id);

        $exists = \Illuminate\Support\Facades\DB::table('library_bookmarks')
            ->where('library_item_id', $item->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            \Illuminate\Support\Facades\DB::table('library_bookmarks')
                ->where('library_item_id', $item->id)
                ->where('user_id', $user->id)
                ->delete();
            $bookmarked = false;
            $msg = 'تمت إزالة المورد من المحفوظات';
        } else {
            \Illuminate\Support\Facades\DB::table('library_bookmarks')->insert([
                'library_item_id' => $item->id,
                'user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $bookmarked = true;
            $msg = 'تم حفظ المورد في المفضلة ✓';
        }

        return response()->json([
            'success' => true,
            'bookmarked' => $bookmarked,
            'message' => $msg
        ]);
    }

    /**
     * Get Leave Balances for Employee
     */
    public function getLeaveBalances(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'المستخدم ليس موظفاً'], 403);
        }

        $activeYear = \App\Models\AcademicYear::currentForBranch($request->user()->branch_id) 
            ?? \App\Models\AcademicYear::where('is_active', true)->first();

        $balances = \App\Models\LeaveBalance::with('leaveType')
            ->where('employee_id', $employee->id)
            ->when($activeYear, fn($q) => $q->where('academic_year_id', $activeYear->id))
            ->get()
            ->map(function ($b) {
                $used = $b->used_days;
                $remaining = max(0, $b->total_days - $used);
                return [
                    'id' => $b->id,
                    'leave_type_id' => $b->leave_type_id,
                    'leave_type_name' => $b->leaveType ? $b->leaveType->name : 'إجازة',
                    'total_days' => $b->total_days,
                    'used_days' => $used,
                    'remaining_days' => $remaining,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $balances,
            'academic_year' => $activeYear ? $activeYear->name : null,
        ]);
    }

    /**
     * Sign Employee Violation / Infraction
     */
    public function signInfraction(Request $request, $id)
    {
        $user = $request->user();
        $empId = $user->employee?->id;
        
        $violation = \App\Models\EmployeeViolation::where(function($q) use ($user, $empId) {
            $q->where('user_id', $user->id);
            if ($empId) $q->orWhere('user_id', $empId);
        })->findOrFail($id);
        
        $request->validate([
            'employee_signature' => 'nullable|string',
        ]);

        if ($request->filled('employee_signature') && \Illuminate\Support\Str::startsWith($request->employee_signature, 'data:image')) {
            $base64String = $request->employee_signature;
            if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
                $base64String = substr($base64String, strpos($base64String, ',') + 1);
                $type = strtolower($type[1]);
                $fileName = 'violations/signatures/employee_' . uniqid() . '.' . $type;
                \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, base64_decode($base64String));
                $violation->employee_signature = $fileName;
            }
        } else {
            $violation->employee_signature = 'signed_electronically_at_' . now()->toIso8601String();
        }

        $violation->save();

        return response()->json([
            'success' => true,
            'message' => 'تم التوقيع بالعلم على المخالفة بنجاح',
            'data' => $violation
        ]);
    }

    /**
     * Sign / Acknowledge Employee Achievement
     */
    public function signAchievement(Request $request, $id)
    {
        $user = $request->user();
        $empId = $user->employee?->id;
        
        $achievement = \App\Models\EmployeeAchievement::where(function($q) use ($user, $empId) {
            $q->where('user_id', $user->id);
            if ($empId) $q->orWhere('user_id', $empId);
        })->findOrFail($id);
        
        $request->validate([
            'employee_signature' => 'nullable|string',
        ]);

        if ($request->filled('employee_signature') && \Illuminate\Support\Str::startsWith($request->employee_signature, 'data:image')) {
            $base64String = $request->employee_signature;
            if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
                $base64String = substr($base64String, strpos($base64String, ',') + 1);
                $type = strtolower($type[1]);
                $fileName = 'achievements/signatures/employee_' . uniqid() . '.' . $type;
                \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, base64_decode($base64String));
                $achievement->employee_signature = $fileName;
            }
        } else {
            $achievement->employee_signature = 'received_electronically_at_' . now()->toIso8601String();
        }

        $achievement->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تأكيد استلام شهادة الشكر والإنجاز بنجاح',
            'data' => $achievement
        ]);
    }

    /**
     * Get Employee Appraisals with filters, stats and grade calculations
     */
     public function getAppraisals(Request $request)
     {
         $user = $request->user();
         $employee = $user->employee;
         if (!$employee) {
             return response()->json(['success' => false, 'message' => 'المستخدم ليس موظفاً'], 403);
         }
 
         $query = \App\Models\EmployeeAppraisal::with(['cycle', 'template.kpis', 'manager.user'])
             ->where('employee_id', $employee->id);
 
         if ($request->filled('cycle_id')) {
             $query->where('cycle_id', $request->cycle_id);
         }
 
         if ($request->filled('status')) {
             $query->where('status', $request->status);
         }
 
         if ($request->filled('grade')) {
             $grade = $request->grade;
             if ($grade === 'excellent') {
                 $query->where('final_score', '>=', 90);
             } elseif ($grade === 'vgood') {
                 $query->where('final_score', '>=', 80)->where('final_score', '<', 90);
             } elseif ($grade === 'good') {
                 $query->where('final_score', '>=', 70)->where('final_score', '<', 80);
             } elseif ($grade === 'acceptable') {
                 $query->where('final_score', '>=', 60)->where('final_score', '<', 70);
             } elseif ($grade === 'needs_improvement') {
                 $query->where('final_score', '<', 60);
             }
         }
 
         if ($request->filled('search')) {
             $search = $request->search;
             $query->where(function($q) use ($search) {
                 $q->whereHas('cycle', fn($cq) => $cq->where('title', 'like', "%{$search}%"))
                   ->orWhereHas('template', fn($tq) => $tq->where('title', 'like', "%{$search}%"));
             });
         }
 
         $appraisals = $query->latest()->get();
 
         // Active cycles for filtering
         $activeCycles = \App\Models\AppraisalCycle::where('status', 'active')
             ->get(['id', 'title', 'start_date', 'end_date']);
 
         $completedCount = $appraisals->where('status', 'completed')->count();
         $pendingSelfCount = $appraisals->where('status', 'pending_self')->count();
         $pendingManagerCount = $appraisals->where('status', 'pending_manager')->count();
         $pendingHrCount = $appraisals->where('status', 'pending_hr')->count();
         $avgScore = $appraisals->whereNotNull('final_score')->avg('final_score');
 
         $formattedAppraisals = $appraisals->map(function($appraisal) {
             $score = $appraisal->final_score;
             $grade = null;
             if ($score !== null) {
                 if ($score >= 90) $grade = ['label' => 'ممتاز', 'code' => 'excellent', 'color' => '0xFF10B981'];
                 elseif ($score >= 80) $grade = ['label' => 'جيد جداً', 'code' => 'vgood', 'color' => '0xFF3B82F6'];
                 elseif ($score >= 70) $grade = ['label' => 'جيد', 'code' => 'good', 'color' => '0xFFF59E0B'];
                 elseif ($score >= 60) $grade = ['label' => 'مقبول', 'code' => 'acceptable', 'color' => '0xFFF97316'];
                 else $grade = ['label' => 'يحتاج تحسين', 'code' => 'needs_improvement', 'color' => '0xFFEF4444'];
             }
 
             $statusLabels = [
                 'pending_self' => 'بانتظار التقييم الذاتي',
                 'pending_manager' => 'بانتظار تقييم المدير',
                 'pending_hr' => 'بانتظار اعتماد الموارد البشرية',
                 'completed' => 'معتمد ومكتمل',
             ];
 
             return [
                 'id' => $appraisal->id,
                 'cycle_id' => $appraisal->cycle_id,
                 'cycle_title' => $appraisal->cycle?->title ?? 'دورة تقييم',
                 'cycle_start' => $appraisal->cycle?->start_date?->format('Y-m-d'),
                 'cycle_end' => $appraisal->cycle?->end_date?->format('Y-m-d'),
                 'template_title' => $appraisal->template?->title ?? 'عام',
                 'status' => $appraisal->status,
                 'status_label' => $statusLabels[$appraisal->status] ?? $appraisal->status,
                 'self_score' => $appraisal->self_score,
                 'manager_score' => $appraisal->manager_score,
                 'final_score' => $appraisal->final_score,
                 'grade' => $grade,
                 'manager_name' => $appraisal->manager?->user?->name ?? 'الإدارة',
                 'created_at' => $appraisal->created_at?->format('Y-m-d'),
             ];
         });
 
         return response()->json([
             'success' => true,
             'data' => $formattedAppraisals,
             'active_cycles' => $activeCycles,
             'stats' => [
                 'total' => $appraisals->count(),
                 'completed' => $completedCount,
                 'pending_self' => $pendingSelfCount,
                 'pending_manager' => $pendingManagerCount,
                 'pending_hr' => $pendingHrCount,
                 'avg_score' => $avgScore ? round($avgScore, 1) : null,
             ]
         ]);
     }
 
     /**
      * Get Appraisal Details with criteria, SMART goals, integration data, and signatures
      */
     public function getAppraisalDetails(Request $request, $id)
     {
         $user = $request->user();
         $employee = $user->employee;
         if (!$employee) {
             return response()->json(['success' => false, 'message' => 'المستخدم ليس موظفاً'], 403);
         }
 
         $appraisal = \App\Models\EmployeeAppraisal::with([
             'cycle', 
             'template.kpis', 
             'manager.user',
             'scores.kpi',
             'scores.goals',
             'employee.user',
             'employee.department',
             'employee.jobGrade',
             'hr'
         ])->findOrFail($id);
 
         $isEmployee = ($appraisal->employee_id === $employee->id);
         $isManager = ($appraisal->manager_id === $employee->id);
 
         if (!$isEmployee && !$isManager && !$user->hasPermission('عرض التقييمات الإدارية')) {
             return response()->json(['success' => false, 'message' => 'غير مصرح لك بعرض هذا التقييم'], 403);
         }
 
         // Fetch Integration Data (Attendance, Violations, Achievements) during cycle period
         $startDate = $appraisal->cycle?->start_date ?? now()->startOfYear();
         $endDate = $appraisal->cycle?->end_date ?? now()->endOfYear();
 
         $attendances = \App\Models\Attendance::where('employee_id', $appraisal->employee_id)
             ->whereBetween('date', [$startDate, $endDate])
             ->get();
         
         $presentCount = $attendances->whereIn('status', ['present', 'late', 'extra'])->count();
         $totalAttendanceDays = $attendances->whereNotIn('status', ['weekend', 'holiday', 'future'])->count();
         $attendanceRate = $totalAttendanceDays > 0 ? round(($presentCount / $totalAttendanceDays) * 100) : 100;
 
         $violationsCount = \App\Models\EmployeeViolation::where('user_id', $appraisal->employee?->user_id)
             ->whereBetween('violation_date', [$startDate, $endDate])
             ->count();
 
         $achievementsCount = \App\Models\EmployeeAchievement::where('user_id', $appraisal->employee?->user_id)
             ->whereBetween('achievement_date', [$startDate, $endDate])
             ->count();
 
         // Calculate Grade
         $score = $appraisal->final_score;
         $grade = null;
         if ($score !== null) {
             if ($score >= 90) $grade = ['label' => 'ممتاز', 'code' => 'excellent', 'color' => '0xFF10B981'];
             elseif ($score >= 80) $grade = ['label' => 'جيد جداً', 'code' => 'vgood', 'color' => '0xFF3B82F6'];
             elseif ($score >= 70) $grade = ['label' => 'جيد', 'code' => 'good', 'color' => '0xFFF59E0B'];
             elseif ($score >= 60) $grade = ['label' => 'مقبول', 'code' => 'acceptable', 'color' => '0xFFF97316'];
             else $grade = ['label' => 'يحتاج تحسين', 'code' => 'needs_improvement', 'color' => '0xFFEF4444'];
         }
 
         $statusLabels = [
             'pending_self' => 'بانتظار التقييم الذاتي',
             'pending_manager' => 'بانتظار تقييم المدير',
             'pending_hr' => 'بانتظار اعتماد الموارد البشرية',
             'completed' => 'معتمد ومكتمل',
         ];
 
         // Historical Trends
         $historical = \App\Models\EmployeeAppraisal::where('employee_id', $appraisal->employee_id)
             ->whereNotNull('final_score')
             ->with('cycle')
             ->orderBy('created_at', 'asc')
             ->get()
             ->map(fn($a) => [
                 'id' => $a->id,
                 'cycle_title' => $a->cycle?->title ?? 'دورة',
                 'final_score' => $a->final_score,
                 'date' => $a->created_at?->format('Y-m-d'),
             ]);
 
         return response()->json([
             'success' => true,
             'data' => [
                 'id' => $appraisal->id,
                 'status' => $appraisal->status,
                 'status_label' => $statusLabels[$appraisal->status] ?? $appraisal->status,
                 'self_score' => $appraisal->self_score,
                 'manager_score' => $appraisal->manager_score,
                 'final_score' => $appraisal->final_score,
                 'grade' => $grade,
                 'self_comments' => $appraisal->self_comments,
                 'manager_comments' => $appraisal->manager_comments,
                 'hr_comments' => $appraisal->hr_comments,
                 'employee_signature' => $appraisal->employee_signature ? asset('storage/' . $appraisal->employee_signature) : null,
                 'manager_signature' => $appraisal->manager_signature ? asset('storage/' . $appraisal->manager_signature) : null,
                 'hr_signature' => $appraisal->hr_signature ? asset('storage/' . $appraisal->hr_signature) : null,
                 'employee' => [
                     'id' => $appraisal->employee?->id,
                     'name' => $appraisal->employee?->user?->name,
                     'department' => $appraisal->employee?->department?->name,
                     'job_grade' => $appraisal->employee?->jobGrade?->name,
                 ],
                 'manager' => [
                     'id' => $appraisal->manager?->id,
                     'name' => $appraisal->manager?->user?->name ?? 'الإدارة',
                 ],
                 'cycle' => [
                     'id' => $appraisal->cycle?->id,
                     'title' => $appraisal->cycle?->title,
                     'start_date' => $appraisal->cycle?->start_date?->format('Y-m-d'),
                     'end_date' => $appraisal->cycle?->end_date?->format('Y-m-d'),
                     'requires_self_appraisal' => (bool)$appraisal->cycle?->requires_self_appraisal,
                 ],
                 'template' => [
                     'id' => $appraisal->template?->id,
                     'title' => $appraisal->template?->title,
                     'description' => $appraisal->template?->description,
                 ],
                 'scores' => $appraisal->scores->map(function($score) {
                     return [
                         'id' => $score->id,
                         'kpi_id' => $score->kpi_id,
                         'kpi_name' => $score->kpi?->name ?? 'معيار الأداء',
                         'kpi_description' => $score->kpi?->description,
                         'kpi_weight' => $score->kpi?->weight ?? 1,
                         'self_score' => $score->self_score,
                         'manager_score' => $score->manager_score,
                         'goals' => $score->goals->map(fn($g) => [
                             'id' => $g->id,
                             'title' => $g->title,
                             'description' => $g->description,
                             'progress' => (int)$g->progress,
                             'status' => $g->status,
                         ]),
                     ];
                 }),
                 'integration' => [
                     'attendance_rate' => $attendanceRate,
                     'present_days' => $presentCount,
                     'total_days' => $totalAttendanceDays,
                     'violations_count' => $violationsCount,
                     'achievements_count' => $achievementsCount,
                 ],
                 'trend_data' => $historical,
                 'permissions' => [
                     'is_employee' => $isEmployee,
                     'is_manager' => $isManager,
                     'can_submit_self' => $isEmployee && $appraisal->status === 'pending_self',
                     'can_submit_manager' => $isManager && $appraisal->status === 'pending_manager',
                     'can_manage_goals' => ($isEmployee || $isManager) && !in_array($appraisal->status, ['completed', 'pending_hr']),
                 ]
             ]
         ]);
     }
 
     /**
      * Submit Self Appraisal with digital signature and KPI ratings (1 to 5)
      */
     public function submitAppraisalSelf(Request $request, $id)
     {
         $employee = $request->user()->employee;
         if (!$employee) {
             return response()->json(['success' => false, 'message' => 'المستخدم ليس موظفاً'], 403);
         }
 
         $appraisal = \App\Models\EmployeeAppraisal::where('employee_id', $employee->id)->findOrFail($id);
         
         if ($appraisal->status !== 'pending_self') {
             return response()->json(['success' => false, 'message' => 'التقييم ليس في مرحلة التقييم الذاتي'], 422);
         }
 
         $validated = $request->validate([
             'scores' => 'required|array',
             'scores.*.id' => 'required|exists:employee_appraisal_scores,id',
             'scores.*.self_score' => 'required|numeric|min:1|max:5',
             'self_comments' => 'nullable|string',
             'employee_signature' => 'nullable|string',
         ]);
 
         $totalScore = 0;
         $totalWeight = 0;
 
         foreach ($validated['scores'] as $scoreData) {
             $score = $appraisal->scores()->find($scoreData['id']);
             if ($score && $score->kpi) {
                 $score->update(['self_score' => $scoreData['self_score']]);
                 $weight = $score->kpi->weight ?? 1;
                 $totalScore += ($scoreData['self_score'] * $weight);
                 $totalWeight += $weight;
             }
         }
 
         $selfFinalScore = $totalWeight > 0 ? round(($totalScore / ($totalWeight * 5)) * 100, 1) : 0;
 
         $signaturePath = $appraisal->employee_signature;
         if (!empty($validated['employee_signature']) && str_starts_with($validated['employee_signature'], 'data:image')) {
             $sigData = explode(',', $validated['employee_signature'])[1];
             $filename = 'appraisals/signatures/emp_' . uniqid() . '.png';
             \Illuminate\Support\Facades\Storage::disk('public')->put($filename, base64_decode($sigData));
             $signaturePath = $filename;
         }
 
         $appraisal->update([
             'status' => 'pending_manager',
             'self_comments' => $validated['self_comments'] ?? null,
             'self_score' => $selfFinalScore,
             'employee_signature' => $signaturePath,
         ]);
 
         return response()->json([
             'success' => true,
             'message' => 'تم إرسال التقييم الذاتي بنجاح والانتقال لمرحلة تقييم المدير.',
             'data' => $appraisal
         ]);
     }
 
     /**
      * Submit Manager Evaluation from Mobile
      */
     public function submitAppraisalManager(Request $request, $id)
     {
         $user = $request->user();
         $employee = $user->employee;
         $appraisal = \App\Models\EmployeeAppraisal::findOrFail($id);
 
         if ($appraisal->manager_id !== ($employee?->id) && !$user->hasPermission('إدارة التقييمات الإدارية')) {
             return response()->json(['success' => false, 'message' => 'غير مصرح لك باعتماد التقييم كمدير'], 403);
         }
 
         $validated = $request->validate([
             'scores' => 'required|array',
             'scores.*.id' => 'required|exists:employee_appraisal_scores,id',
             'scores.*.manager_score' => 'required|numeric|min:1|max:5',
             'manager_comments' => 'nullable|string',
             'manager_signature' => 'nullable|string',
         ]);
 
         $totalScore = 0;
         $totalWeight = 0;
 
         foreach ($validated['scores'] as $scoreData) {
             $score = $appraisal->scores()->find($scoreData['id']);
             if ($score && $score->kpi) {
                 $score->update(['manager_score' => $scoreData['manager_score']]);
                 $weight = $score->kpi->weight ?? 1;
                 $totalScore += ($scoreData['manager_score'] * $weight);
                 $totalWeight += $weight;
             }
         }
 
         $managerFinalScore = $totalWeight > 0 ? round(($totalScore / ($totalWeight * 5)) * 100, 1) : 0;
 
         $signaturePath = $appraisal->manager_signature;
         if (!empty($validated['manager_signature']) && str_starts_with($validated['manager_signature'], 'data:image')) {
             $sigData = explode(',', $validated['manager_signature'])[1];
             $filename = 'appraisals/signatures/mgr_' . uniqid() . '.png';
             \Illuminate\Support\Facades\Storage::disk('public')->put($filename, base64_decode($sigData));
             $signaturePath = $filename;
         }
 
         $appraisal->update([
             'status' => 'pending_hr',
             'manager_comments' => $validated['manager_comments'] ?? null,
             'manager_score' => $managerFinalScore,
             'final_score' => $managerFinalScore,
             'manager_signature' => $signaturePath,
         ]);
 
         return response()->json([
             'success' => true,
             'message' => 'تم اعتماد تقييم المدير بنجاح وتحويله لاعتماد الموارد البشرية.',
             'data' => $appraisal
         ]);
     }
 
     /**
      * Store SMART Goal under Appraisal Score
      */
     public function storeAppraisalGoal(Request $request, $id, $scoreId)
     {
         $employee = $request->user()->employee;
         if (!$employee) {
             return response()->json(['success' => false, 'message' => 'المستخدم ليس موظفاً'], 403);
         }
 
         $appraisal = \App\Models\EmployeeAppraisal::where(function($q) use ($employee) {
             $q->where('employee_id', $employee->id)->orWhere('manager_id', $employee->id);
         })->findOrFail($id);
 
         $score = $appraisal->scores()->findOrFail($scoreId);
 
         $validated = $request->validate([
             'title' => 'required|string|max:255',
             'description' => 'nullable|string',
         ]);
 
         $goal = $score->goals()->create([
             'title' => $validated['title'],
             'description' => $validated['description'] ?? '',
             'progress' => 0,
             'status' => 'pending',
         ]);
 
         return response()->json([
             'success' => true,
             'message' => 'تمت إضافة الهدف الذكي بنجاح',
             'data' => $goal
         ]);
     }
 
     /**
      * Update Appraisal Goal Progress (KPI)
      */
     public function updateAppraisalGoalProgress(Request $request, $id, $goalId)
     {
         $employee = $request->user()->employee;
         if (!$employee) {
             return response()->json(['success' => false, 'message' => 'المستخدم ليس موظفاً'], 403);
         }
 
         $appraisal = \App\Models\EmployeeAppraisal::where(function($q) use ($employee) {
             $q->where('employee_id', $employee->id)->orWhere('manager_id', $employee->id);
         })->findOrFail($id);
 
         $goal = \App\Models\AppraisalGoal::whereHas('score', function($q) use ($appraisal) {
             $q->where('appraisal_id', $appraisal->id);
         })->findOrFail($goalId);
 
         $validated = $request->validate([
             'progress' => 'required|numeric|min:0|max:100',
         ]);
 
         $goal->progress = (int)$validated['progress'];
         if ($goal->progress >= 100) {
             $goal->status = 'completed';
         } else {
             $goal->status = 'in_progress';
         }
         $goal->save();
 
         return response()->json([
             'success' => true,
             'message' => 'تم تحديث نسبة إنجاز الهدف بنجاح',
             'data' => $goal
         ]);
     }
 
     /**
      * Destroy Appraisal Goal
      */
     public function destroyAppraisalGoal(Request $request, $id, $goalId)
     {
         $employee = $request->user()->employee;
         if (!$employee) {
             return response()->json(['success' => false, 'message' => 'المستخدم ليس موظفاً'], 403);
         }
 
         $appraisal = \App\Models\EmployeeAppraisal::where(function($q) use ($employee) {
             $q->where('employee_id', $employee->id)->orWhere('manager_id', $employee->id);
         })->findOrFail($id);
 
         $goal = \App\Models\AppraisalGoal::whereHas('score', function($q) use ($appraisal) {
             $q->where('appraisal_id', $appraisal->id);
         })->findOrFail($goalId);
 
         $goal->delete();
 
         return response()->json([
             'success' => true,
             'message' => 'تم حذف الهدف بنجاح'
         ]);
     }
 
     /**
      * Get Staff Meetings with Advanced Filters, Statistics, and Details
      */
    public function getMeetings(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $baseQuery = \App\Models\Meeting::with(['supervisor', 'participants.user.employee.jobGrade'])
            ->where(function($q) use ($user, $branchId) {
                $q->whereHas('participants', function($pq) use ($user) {
                    $pq->where('user_id', $user->id);
                })
                ->orWhere('supervisor_id', $user->id);
            })
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        // Stats across all meetings for this user
        $allUserMeetings = (clone $baseQuery)->get();
        $summary = [
            'total' => $allUserMeetings->count(),
            'scheduled' => $allUserMeetings->where('status', 'scheduled')->count(),
            'completed' => $allUserMeetings->where('status', 'completed')->count(),
            'cancelled' => $allUserMeetings->where('status', 'cancelled')->count(),
            'my_attended' => $allUserMeetings->filter(function($m) use ($user) {
                $p = $m->participants->firstWhere('user_id', $user->id);
                return $p && $p->attendance_status === 'attended';
            })->count(),
            'my_excused' => $allUserMeetings->filter(function($m) use ($user) {
                $p = $m->participants->firstWhere('user_id', $user->id);
                return $p && $p->attendance_status === 'excused';
            })->count(),
            'my_pending' => $allUserMeetings->filter(function($m) use ($user) {
                $p = $m->participants->firstWhere('user_id', $user->id);
                return $p && ($p->attendance_status === 'pending' || empty($p->attendance_status));
            })->count(),
        ];

        // Apply Filters
        $query = clone $baseQuery;

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('outcomes', 'like', "%{$search}%")
                  ->orWhere('recommendations', 'like', "%{$search}%")
                  ->orWhereHas('supervisor', function($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        $meetings = $query->latest('date')->latest('time')->get()->map(function ($m) use ($user) {
            $myParticipation = $m->participants->firstWhere('user_id', $user->id);
            $isSupervisor = ($user->id === $m->supervisor_id);

            // Format attachments
            $formattedAttachments = [];
            if (!empty($m->attachments) && is_array($m->attachments)) {
                foreach ($m->attachments as $att) {
                    if (is_array($att)) {
                        $formattedAttachments[] = [
                            'name' => $att['name'] ?? 'مرفق',
                            'path' => $att['path'] ?? '',
                            'url' => isset($att['path']) ? asset('storage/' . $att['path']) : null,
                            'size' => $att['size'] ?? '',
                        ];
                    } elseif (is_string($att)) {
                        $formattedAttachments[] = [
                            'name' => basename($att),
                            'path' => $att,
                            'url' => asset('storage/' . $att),
                            'size' => '',
                        ];
                    }
                }
            }

            // Format Participants list with roles and attendance status
            $participantsList = $m->participants->map(function ($p) {
                return [
                    'id' => $p->id,
                    'user_id' => $p->user_id,
                    'name' => $p->user?->name ?? 'مستخدم',
                    'job_title' => $p->user?->employee?->jobGrade?->name ?? 'موظف',
                    'attendance_status' => $p->attendance_status ?? 'pending',
                ];
            });

            $attendedCount = $m->participants->where('attendance_status', 'attended')->count();
            $excusedCount = $m->participants->where('attendance_status', 'excused')->count();
            $absentCount = $m->participants->where('attendance_status', 'absent')->count();
            $pendingCount = $m->participants->whereIn('attendance_status', ['pending', null, ''])->count();

            return [
                'id' => $m->id,
                'title' => $m->title,
                'date' => $m->date ? $m->date->format('Y-m-d') : null,
                'time' => $m->time ? (is_string($m->time) ? $m->time : $m->time->format('H:i')) : null,
                'type' => $m->type ?? 'in_person', // in_person, online
                'status' => $m->status ?? 'scheduled', // scheduled, completed, cancelled
                'supervisor_id' => $m->supervisor_id,
                'supervisor_name' => $m->supervisor ? $m->supervisor->name : 'الإدارة',
                'is_supervisor' => $isSupervisor,
                'agendas' => $m->agendas ?? [],
                'attachments' => $formattedAttachments,
                'outcomes' => $m->outcomes,
                'recommendations' => $m->recommendations,
                'my_attendance_status' => $myParticipation ? ($myParticipation->attendance_status ?? 'pending') : 'pending',
                'stats' => [
                    'total_participants' => $m->participants->count(),
                    'attended' => $attendedCount,
                    'excused' => $excusedCount,
                    'absent' => $absentCount,
                    'pending' => $pendingCount,
                ],
                'participants' => $participantsList,
                'created_at' => $m->created_at ? $m->created_at->toIso8601String() : null,
            ];
        });

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'data' => $meetings
        ]);
    }

    /**
     * Confirm / Update Meeting Attendance for current User
     */
    public function confirmMeetingAttendance(Request $request, $id)
    {
        $user = $request->user();
        $meeting = \App\Models\Meeting::findOrFail($id);

        $request->validate([
            'status' => 'required|in:attended,absent,excused,pending',
            'notes' => 'nullable|string',
        ]);

        $participant = \App\Models\MeetingParticipant::updateOrCreate(
            [
                'meeting_id' => $meeting->id,
                'user_id' => $user->id
            ],
            [
                'attendance_status' => $request->status,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => $request->status === 'attended' 
                ? 'تم تأكيد حضورك للاجتماع بنجاح ✓' 
                : ($request->status === 'excused' ? 'تم تسجيل طلب الاعتذار عن الحضور' : 'تم تحديث حالة الحضور'),
            'data' => [
                'id' => $participant->id,
                'meeting_id' => $meeting->id,
                'attendance_status' => $participant->attendance_status,
            ]
        ]);
    }

    /**
     * Complete Meeting and Record Outcomes / Recommendations from Mobile (Supervisor/Admin)
     */
    public function completeMeetingFromMobile(Request $request, $id)
    {
        $user = $request->user();
        $meeting = \App\Models\Meeting::findOrFail($id);

        $isSupervisor = ($user->id === $meeting->supervisor_id);
        $hasPermission = $user->hasPermission('تحضير الاجتماع') || $user->hasPermission('إدارة الاجتماعات');

        if (!$isSupervisor && !$hasPermission) {
            return response()->json(['success' => false, 'message' => 'غير مصرح لك بإنهاء هذا الاجتماع'], 403);
        }

        $validated = $request->validate([
            'outcomes' => 'required|string',
            'recommendations' => 'required|string',
        ]);

        $meeting->update([
            'outcomes' => $validated['outcomes'],
            'recommendations' => $validated['recommendations'],
            'status' => 'completed'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنهاء الاجتماع وتوثيق المخرجات والتوصيات بنجاح ✓',
            'data' => $meeting
        ]);
    }

    /**
     * Get Teacher Parent Summons
     */
    public function getTeacherParentSummons(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $summons = \App\Models\ParentSummon::with(['student.enrollments.division.grade', 'violation.violationType'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->latest('summon_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $summons
        ]);
    }

    /**
     * Store Teacher Parent Summon
     */
    public function storeTeacherParentSummon(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'summon_date' => 'required|date',
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string',
        ]);

        $summon = \App\Models\ParentSummon::create([
            'branch_id' => $user->branch_id,
            'student_id' => $request->student_id,
            'summon_date' => $request->summon_date,
            'reason' => $request->reason,
            'status' => 'pending',
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء استدعاء ولي الأمر بنجاح',
            'data' => $summon
        ]);
    }

    /**
     * Get Parent Visits Form Data & Dependencies
     */
    public function getParentVisitsFormData(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $students = \App\Models\Student::with(['user:id,name', 'enrollments.division.grade'])
            ->when($branchId, fn($q) => $q->whereHas('user', fn($uq) => $uq->where('branch_id', $branchId)))
            ->get()
            ->map(function($s) {
                $enrollment = $s->enrollments->first();
                $div = $enrollment && $enrollment->division ? $enrollment->division : null;
                $grade = $div && $div->grade ? $div->grade : null;
                $gradeDiv = '';
                if ($grade && $div) {
                    $gradeDiv = " ({$grade->name} - {$div->name})";
                }
                return [
                    'id' => $s->id,
                    'name' => ($s->user ? $s->user->name : ($s->first_name . ' ' . $s->last_name)) . $gradeDiv,
                    'raw_name' => $s->user ? $s->user->name : ($s->first_name . ' ' . $s->last_name),
                    'grade_name' => $grade ? $grade->name : '',
                    'division_name' => $div ? $div->name : '',
                ];
            });

        $employees = \App\Models\User::where('branch_id', $branchId)
            ->whereHas('role', function($q) {
                $q->whereNotIn('name', ['طالب', 'ولي أمر']);
            })
            ->select('id', 'name')
            ->get();

        $achievementTypes = \App\Models\StudentAchievementType::select('id', 'name')->get();
        $violationTypes = \App\Models\StudentViolationType::select('id', 'name')->get();
        $activeAcademicYear = \App\Models\AcademicYear::where('branch_id', $branchId)->where('is_active', true)->first()
            ?? \App\Models\AcademicYear::where('is_active', true)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'students' => $students,
                'employees' => $employees,
                'achievement_types' => $achievementTypes,
                'violation_types' => $violationTypes,
                'active_academic_year' => $activeAcademicYear,
                'purpose_categories' => ['أكاديمي', 'سلوكي', 'مالي', 'إداري/أخرى'],
                'statuses' => ['مجدولة', 'جارية', 'مكتملة', 'ملغاة'],
            ]
        ]);
    }

    /**
     * Get Teacher Parent Visits with Stats and Filters
     */
    public function getTeacherParentVisits(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $query = \App\Models\ParentVisit::with(['student.user:id,name', 'student.enrollments.division.grade', 'employee:id,name'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('visitor_name', 'like', "%{$search}%")
                  ->orWhereHas('student.user', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status') && $request->status !== 'الكل' && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('purpose_category') && $request->purpose_category !== 'الكل' && $request->purpose_category !== 'all') {
            $query->where('purpose_category', $request->purpose_category);
        }

        if ($request->filled('date')) {
            $query->whereDate('visit_date', $request->date);
        }

        $allBranchVisits = \App\Models\ParentVisit::when($branchId, fn($q) => $q->where('branch_id', $branchId))->get();
        $stats = [
            'total' => $allBranchVisits->count(),
            'scheduled' => $allBranchVisits->where('status', 'مجدولة')->count(),
            'in_progress' => $allBranchVisits->where('status', 'جارية')->count(),
            'completed' => $allBranchVisits->where('status', 'مكتملة')->count(),
            'cancelled' => $allBranchVisits->where('status', 'ملغاة')->count(),
        ];

        $visits = $query->latest('visit_date')->latest('visit_time')->get();

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'data' => $visits
        ]);
    }

    /**
     * Store Parent Visit
     */
    public function storeTeacherParentVisit(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'visitor_name' => 'required|string|max:255',
            'visitor_relation' => 'required|string|max:255',
            'employee_id' => 'nullable|exists:users,id',
            'visit_date' => 'required|date',
            'visit_time' => 'nullable|string',
            'purpose_category' => 'required|in:أكاديمي,سلوكي,مالي,إداري/أخرى',
            'purpose' => 'nullable|string',
            'status' => 'required|in:مجدولة,جارية,مكتملة,ملغاة',
            'notes' => 'nullable|string',
        ]);

        $validated['branch_id'] = $user->branch_id;
        if (empty($validated['employee_id'])) {
            $validated['employee_id'] = $user->id;
        }

        $visit = \App\Models\ParentVisit::create($validated);

        if ($validated['status'] === 'مكتملة') {
            $this->sendParentVisitCompletedNotification($visit);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل زيارة ولي الأمر بنجاح',
            'data' => $visit->load(['student.user', 'employee:id,name'])
        ]);
    }

    /**
     * Update Parent Visit
     */
    public function updateTeacherParentVisit(Request $request, $id)
    {
        $user = $request->user();
        $visit = \App\Models\ParentVisit::findOrFail($id);

        if ($visit->branch_id !== $user->branch_id && $user->role?->name !== 'مدير النظام') {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'visitor_name' => 'required|string|max:255',
            'visitor_relation' => 'required|string|max:255',
            'employee_id' => 'nullable|exists:users,id',
            'visit_date' => 'required|date',
            'visit_time' => 'nullable|string',
            'purpose_category' => 'required|in:أكاديمي,سلوكي,مالي,إداري/أخرى',
            'purpose' => 'nullable|string',
            'status' => 'required|in:مجدولة,جارية,مكتملة,ملغاة',
            'notes' => 'nullable|string',
        ]);

        $originalStatus = $visit->status;
        $visit->update($validated);

        if ($originalStatus !== 'مكتملة' && $validated['status'] === 'مكتملة') {
            $this->sendParentVisitCompletedNotification($visit);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات الزيارة بنجاح',
            'data' => $visit->load(['student.user', 'employee:id,name'])
        ]);
    }

    /**
     * Delete Parent Visit
     */
    public function destroyTeacherParentVisit(Request $request, $id)
    {
        $user = $request->user();
        $visit = \App\Models\ParentVisit::findOrFail($id);

        if ($visit->branch_id !== $user->branch_id && $user->role?->name !== 'مدير النظام') {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $visit->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف سجل الزيارة بنجاح'
        ]);
    }

    /**
     * Convert Completed Parent Visit to Student Achievement
     */
    public function convertParentVisitToAchievement(Request $request, $id)
    {
        $user = $request->user();
        $visit = \App\Models\ParentVisit::findOrFail($id);

        if ($visit->status !== 'مكتملة') {
            return response()->json(['success' => false, 'message' => 'يجب أن تكون الزيارة مكتملة لتحويلها إلى إنجاز'], 422);
        }

        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'student_achievement_type_id' => 'required|exists:student_achievement_types,id',
            'points' => 'required|integer|min:1',
            'description' => 'required|string|max:60000',
        ]);

        $achievement = \App\Models\StudentAchievement::create([
            'student_id' => $visit->student_id,
            'academic_year_id' => $validated['academic_year_id'],
            'branch_id' => $visit->branch_id,
            'student_achievement_type_id' => $validated['student_achievement_type_id'],
            'description' => $validated['description'] . " (بناءً على زيارة ولي الأمر)",
            'points' => $validated['points'],
            'date_awarded' => now(),
            'awarded_by' => $user->id,
            'status' => 'approved',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحويل الزيارة وإضافة إنجاز للطالب بنجاح',
            'data' => $achievement
        ]);
    }

    /**
     * Convert Completed Parent Visit to Student Violation
     */
    public function convertParentVisitToViolation(Request $request, $id)
    {
        $user = $request->user();
        $visit = \App\Models\ParentVisit::findOrFail($id);

        if ($visit->status !== 'مكتملة') {
            return response()->json(['success' => false, 'message' => 'يجب أن تكون الزيارة مكتملة لتحويلها إلى مخالفة'], 422);
        }

        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'violation_type_id' => 'required|exists:student_violation_types,id',
            'action_taken' => 'required|string|max:255',
            'details' => 'required|string|max:60000',
        ]);

        $violation = \App\Models\StudentViolation::create([
            'branch_id' => $visit->branch_id,
            'academic_year_id' => $validated['academic_year_id'],
            'student_id' => $visit->student_id,
            'violation_type_id' => $validated['violation_type_id'],
            'supervisor_id' => $user->id,
            'violation_date' => now(),
            'details' => $validated['details'] . " (بناءً على زيارة ولي الأمر)",
            'action_taken' => $validated['action_taken'],
            'status' => 'مفتوحة',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحويل الزيارة وتسجيل مخالفة للطالب بنجاح',
            'data' => $violation
        ]);
    }

    /**
     * Helper to send thank-you notification upon visit completion
     */
    private function sendParentVisitCompletedNotification(\App\Models\ParentVisit $parentVisit)
    {
        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $parentVisit->load('student.parents', 'student.user');
            $studentName = $parentVisit->student->user->name ?? 'الطالب';
            $title = 'شكر على زيارتكم للمدرسة';
            
            $message = "نشكركم على زيارتكم الكريمة بخصوص الطالب {$studentName}. ";
            if (!empty($parentVisit->notes)) {
                $message .= "أهم الملاحظات: {$parentVisit->notes}";
            }

            if ($parentVisit->student && $parentVisit->student->parents) {
                foreach ($parentVisit->student->parents as $parent) {
                    $notificationService->sendComprehensiveNotification(
                        $parent,
                        $title,
                        $message,
                        'visit_completed',
                        false
                    );
                }
            }
        } catch (\Exception $e) {
            \Log::error('فشل إرسال إشعار الزيارة: ' . $e->getMessage());
        }
    }

    /**
     * Get Students List for forms
     */
    public function getTeacherStudentsList(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $students = \App\Models\Student::with(['user:id,name', 'enrollments.division.grade'])
            ->when($branchId, fn($q) => $q->whereHas('user', fn($uq) => $uq->where('branch_id', $branchId)))
            ->get()
            ->map(function($s) {
                $enrollment = $s->enrollments->first();
                $div = $enrollment && $enrollment->division ? $enrollment->division : null;
                $grade = $div && $div->grade ? $div->grade : null;
                return [
                    'id' => $s->id,
                    'name' => $s->user ? $s->user->name : ($s->first_name . ' ' . $s->last_name),
                    'grade_name' => $grade ? $grade->name : '',
                    'division_name' => $div ? $div->name : '',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $students
        ]);
    }
}


