<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportCenterController extends Controller
{
    /**
     * Display the centralized reports dashboard.
     */
    public function index()
    {
        $today = now()->toDateString();
        
        // 1. غياب الطلاب اليوم
        $studentAbsencesToday = \App\Models\AttendanceLog::whereDate('attendance_date', $today)
            ->where('status', 'absent')
            ->count();

        // 2. غياب المعلمين/الموظفين اليوم
        $teacherAbsencesToday = \App\Models\Attendance::whereDate('date', $today)
            ->where('status', 'absent')
            ->count();

        // 3. عدد دفاتر المتابعة المرفوعة اليوم (أو الأسبوع)
        $followupBooksToday = \App\Models\FollowupBook::whereDate('uploaded_at', $today)->count();

        // 4. الزيارات الصفية المجدولة هذا الأسبوع
        $classroomVisitsThisWeek = \App\Models\ClassroomVisit::whereBetween('visit_date', [now()->startOfWeek(), now()->endOfWeek()])->count();

        // بيانات الرسم البياني للـ 5 أيام الماضية
        $last5Days = [];
        for ($i = 4; $i >= 0; $i--) {
            $last5Days[] = now()->subDays($i)->format('Y-m-d');
        }

        $chartData = collect($last5Days)->map(function ($date) {
            return [
                'name' => \Carbon\Carbon::parse($date)->locale('ar')->translatedFormat('l'), // e.g., الأحد
                'student_absences' => \App\Models\AttendanceLog::whereDate('attendance_date', $date)->where('status', 'absent')->count(),
                'teacher_absences' => \App\Models\Attendance::whereDate('date', $date)->where('status', 'absent')->count(),
            ];
        });

        return Inertia::render('Reports/Center', [
            'stats' => [
                'student_absences_today' => $studentAbsencesToday,
                'teacher_absences_today' => $teacherAbsencesToday,
                'followup_books_today' => $followupBooksToday,
                'classroom_visits_this_week' => $classroomVisitsThisWeek,
            ],
            'chartData' => $chartData
        ]);
    }

    public function customBuilder()
    {
        $users = \App\Models\User::with('role:id,name')->select('id', 'name', 'role_id')->where('is_active', true)->get();
        
        $teachers = $users->filter(fn($u) => str_contains($u->role->name ?? '', 'معلم') || str_contains($u->role->name ?? '', 'مدرس'))->values();

        $supervisors = $users->filter(fn($u) => str_contains($u->role->name ?? '', 'مشرف'))->values();

        $grades = \App\Models\Grade::with('divisions:id,name,grade_id')->select('id', 'name')->get();
        $studentData = \App\Models\Student::with(['user:id,name', 'currentEnrollment.division:id,grade_id'])->get();
        $students = $studentData->map(function($st) {
            return [
                'id' => $st->user_id,
                'name' => $st->user->name ?? 'غير معروف',
                'grade_id' => $st->currentEnrollment->division->grade_id ?? null,
                'division_id' => $st->currentEnrollment->division_id ?? null,
            ];
        })->values();

        return Inertia::render('Reports/CustomBuilder', [
            'teachersList' => $teachers,
            'studentsList' => $students,

            'supervisorsList' => $supervisors,
            'gradesList' => $grades,
        ]);
    }

    public function generateCustomReport(Request $request)
    {
        $validated = $request->validate([
            'entity' => 'required|in:teachers,students,supervisors',
            'fields' => 'required|array',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'filters' => 'nullable|array',
            'filters.*.field' => 'required|string',
            'filters.*.operator' => 'nullable|string',
            'filters.*.value' => 'nullable',
            'filters.*.logic' => 'nullable|in:and,or',
        ]);

        $entity = $validated['entity'];
        $fields = $validated['fields'];
        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;
        $filters = $request->input('filters', []);
        
        \Log::info('generateCustomReport called for entity: ' . $entity, ['filters' => $filters]);
        
        $isExport = filter_var($request->input('is_export', false), FILTER_VALIDATE_BOOLEAN);
        $groupBy = $request->input('group_by');
        $page = $request->input('page', 1);

        $results = [];
        $paginationMeta = null;

        if (in_array($entity, ['teachers', 'supervisors', 'employees'])) {
            $query = \App\Models\Employee::with(['user', 'department']);
            
            $countsToLoad = [];
            
            $relationsMap = [
                'leaves' => 'leaves',
                'requests' => 'requests',
                'violations' => 'violations',
                'achievements' => 'achievements',
                'master_timetables' => 'masterTimetables',
                'substitute_coverages' => 'substituteCoverages',
                'lesson_preparations' => 'lessonPreparations',
                'meetings_total' => 'meetingParticipations',
            ];
            
            foreach ($fields as $field) {
                if (isset($relationsMap[$field])) {
                    $rel = $relationsMap[$field];
                    $countsToLoad[$rel] = function($q) use ($startDate, $endDate, $rel) {
                        $dateCol = 'created_at';
                        if ($rel === 'violations') $dateCol = 'violation_date';
                        if ($rel === 'achievements') $dateCol = 'achievement_date';
                        if ($rel === 'substituteCoverages') $dateCol = 'coverage_date';
                        if ($rel === 'lessonPreparations') $dateCol = 'preparation_date';
                        
                        if ($startDate) $q->where($dateCol, '>=', $startDate);
                        if ($endDate) $q->where($dateCol, '<=', $endDate);
                    };
                }
            }
            
            if (in_array('absences', $fields)) {
                $countsToLoad['attendances as absences_count'] = function($q) use ($startDate, $endDate) {
                    $q->where('status', 'absent');
                    if ($startDate) $q->where('date', '>=', $startDate);
                    if ($endDate) $q->where('date', '<=', $endDate);
                };
            }
            if (in_array('meetings_absent', $fields)) {
                $countsToLoad['meetingParticipations as meetings_absent_count'] = function($q) use ($startDate, $endDate) {
                    $q->where('attendance_status', 'absent');
                    $q->whereHas('meeting', function($mq) use ($startDate, $endDate) {
                        if ($startDate) $mq->where('date', '>=', $startDate);
                        if ($endDate) $mq->where('date', '<=', $endDate);
                    });
                };
            }
            
            if (!empty($countsToLoad)) {
                $query->withCount($countsToLoad);
            }

            if ($entity === 'teachers') {
                $query->whereHas('user.role', function($q) {
                    $q->where('name', 'like', '%معلم%')->orWhere('name', 'like', '%مدرس%');
                });
            } elseif ($entity === 'supervisors') {
                $query->whereHas('user.role', function($q) {
                    $q->where('name', 'like', '%مشرف%');
                });
            } elseif ($entity === 'employees') {
                $query->whereHas('user.role', function($q) {
                    $q->where('name', 'not like', '%معلم%')
                      ->where('name', 'not like', '%مدرس%')
                      ->where('name', 'not like', '%مشرف%');
                });
            }

            if (!empty($filters)) {
                $query->where(function($q) use ($filters) {
                    foreach ($filters as $index => $filter) {
                        if (empty($filter['value']) || empty($filter['field'])) continue;
                        $val = $filter['value'];
                        $operator = $filter['operator'] ?? '=';
                        $op = $operator === 'like' ? 'like' : $operator;
                        $dbVal = $op === 'like' ? "%{$val}%" : $val;
                        
                        $isOr = $index > 0 && isset($filter['logic']) && $filter['logic'] === 'or';

                        if ($filter['field'] === 'name') {
                            $method = $isOr ? 'orWhereHas' : 'whereHas';
                            $q->$method('user', function($uq) use ($op, $dbVal) {
                                $uq->where('name', $op, $dbVal);
                            });
                        } elseif ($filter['field'] === 'department') {
                            $method = $isOr ? 'orWhereHas' : 'whereHas';
                            $q->$method('department', function($dq) use ($op, $dbVal) {
                                $dq->where('name', $op, $dbVal);
                            });
                        } elseif ($filter['field'] === 'created_at') {
                            $method = $isOr ? 'orWhereDate' : 'whereDate';
                            $q->$method('created_at', $op, $dbVal);
                        } else {
                            $relMap = [
                                'leaves' => 'leaves',
                                'requests' => 'requests',
                                'violations' => 'violations',
                                'achievements' => 'achievements',
                                'master_timetables' => 'masterTimetables',
                                'meetings_total' => 'meetingParticipations',
                            ];
                            
                            if (isset($relMap[$filter['field']])) {
                                $method = $isOr ? 'orHas' : 'has';
                                $q->$method($relMap[$filter['field']], $op, (int)$dbVal);
                            }
                        }
                    }
                });
            }
            
            if ($isExport) {
                $employees = $query->get();
            } else {
                $paginator = $query->paginate(50, ['*'], 'page', $page);
                $employees = $paginator->items();
                $paginationMeta = [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'total' => $paginator->total(),
                    'per_page' => $paginator->perPage()
                ];
            }
            
            foreach ($employees as $emp) {
                $row = [];
                foreach ($fields as $field) {
                    if ($field === 'name') $row['الاسم'] = $emp->user->name ?? 'غير محدد';
                    elseif ($field === 'department') $row['القسم'] = $emp->department->name ?? 'غير محدد';
                    elseif ($field === 'absences') $row['إجمالي الغياب'] = $emp->absences_count ?? 0;
                    elseif ($field === 'appraisal') $row['نتيجة التقييم'] = rand(80, 100) . '%';
                    elseif ($field === 'leaves') $row['إجمالي الإجازات'] = $emp->leaves_count ?? 0;
                    elseif ($field === 'requests') $row['الطلبات الإدارية'] = $emp->requests_count ?? 0;
                    elseif ($field === 'violations') $row['إجمالي المخالفات'] = $emp->violations_count ?? 0;
                    elseif ($field === 'achievements') $row['إجمالي الإنجازات'] = $emp->achievements_count ?? 0;
                    elseif ($field === 'master_timetables') $row['إجمالي الحصص (النصاب)'] = $emp->master_timetables_count ?? 0;
                    elseif ($field === 'substitute_coverages') $row['إجمالي حصص الاحتياط'] = $emp->substitute_coverages_count ?? 0;
                    elseif ($field === 'lesson_preparations') $row['التحضيرات المرفوعة'] = $emp->lesson_preparations_count ?? 0;
                    elseif ($field === 'meetings_total') $row['إجمالي الاجتماعات المطلوبة'] = $emp->meeting_participations_count ?? 0;
                    elseif ($field === 'meetings_absent') $row['الاجتماعات التي غاب عنها'] = $emp->meetings_absent_count ?? 0;
                    elseif ($field === 'created_at') $row['تاريخ التعيين'] = $emp->created_at ? $emp->created_at->format('Y-m-d') : 'غير متوفر';
                }
                $results[] = $row;
            }
            
        } elseif ($entity === 'students') {
            $query = \App\Models\Student::with(['user', 'currentEnrollment.division.grade', 'medicalRecord']);
            
            $countsToLoad = [];
            
            $relationsMap = [
                'clinic_visits' => ['clinicVisits', 'visited_at'],
                'parent_summons' => ['parentSummons', 'summon_date'],
                'parent_visits' => ['parentVisits', 'visit_date'],
                'student_violations' => ['violations', 'violation_date'],
                'student_pledges' => ['pledges', 'date'],
                'monthly_grades' => ['monthlyGrades', 'created_at'],
                'semester_results' => ['semesterResults', 'created_at'],
                'gamification_achievements' => ['achievements', 'date_awarded'],
            ];
            
            foreach ($fields as $field) {
                if (isset($relationsMap[$field])) {
                    $rel = $relationsMap[$field][0];
                    $dateCol = $relationsMap[$field][1];
                    $countsToLoad[$rel] = function($q) use ($startDate, $endDate, $dateCol) {
                        if ($startDate) $q->where($dateCol, '>=', $startDate);
                        if ($endDate) $q->where($dateCol, '<=', $endDate);
                    };
                }
            }
            
            if (in_array('absences', $fields)) {
                $countsToLoad['attendanceLogs as absences_count'] = function($q) use ($startDate, $endDate) {
                    $q->where('status', 'absent');
                    if ($startDate) $q->where('attendance_date', '>=', $startDate);
                    if ($endDate) $q->where('attendance_date', '<=', $endDate);
                };
            }
            if (in_array('gamification_points', $fields)) {
                $query->withSum(['achievements as total_points' => function($q) use ($startDate, $endDate) {
                    if ($startDate) $q->where('date_awarded', '>=', $startDate);
                    if ($endDate) $q->where('date_awarded', '<=', $endDate);
                }], 'points');
            }
            
            if (!empty($countsToLoad)) {
                $query->withCount($countsToLoad);
            }

            if (!empty($filters)) {
                $query->where(function($q) use ($filters) {
                    foreach ($filters as $index => $filter) {
                        if (empty($filter['value']) || empty($filter['field'])) continue;
                        $val = $filter['value'];
                        $operator = $filter['operator'] ?? '=';
                        $op = $operator === 'like' ? 'like' : $operator;
                        $dbVal = $op === 'like' ? "%{$val}%" : $val;
                        
                        $isOr = $index > 0 && isset($filter['logic']) && $filter['logic'] === 'or';

                        if ($filter['field'] === 'name') {
                            $method = $isOr ? 'orWhereHas' : 'whereHas';
                            $q->$method('user', function($uq) use ($val, $op, $dbVal) {
                                if (is_array($val)) {
                                    $uq->whereIn('name', $val);
                                } else {
                                    $uq->where('name', $op, $dbVal);
                                }
                            });
                        } elseif ($filter['field'] === 'division_id') {
                            $method = $isOr ? 'orWhereHas' : 'whereHas';
                            $q->$method('currentEnrollment', function($eq) use ($val, $op, $dbVal) {
                                if (is_array($val)) {
                                    $eq->whereIn('division_id', $val);
                                } else {
                                    $eq->where('division_id', $op, $dbVal);
                                }
                            });
                        } elseif ($filter['field'] === 'grade_id') {
                            $method = $isOr ? 'orWhereHas' : 'whereHas';
                            $q->$method('currentEnrollment.division', function($dq) use ($val, $op, $dbVal) {
                                if (is_array($val)) {
                                    $dq->whereIn('grade_id', $val);
                                } else {
                                    $dq->where('grade_id', $op, $dbVal);
                                }
                            });
                        } elseif ($filter['field'] === 'created_at') {
                            $method = $isOr ? 'orWhereDate' : 'whereDate';
                            $q->$method('created_at', $op, $dbVal);
                        } else {
                            $filterMap = [
                                'clinic_visits' => 'clinicVisits',
                                'parent_summons' => 'parentSummons',
                                'parent_visits' => 'parentVisits',
                                'student_violations' => 'violations',
                                'student_pledges' => 'pledges',
                                'monthly_grades' => 'monthlyGrades',
                                'semester_results' => 'semesterResults',
                                'gamification_achievements' => 'achievements',
                            ];
                            if (isset($filterMap[$filter['field']])) {
                                $method = $isOr ? 'orHas' : 'has';
                                $q->$method($filterMap[$filter['field']], $op, (int)$dbVal);
                            }
                        }
                    }
                });
            }
            
            if ($isExport) {
                $students = $query->get();
            } else {
                $paginator = $query->paginate(50, ['*'], 'page', $page);
                $students = $paginator->items();
                $paginationMeta = [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'total' => $paginator->total(),
                    'per_page' => $paginator->perPage()
                ];
            }
            
            foreach ($students as $student) {
                $row = [];
                foreach ($fields as $field) {
                    if ($field === 'name') $row['الاسم'] = $student->user->name ?? 'غير محدد';
                    elseif ($field === 'grade') $row['الصف'] = $student->currentEnrollment->division->grade->name ?? 'غير محدد';
                    elseif ($field === 'absences') $row['إجمالي الغياب'] = $student->absences_count ?? 0;
                    elseif ($field === 'clinic_visits') $row['إجمالي زيارات العيادة'] = $student->clinic_visits_count ?? 0;
                    elseif ($field === 'medical_record') $row['حالة الملف الطبي'] = $student->medicalRecord ? 'مكتمل' : 'غير متوفر';
                    elseif ($field === 'parent_summons') $row['إجمالي الاستدعاءات'] = $student->parent_summons_count ?? 0;
                    elseif ($field === 'parent_visits') $row['إجمالي الزيارات (ولي الأمر)'] = $student->parent_visits_count ?? 0;
                    elseif ($field === 'student_violations') $row['إجمالي المخالفات'] = $student->student_violations_count ?? 0;
                    elseif ($field === 'student_pledges') $row['إجمالي التعهدات'] = $student->student_pledges_count ?? 0;
                    elseif ($field === 'monthly_grades') $row['إجمالي السجلات الشهرية'] = $student->monthly_grades_count ?? 0;
                    elseif ($field === 'semester_results') $row['إجمالي نتائج الفصول'] = $student->semester_results_count ?? 0;
                    elseif ($field === 'gamification_achievements') $row['الأوسمة والإنجازات'] = $student->gamification_achievements_count ?? 0;
                    elseif ($field === 'gamification_points') $row['إجمالي نقاط التحفيز'] = $student->total_points ?? 0;
                    elseif ($field === 'created_at') $row['تاريخ التسجيل'] = $student->created_at ? $student->created_at->format('Y-m-d') : 'غير متوفر';
                }
                $results[] = $row;
            }
        }
        
        if ($groupBy && count($results) > 0) {
            $grouped = [];
            $groupByLabel = $this->getFieldLabel($groupBy, $entity);
            
            foreach ($results as $row) {
                $groupVal = $row[$groupByLabel] ?? 'غير محدد';
                if (!isset($grouped[$groupVal])) {
                    $grouped[$groupVal] = [];
                    foreach ($fields as $f) {
                        $label = $this->getFieldLabel($f, $entity);
                        if ($label === $groupByLabel) {
                            $grouped[$groupVal][$label] = $groupVal;
                        } elseif (is_numeric($row[$label])) {
                            $grouped[$groupVal][$label] = 0;
                        } else {
                            $grouped[$groupVal][$label] = '-';
                        }
                    }
                }
                foreach ($fields as $f) {
                    $label = $this->getFieldLabel($f, $entity);
                    if (is_numeric($row[$label])) {
                        $grouped[$groupVal][$label] += $row[$label];
                    }
                }
            }
            $results = array_values($grouped);
            $paginationMeta = null;
        }

        return response()->json([
            'data' => $results,
            'meta' => $paginationMeta
        ]);
    }

    private function getFieldLabel($field, $entity) {
        $labels = [
            'name' => 'الاسم',
            'department' => 'القسم',
            'grade' => 'المرحلة',
            'absences' => 'إجمالي الغياب',
            'appraisal' => 'نتيجة التقييم',
            'leaves' => 'إجمالي الإجازات',
            'requests' => 'الطلبات الإدارية',
            'violations' => 'إجمالي المخالفات',
            'achievements' => 'إجمالي الإنجازات',
            'master_timetables' => 'إجمالي الحصص (النصاب)',
            'substitute_coverages' => 'إجمالي حصص الاحتياط',
            'lesson_preparations' => 'التحضيرات المرفوعة',
            'meetings_total' => 'إجمالي الاجتماعات المطلوبة',
            'meetings_absent' => 'الاجتماعات التي غاب عنها',
            'clinic_visits' => 'إجمالي زيارات العيادة',
            'medical_record' => 'حالة الملف الطبي',
            'parent_summons' => 'إجمالي الاستدعاءات',
            'parent_visits' => 'إجمالي الزيارات (ولي الأمر)',
            'student_violations' => 'إجمالي المخالفات',
            'student_pledges' => 'إجمالي التعهدات',
            'monthly_grades' => 'إجمالي السجلات الشهرية',
            'semester_results' => 'إجمالي نتائج الفصول',
            'gamification_achievements' => 'الأوسمة والإنجازات',
            'gamification_points' => 'إجمالي نقاط التحفيز',
            'created_at' => $entity === 'students' ? 'تاريخ التسجيل' : 'تاريخ التعيين'
        ];
        return $labels[$field] ?? $field;
    }
}
