<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\FollowupBook;
use App\Models\Grade;
use App\Models\MasterTimetable;
use App\Models\Semester;
use App\Models\Setting;
use App\Models\Subject;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class FollowupBookManagementController extends Controller
{
    private function authorizeView(): void
    {
        $user = auth()->user();
        $isAllowedRole = $user?->role && in_array($user->role->name, ['مدير النظام', 'مدير الفرع', 'مدير فرع', 'موجه', 'موجه تربوي', 'مشرف تربوي'], true);
        if (
            !$isAllowedRole
            && !$user?->hasPermission('عرض دفاتر المتابعة')
            && !$user?->hasPermission('إدارة دفاتر المتابعة')
            && !$user?->hasPermission('عرض دفاتر التحضير')
            && !$user?->hasPermission('إدارة دفاتر التحضير')
        ) {
            abort(403, 'غير مصرح لك بعرض دفاتر المتابعة.');
        }
    }

    private function authorizeManage(): void
    {
        $user = auth()->user();
        $isAllowedRole = $user?->role && in_array($user->role->name, ['مدير النظام', 'مدير الفرع', 'مدير فرع', 'موجه', 'موجه تربوي', 'مشرف تربوي'], true);
        if (
            !$isAllowedRole
            && !$user?->hasPermission('إدارة دفاتر المتابعة')
            && !$user?->hasPermission('إدارة دفاتر التحضير')
            && !$user?->hasPermission('إدارة النظام')
        ) {
            abort(403, 'غير مصرح لك بإدارة دفاتر المتابعة.');
        }
    }

    /**
     * Automatically sync missing expected follow-up book entries from the master timetable up to today.
     */
    private function syncExpectedRecords(?int $branchId, ?string $startDate, ?string $endDate): void
    {
        $today = now()->startOfDay();
        $rangeEnd = $endDate ? Carbon::parse($endDate)->startOfDay() : $today->copy();
        if ($rangeEnd->gt($today)) {
            $rangeEnd = $today->copy();
        }

        $rangeStart = $startDate ? Carbon::parse($startDate)->startOfDay() : $rangeEnd->copy()->subDays(6);
        if ($rangeStart->gt($rangeEnd)) {
            return;
        }

        if ($rangeStart->diffInDays($rangeEnd) > 31) {
            $rangeStart = $rangeEnd->copy()->subDays(31);
        }

        $activeYear = AcademicYear::where('is_active', true)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->first() ?? AcademicYear::where('is_active', true)->first();

        $activeYearId = $activeYear?->id;
        $activeSemester = Semester::where('is_active', true)
            ->when($activeYearId, fn ($q) => $q->where('academic_year_id', $activeYearId))
            ->first() ?? Semester::where('is_active', true)->first();

        $workingDays = is_array($activeYear?->working_days) && !empty($activeYear->working_days)
            ? $activeYear->working_days
            : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        $timetables = MasterTimetable::with(['teacher:id,branch_id', 'division.grade:id,branch_id'])
            ->when($activeSemester, fn ($q) => $q->where('semester_id', $activeSemester->id))
            ->when($branchId, function ($q) use ($branchId) {
                $q->where(function ($sub) use ($branchId) {
                    $sub->whereHas('teacher', fn ($tq) => $tq->where('branch_id', $branchId))
                        ->orWhereHas('division.grade', fn ($gq) => $gq->where('branch_id', $branchId));
                });
            })
            ->get();

        if ($timetables->isEmpty()) {
            return;
        }

        $existing = FollowupBook::whereBetween('date', [$rangeStart->format('Y-m-d'), $rangeEnd->format('Y-m-d')])
            ->get(['id', 'teacher_id', 'subject_id', 'division_id', 'period_id', 'date']);

        $existingByDate = $existing->groupBy(function (FollowupBook $item) {
            return $item->date instanceof Carbon
                ? $item->date->format('Y-m-d')
                : substr((string) $item->date, 0, 10);
        });

        $nowTimestamp = now()->toDateTimeString();
        $toInsert = [];

        foreach (CarbonPeriod::create($rangeStart, $rangeEnd) as $date) {
            $englishDay = $date->format('l');
            $isWorkingDay = collect($workingDays)->contains(
                fn ($wd) => FollowupBook::matchesDayOfWeek((string) $wd, $englishDay)
            );
            if (!$isWorkingDay) {
                continue;
            }

            $dateStr = $date->format('Y-m-d');
            $dayExisting = $existingByDate->get($dateStr, collect());
            $matchedIds = [];

            $dayLessons = $timetables->filter(function ($tt) use ($englishDay) {
                return $tt->teacher_id
                    && $tt->subject_id
                    && $tt->division_id
                    && FollowupBook::matchesDayOfWeek($tt->day_of_week, $englishDay);
            })->unique(function ($tt) {
                return $tt->teacher_id . '_' . $tt->subject_id . '_' . $tt->division_id . '_' . ($tt->period_id ?? 0);
            });

            foreach ($dayLessons as $tt) {
                $slotCandidates = $dayExisting->filter(function (FollowupBook $item) use ($tt, $matchedIds) {
                    return !isset($matchedIds[$item->id])
                        && (int) $item->teacher_id === (int) $tt->teacher_id
                        && (int) $item->subject_id === (int) $tt->subject_id
                        && (int) $item->division_id === (int) $tt->division_id;
                });

                // Match exact period first or claim one unused legacy slot without stealing another period's row.
                $match = $tt->period_id
                    ? ($slotCandidates->first(fn (FollowupBook $item) => (int) $item->period_id === (int) $tt->period_id)
                        ?? $slotCandidates->first(fn (FollowupBook $item) => empty($item->period_id)))
                    : $slotCandidates->first();

                if ($match) {
                    $matchedIds[$match->id] = true;
                    continue;
                }

                $toInsert[] = [
                    'teacher_id' => $tt->teacher_id,
                    'subject_id' => $tt->subject_id,
                    'division_id' => $tt->division_id,
                    'period_id' => $tt->period_id ?: null,
                    'branch_id' => $tt->teacher?->branch_id ?? $tt->division?->grade?->branch_id ?? $branchId,
                    'academic_year_id' => $activeYearId,
                    'date' => $dateStr,
                    'upload_source' => 'dashboard',
                    'created_at' => $nowTimestamp,
                    'updated_at' => $nowTimestamp,
                ];
            }
        }

        if (!empty($toInsert)) {
            foreach (array_chunk($toInsert, 500) as $chunk) {
                FollowupBook::insert($chunk);
            }
        }
    }

    /**
     * Build the base query and mapped records for both index and export without duplicating filter logic.
     */
    private function buildFilteredData(Request $request): array
    {
        $user = auth()->user();
        $branchId = $user?->branch_id;
        $timeLimit = Setting::where('key', 'followup_upload_time_limit')->value('value') ?: '14:00';

        $search = trim((string) $request->input('search', ''));
        $teacherId = $request->input('teacher_id');
        $gradeId = $request->input('grade_id');
        $subjectId = $request->input('subject_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $statusFilter = $request->input('status', '');

        $this->syncExpectedRecords($branchId ? (int) $branchId : null, $startDate, $endDate);

        $query = FollowupBook::with([
            'teacher:id,name,branch_id',
            'subject:id,name',
            'division.grade',
            'period:id,period_name',
            'reviewer:id,name',
        ])
            ->when($branchId, function ($q) use ($branchId) {
                $q->where(function ($sub) use ($branchId) {
                    $sub->where('branch_id', $branchId)
                        ->orWhereHas('teacher', fn ($tq) => $tq->where('branch_id', $branchId));
                });
            })
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('lesson_title', 'like', "%{$search}%")
                        ->orWhere('homework', 'like', "%{$search}%")
                        ->orWhereHas('teacher', fn ($tq) => $tq->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($teacherId, fn ($q) => $q->where('teacher_id', $teacherId))
            ->when($subjectId, fn ($q) => $q->where('subject_id', $subjectId))
            ->when($gradeId, fn ($q) => $q->whereHas('division', fn ($dq) => $dq->where('grade_id', $gradeId)))
            ->when($startDate, fn ($q) => $q->whereDate('date', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->whereDate('date', '<=', $endDate))
            ->orderByDesc('date')
            ->orderByDesc('id');

        $allRecords = $query->get();

        $statusLabels = [
            'uploaded' => 'مرفوع في الوقت',
            'late'     => 'مرفوع متأخر',
            'pending'  => 'غير مرفوع',
        ];

        $mapped = $allRecords->map(function (FollowupBook $item) use ($timeLimit, $statusLabels) {
            $statusCode = $item->resolveStatus($timeLimit);
            $dateStr = $item->date instanceof Carbon ? $item->date->format('Y-m-d') : substr((string) $item->date, 0, 10);

            return [
                'id' => $item->id,
                'teacher_id' => $item->teacher_id,
                'teacher_name' => $item->teacher?->name ?? 'غير محدد',
                'subject_name' => $item->subject?->name ?? 'غير محدد',
                'grade_name' => $item->division?->grade?->name ?? '',
                'division_name' => $item->division?->name ?? '',
                'period_id' => $item->period_id,
                'period_name' => $item->period?->period_name ?? '',
                'date' => $dateStr,
                'day_name' => FollowupBook::arabicDayName(Carbon::parse($dateStr)->format('l')),
                'lesson_title' => $item->lesson_title ?: '',
                'page_number' => $item->page_number ?: '',
                'homework' => $item->homework ?: '',
                'homework_page' => $item->homework_page ?: '',
                'notes' => $item->notes ?: '',
                'attachments' => $item->formattedAttachments(),
                'upload_source' => $item->upload_source ?: 'dashboard',
                'uploaded_at' => $item->uploaded_at ? $item->uploaded_at->format('Y-m-d H:i') : null,
                'supervisor_rating' => $item->supervisor_rating,
                'supervisor_notes' => $item->supervisor_notes ?: '',
                'reviewer_name' => $item->reviewer?->name ?? '',
                'reviewed_at' => $item->reviewed_at ? $item->reviewed_at->format('Y-m-d H:i') : null,
                'status_code' => $statusCode,
                'status_label' => $statusLabels[$statusCode] ?? $statusCode,
            ];
        });

        $totalCount = $mapped->count();
        $uploadedCount = $mapped->where('status_code', 'uploaded')->count();
        $lateCount = $mapped->where('status_code', 'late')->count();
        $pendingCount = $mapped->where('status_code', 'pending')->count();
        $complianceRate = $totalCount > 0 ? (int) round((($uploadedCount + $lateCount) / $totalCount) * 100) : 100;

        $filtered = in_array($statusFilter, ['uploaded', 'late', 'pending'], true)
            ? $mapped->where('status_code', $statusFilter)->values()
            : $mapped->values();

        return [
            'records' => $filtered,
            'stats' => [
                'total' => $totalCount,
                'uploaded' => $uploadedCount,
                'late' => $lateCount,
                'pending' => $pendingCount,
                'compliance_rate' => $complianceRate,
            ],
            'timeLimit' => $timeLimit,
            'branchId' => $branchId,
        ];
    }

    public function index(Request $request)
    {
        $this->authorizeView();

        $data = $this->buildFilteredData($request);
        $branchId = $data['branchId'];
        $collection = $data['records'];

        $perPage = 18;
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $pagedItems = $collection->slice(($currentPage - 1) * $perPage, $perPage)->values();

        $followups = new LengthAwarePaginator(
            $pagedItems,
            $collection->count(),
            $perPage,
            $currentPage,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        $teachers = User::whereHas('role', function ($q) {
                $q->where('name', 'like', '%معلم%')->orWhere('name', 'Teacher');
            })
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->get(['id', 'name']);

        $grades = Grade::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->get(['id', 'name']);

        $subjects = Subject::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Academic/FollowupBooks/Index', [
            'followups' => $followups,
            'stats' => $data['stats'],
            'teachers' => $teachers,
            'grades' => $grades,
            'subjects' => $subjects,
            'timeLimit' => $data['timeLimit'],
            'filters' => $request->only(['search', 'teacher_id', 'grade_id', 'subject_id', 'start_date', 'end_date', 'status']),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $this->authorizeManage();

        $request->validate([
            'time_limit' => 'required|date_format:H:i',
        ]);

        Setting::updateOrCreate(
            ['key' => 'followup_upload_time_limit'],
            ['value' => $request->time_limit, 'group' => 'general']
        );

        return back()->with('success', 'تم حفظ موعد تسليم دفاتر المتابعة اليومي بنجاح.');
    }

    public function export(Request $request)
    {
        $this->authorizeView();

        $data = $this->buildFilteredData($request);
        $records = $data['records'];

        $fileName = 'followup_books_' . date('Y-m-d') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename={$fileName}",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = [
            'المعلم',
            'المادة',
            'الصف',
            'الشعبة',
            'الحصة',
            'التاريخ',
            'اليوم',
            'عنوان الدرس',
            'رقم الصفحة',
            'الواجب المنزلي',
            'صفحة الواجب',
            'الحالة',
            'وقت الرفع',
            'المصدر',
            'ملاحظات',
            'تقييم الموجه',
            'ملاحظات الموجه',
        ];

        $callback = function () use ($records, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            foreach ($records as $row) {
                fputcsv($file, [
                    $row['teacher_name'],
                    $row['subject_name'],
                    $row['grade_name'],
                    $row['division_name'],
                    $row['period_name'] ?: '-',
                    $row['date'],
                    $row['day_name'],
                    $row['lesson_title'] ?: '-',
                    $row['page_number'] ?: '-',
                    $row['homework'] ?: '-',
                    $row['homework_page'] ?: '-',
                    $row['status_label'],
                    $row['uploaded_at'] ?: '-',
                    $row['upload_source'] === 'app' ? 'التطبيق' : 'لوحة التحكم',
                    $row['notes'] ?: '-',
                    $row['supervisor_rating'] ? "{$row['supervisor_rating']}/5" : '-',
                    $row['supervisor_notes'] ?: '-',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function review(Request $request, FollowupBook $followupBook)
    {
        $this->authorizeManage();

        $userBranchId = auth()->user()?->branch_id;
        if ($userBranchId && $followupBook->branch_id && (int) $followupBook->branch_id !== (int) $userBranchId) {
            abort(403, 'غير مصرح لك بتقييم سجل خارج فرعك.');
        }

        $validated = $request->validate([
            'supervisor_rating' => 'nullable|integer|min:1|max:5',
            'supervisor_notes' => 'nullable|string|max:2000',
        ]);

        $followupBook->update([
            'supervisor_rating' => $validated['supervisor_rating'] ?? null,
            'supervisor_notes' => $validated['supervisor_notes'] ?? null,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        if ($followupBook->teacher_id) {
            $followupBook->loadMissing(['subject:id,name']);
            $subjectName = $followupBook->subject?->name ?? 'المادة';
            $dateLabel = $followupBook->date instanceof Carbon
                ? $followupBook->date->format('Y-m-d')
                : substr((string) $followupBook->date, 0, 10);

            $detailsParts = array_filter([
                !empty($validated['supervisor_rating']) ? "التقييم: {$validated['supervisor_rating']}/5" : null,
                !empty($validated['supervisor_notes']) ? "الملاحظات: {$validated['supervisor_notes']}" : null,
            ]);
            $details = !empty($detailsParts) ? ' (' . implode(' - ', $detailsParts) . ')' : '.';

            (new NotificationService())->sendInternalNotification(
                (int) $followupBook->teacher_id,
                'مراجعة دفتر المتابعة من التوجيه',
                "تمت مراجعة دفتر المتابعة لمادة ({$subjectName}) بتاريخ {$dateLabel}{$details}",
                'followup_review',
                auth()->id()
            );
        }

        return back()->with('success', 'تم حفظ تقييم وملاحظات الموجه بنجاح.');
    }

    public function destroy(FollowupBook $followupBook)
    {
        $this->authorizeManage();

        $userBranchId = auth()->user()?->branch_id;
        if ($userBranchId && $followupBook->branch_id && (int) $followupBook->branch_id !== (int) $userBranchId) {
            abort(403, 'غير مصرح لك بحذف سجل خارج فرعك.');
        }

        $followupBook->deleteStoredAttachments();
        $followupBook->delete();

        return back()->with('success', 'تم حذف سجل دفتر المتابعة بنجاح.');
    }
}
