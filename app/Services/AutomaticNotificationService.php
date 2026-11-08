<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\LessonPreparation;
use App\Models\StudentPledge;
use App\Models\EmployeeRequest;
use App\Models\EmployeeAchievement;
use App\Models\EmployeeViolation;
use App\Models\Meeting;
use Illuminate\Support\Facades\Log;

class AutomaticNotificationService
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * التحقق مما إذا كان نوع الإشعار مفعلاً وقناته محددة من قبل المدير
     */
    public function canSend(string $eventKey, string $channel): bool
    {
        $enabled = Setting::get("auto_notify_{$eventKey}_enabled", true);
        if (!$enabled) {
            return false;
        }

        $channelsRaw = Setting::get("auto_notify_{$eventKey}_channels", '["firebase","in_app"]');
        $channels = is_array($channelsRaw) ? $channelsRaw : (json_decode($channelsRaw, true) ?? ['firebase', 'in_app']);

        return in_array($channel, $channels);
    }

    /**
     * 1. إشعار إضافة واجب منزلي جديد (للطلاب وأولياء أمورهم)
     */
    public function notifyHomeworkPublished(LessonPreparation $preparation): void
    {
        if (empty($preparation->homework) || !$preparation->division_id) {
            return;
        }

        $sendFirebase = $this->canSend('homework', 'firebase');
        $sendInApp    = $this->canSend('homework', 'in_app');

        if (!$sendFirebase && !$sendInApp) {
            return;
        }

        try {
            $enrollments = Enrollment::with(['student.user', 'student.parents'])
                ->where('division_id', $preparation->division_id)
                ->where('status', 'active')
                ->get();

            if ($enrollments->isEmpty()) {
                $enrollments = Enrollment::with(['student.user', 'student.parents'])
                    ->where('division_id', $preparation->division_id)
                    ->get();
            }

            $subjectName = $preparation->subject ? $preparation->subject->name : 'المادة الدراسية';
            $lessonTitle = $preparation->lesson_title ?? 'درس جديد';
            $title = "📚 واجب منزلي جديد: {$subjectName}";
            $body  = "تم تحديد واجب في درس ({$lessonTitle}): " . \Illuminate\Support\Str::limit($preparation->homework, 90);

            $targetUserIds = [];
            $sentUsers = [];

            foreach ($enrollments as $enrollment) {
                $student = $enrollment->student;
                if (!$student) continue;

                // إشعار الطالب
                if ($student->user && !isset($sentUsers[$student->user->id])) {
                    $sentUsers[$student->user->id] = true;
                    $targetUserIds[] = $student->user->id;

                    if ($sendFirebase) {
                        $this->notificationService->sendFirebaseNotification($student->user, $title, $body, [
                            'type' => 'homework',
                            'preparation_id' => $preparation->id,
                        ]);
                    }
                }

                // إشعار أولياء الأمور المرتبطين بالطالب
                foreach ($student->parents as $parent) {
                    if (!isset($sentUsers[$parent->id])) {
                        $sentUsers[$parent->id] = true;
                        $targetUserIds[] = $parent->id;

                        if ($sendFirebase) {
                            $parentBody = "تم إضافة واجب جديد لابنكم ({$student->user->name}) في مادة {$subjectName}: " . \Illuminate\Support\Str::limit($preparation->homework, 70);
                            $this->notificationService->sendFirebaseNotification($parent, $title, $parentBody, [
                                'type' => 'homework',
                                'student_id' => $student->id,
                                'preparation_id' => $preparation->id,
                            ]);
                        }
                    }
                }
            }

            // حفظ إشعار في قاعدة البيانات (In-App)
            if ($sendInApp && !empty($targetUserIds)) {
                $this->notificationService->sendBroadcastNotification(
                    $title,
                    $body,
                    'homework',
                    $preparation->teacher_id,
                    $preparation->branch_id,
                    'users',
                    null,
                    $targetUserIds
                );
            }
        } catch (\Exception $e) {
            Log::error('AutomaticNotificationService::notifyHomeworkPublished failed: ' . $e->getMessage());
        }
    }

    /**
     * 2. إشعار غياب أو تأخر طالب لولي أمره فور رصد الحضور
     */
    public function notifyStudentAbsenceOrLate(Student $student, string $status, string $date, ?string $subjectName = null, ?string $period = null): void
    {
        $statusKey = in_array(strtolower($status), ['late', 'متأخر']) ? 'late' : 'absent';
        
        $sendFirebase = $this->canSend('attendance', 'firebase');
        $sendInApp    = $this->canSend('attendance', 'in_app');

        if (!$sendFirebase && !$sendInApp) {
            return;
        }

        try {
            $student->loadMissing(['user', 'parents']);
            $studentName = $student->user?->name ?? 'ابنكم';

            if ($statusKey === 'late') {
                $title = "⏰ تنبيه تأخر: {$studentName}";
                $body  = "نود إحاطتكم بأنه تم تسجيل تأخر الطالب ({$studentName}) بتاريخ {$date}" . ($period ? " (الحصة: {$period})" : "") . ".";
            } else {
                $title = "⚠️ تنبيه غياب: {$studentName}";
                $body  = "نود إحاطتكم بأنه تم تسجيل غياب الطالب ({$studentName}) بتاريخ {$date}" . ($subjectName ? " لمادة {$subjectName}" : "") . ". يرجى التواصل مع إدارة المدرسة إذا كان هناك عذر مسبق.";
            }

            foreach ($student->parents as $parent) {
                if ($sendFirebase) {
                    $this->notificationService->sendFirebaseNotification($parent, $title, $body, [
                        'type' => 'attendance_alert',
                        'student_id' => $student->id,
                        'status' => $statusKey,
                        'date' => $date,
                    ]);
                }

                if ($sendInApp) {
                    $this->notificationService->sendInternalNotification(
                        $parent->id,
                        $title,
                        $body,
                        'attendance_alert',
                        auth()->id()
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error('AutomaticNotificationService::notifyStudentAbsenceOrLate failed: ' . $e->getMessage());
        }
    }

    /**
     * 3. إشعار صدور تعهد أو مخالفة سلوكية للطالب (لولي الأمر والطالب)
     */
    public function notifyStudentPledge(StudentPledge $pledge): void
    {
        $sendFirebase = $this->canSend('student_pledge', 'firebase');
        $sendInApp    = $this->canSend('student_pledge', 'in_app');

        if (!$sendFirebase && !$sendInApp) {
            return;
        }

        try {
            $pledge->loadMissing(['student.user', 'student.parents']);
            $student = $pledge->student;
            if (!$student) return;

            $studentName = $student->user?->name ?? 'الطالب';
            $title = "📋 إشعار تعهد سلوكي: {$studentName}";
            $body  = "تم إصدار تعهد سلوكي للطالب ({$studentName})، يرجى الاطلاع عليه وتوقيع تأكيد العلم من خلال التطبيق.";

            // إرسال لولي الأمر
            foreach ($student->parents as $parent) {
                if ($sendFirebase) {
                    $this->notificationService->sendFirebaseNotification($parent, $title, $body, [
                        'type' => 'pledge',
                        'pledge_id' => $pledge->id,
                        'student_id' => $student->id,
                    ]);
                }
                if ($sendInApp) {
                    $this->notificationService->sendInternalNotification(
                        $parent->id,
                        $title,
                        $body,
                        'pledge',
                        auth()->id()
                    );
                }
            }

            // إرسال للطالب نفسه
            if ($student->user) {
                if ($sendFirebase) {
                    $this->notificationService->sendFirebaseNotification($student->user, $title, $body, [
                        'type' => 'pledge',
                        'pledge_id' => $pledge->id,
                    ]);
                }
                if ($sendInApp) {
                    $this->notificationService->sendInternalNotification(
                        $student->user->id,
                        $title,
                        $body,
                        'pledge',
                        auth()->id()
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error('AutomaticNotificationService::notifyStudentPledge failed: ' . $e->getMessage());
        }
    }

    /**
     * 4. إشعار تقديم طلب جديد من موظف (لإدارة الفرع ومسؤول HR)
     */
    public function notifyNewEmployeeRequest(EmployeeRequest $request): void
    {
        $sendFirebase = $this->canSend('employee_request_new', 'firebase');
        $sendInApp    = $this->canSend('employee_request_new', 'in_app');
        $sendEmail    = $this->canSend('employee_request_new', 'email');

        if (!$sendFirebase && !$sendInApp && !$sendEmail) {
            return;
        }

        try {
            $request->loadMissing('employee.user');
            $employeeName = $request->employee?->user?->name ?? 'أحد الموظفين';
            $typeAr = EmployeeRequest::TYPES[$request->type] ?? 'طلب إداري';

            $title = "📥 طلب جديد بانتظار الاعتماد: {$typeAr}";
            $body  = "قدّم الموظف ({$employeeName}) طلب ({$typeAr}) بانتظار مراجعتكم واعتماده.";

            // البحث عن مدراء الفرع ومسؤولي الـ HR للفرع
            $managers = User::where('branch_id', $request->branch_id)
                ->whereHas('role', function($q) {
                    $q->whereIn('name', ['مدير الفرع', 'مدير الموارد البشرية', 'مسؤول الموارد البشرية', 'مدير النظام']);
                })->get();

            if ($managers->isEmpty()) {
                $managers = User::whereHas('role', function($q) {
                    $q->whereIn('name', ['مدير الفرع', 'مدير النظام']);
                })->get();
            }

            foreach ($managers as $mgr) {
                if ($sendFirebase) {
                    $this->notificationService->sendFirebaseNotification($mgr, $title, $body, [
                        'type' => 'employee_request',
                        'request_id' => $request->id,
                    ]);
                }
                if ($sendInApp) {
                    $this->notificationService->sendInternalNotification(
                        $mgr->id,
                        $title,
                        $body,
                        'employee_request',
                        $request->employee?->user_id
                    );
                }
                if ($sendEmail && $mgr->email) {
                    $this->notificationService->sendEmailNotification(
                        $mgr,
                        $title,
                        $body,
                        'مراجعة الطلب',
                        url('/hr/requests')
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error('AutomaticNotificationService::notifyNewEmployeeRequest failed: ' . $e->getMessage());
        }
    }

    /**
     * 5. إشعار نتيجة طلب الموظف (اعتماد / رفض للموظف)
     */
    public function notifyEmployeeRequestDecision(EmployeeRequest $request, string $decision, ?string $notes = null): void
    {
        $sendFirebase = $this->canSend('employee_request_decision', 'firebase');
        $sendInApp    = $this->canSend('employee_request_decision', 'in_app');
        $sendEmail    = $this->canSend('employee_request_decision', 'email');

        if (!$sendFirebase && !$sendInApp && !$sendEmail) {
            return;
        }

        try {
            $request->loadMissing('employee.user');
            $user = $request->employee?->user;
            if (!$user) return;

            $statusAr = ($decision === 'approved' || $decision === 'معتمد') ? 'اعتماد' : 'رفض';
            $typeAr   = EmployeeRequest::TYPES[$request->type] ?? 'الطلب';

            $title = "🔔 تحديث حالة {$typeAr}";
            $body  = "تم {$statusAr} {$typeAr} الخاص بك من قبل الإدارة.";
            if ($notes) {
                $body .= " (ملاحظات: {$notes})";
            }

            if ($sendFirebase) {
                $this->notificationService->sendFirebaseNotification($user, $title, $body, [
                    'type' => 'leave_request',
                    'request_id' => $request->id,
                    'status' => $decision,
                ]);
            }

            if ($sendInApp) {
                $this->notificationService->sendInternalNotification(
                    $user->id,
                    $title,
                    $body,
                    'leave_request',
                    auth()->id()
                );
            }

            if ($sendEmail && $user->email) {
                $this->notificationService->sendEmailNotification(
                    $user,
                    $title,
                    $body,
                    'عرض تفاصيل الطلب',
                    url('/hr/my-requests')
                );
            }
        } catch (\Exception $e) {
            Log::error('AutomaticNotificationService::notifyEmployeeRequestDecision failed: ' . $e->getMessage());
        }
    }

    /**
     * 6. إشعار تسجيل إنجاز للموظف
     */
    public function notifyEmployeeAchievement(EmployeeAchievement $achievement): void
    {
        $sendFirebase = $this->canSend('employee_achievement', 'firebase');
        $sendInApp    = $this->canSend('employee_achievement', 'in_app');

        if (!$sendFirebase && !$sendInApp) {
            return;
        }

        try {
            $achievement->loadMissing(['user', 'achievementType']);
            $user = $achievement->user;
            if (!$user) return;

            $typeName = $achievement->achievementType?->name ?? 'إنجاز متميز';
            $points   = $achievement->points ?? 0;

            $title = "🎖️ إنجاز جديد: {$typeName}";
            $body  = "مبارك! تم منحك ({$points}) نقطة تقديراً لجهودك وعطائك المتميز في المدرسة.";

            if ($sendFirebase) {
                $this->notificationService->sendFirebaseNotification($user, $title, $body, [
                    'type' => 'achievement',
                    'achievement_id' => $achievement->id,
                    'url' => '/hr/my-achievements',
                ]);
            }

            if ($sendInApp) {
                $this->notificationService->sendInternalNotification(
                    $user->id,
                    $title,
                    $body,
                    'achievement',
                    auth()->id()
                );
            }
        } catch (\Exception $e) {
            Log::error('AutomaticNotificationService::notifyEmployeeAchievement failed: ' . $e->getMessage());
        }
    }

    /**
     * 7. إشعار تسجيل مخالفة إدارية للموظف
     */
    public function notifyEmployeeViolation(EmployeeViolation $violation): void
    {
        $sendFirebase = $this->canSend('employee_violation', 'firebase');
        $sendInApp    = $this->canSend('employee_violation', 'in_app');

        if (!$sendFirebase && !$sendInApp) {
            return;
        }

        try {
            $violation->loadMissing(['user', 'violationType']);
            $user = $violation->user;
            if (!$user) return;

            $typeName = $violation->violationType?->name ?? 'مخالفة إدارية';
            $date     = $violation->violation_date ?? date('Y-m-d');

            $title = "⚠️ إشعار إداري: {$typeName}";
            $body  = "نود إحاطتكم بأنه تم تسجيل إشعار إداري بتاريخ {$date}، يرجى مراجعته وتأكيد العلم عبر التطبيق.";

            if ($sendFirebase) {
                $this->notificationService->sendFirebaseNotification($user, $title, $body, [
                    'type' => 'violation',
                    'violation_id' => $violation->id,
                    'url' => '/hr/my-violations',
                ]);
            }

            if ($sendInApp) {
                $this->notificationService->sendInternalNotification(
                    $user->id,
                    $title,
                    $body,
                    'violation',
                    auth()->id()
                );
            }
        } catch (\Exception $e) {
            Log::error('AutomaticNotificationService::notifyEmployeeViolation failed: ' . $e->getMessage());
        }
    }

    /**
     * 8. إشعار دعوة لاجتماع مدرسي للموظفين
     */
    public function notifyMeetingScheduled(Meeting $meeting, array $participantUserIds): void
    {
        $sendFirebase = $this->canSend('meeting', 'firebase');
        $sendInApp    = $this->canSend('meeting', 'in_app');
        $sendEmail    = $this->canSend('meeting', 'email');

        if (!$sendFirebase && !$sendInApp && !$sendEmail) {
            return;
        }

        try {
            $title = "📅 دعوة لاجتماع جديد: {$meeting->title}";
            $body  = "تمت دعوتكم لحضور اجتماع بتاريخ {$meeting->date} الساعة {$meeting->time}. يرجى تأكيد حضوركم عبر التطبيق.";

            $users = User::whereIn('id', $participantUserIds)->get();

            foreach ($users as $participant) {
                if ($sendFirebase) {
                    $this->notificationService->sendFirebaseNotification($participant, $title, $body, [
                        'type' => 'meeting',
                        'meeting_id' => $meeting->id,
                        'url' => '/meetings/' . $meeting->id,
                    ]);
                }

                if ($sendInApp) {
                    $this->notificationService->sendInternalNotification(
                        $participant->id,
                        $title,
                        $body,
                        'meeting',
                        auth()->id()
                    );
                }

                if ($sendEmail && $participant->email) {
                    $this->notificationService->sendEmailNotification(
                        $participant,
                        $title,
                        $body,
                        'تفاصيل الاجتماع',
                        url('/meetings/' . $meeting->id)
                    );
                }
            }
        } catch (\Exception $e) {
            Log::error('AutomaticNotificationService::notifyMeetingScheduled failed: ' . $e->getMessage());
        }
    }
}

