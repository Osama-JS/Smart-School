<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\User;
use App\Models\MeetingParticipant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use App\Mail\MeetingInvitationMail;

class MeetingController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
        public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض الاجتماعات', only: ['index', 'show']),
            new \Illuminate\Routing\Controllers\Middleware('permission:إضافة اجتماع', only: ['create', 'store']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تعديل اجتماع', only: ['edit', 'update']),
            new \Illuminate\Routing\Controllers\Middleware('permission:حذف اجتماع', only: ['destroy']),
            new \Illuminate\Routing\Controllers\Middleware('permission:تحضير الاجتماع', only: ['updateAttendance', 'completeMeeting']),
        ];
    }
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير الفرع', 'مدير النظام']);
        $branchId = $isAdmin ? session('active_branch_id', $user->branch_id) : $user->branch_id;

        // Fetch meetings for the branch (BelongsToBranch scope will handle this if applied, but let's be explicit)
        $query = Meeting::with(['supervisor', 'participants.user'])
            ->where(function($q) use ($branchId) {
                if ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                }
            });

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $meetings = $query->orderBy('date', 'desc')->orderBy('time', 'desc')->paginate(10)->withQueryString();

        // Get users in the same branch for invitations
        $users = User::with('employee.jobGrade')->where(function($q) use ($branchId) {
                if ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                }
            })->where('id', '!=', $user->id)
            ->where('is_active', 1)
            ->get(['id', 'name']);

        return Inertia::render('HR/Meetings/Index', [
            'meetings' => $meetings,
            'users' => $users,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'total' => (clone $query)->count(),
                'scheduled' => (clone $query)->where('status', 'scheduled')->count(),
                'completed' => (clone $query)->where('status', 'completed')->count(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|date_format:H:i',
            'type' => 'required|in:in_person,online',
            'agendas' => 'required|array|min:1',
            'agendas.*' => 'required|string',
            'participants' => 'required|array|min:1',
            'participants.*' => 'exists:users,id',
            'notification_channels' => 'nullable|array',
            'notification_channels.*' => 'in:system,mail,firebase'
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير الفرع', 'مدير النظام']);
        $branchId = $isAdmin ? session('active_branch_id', $user->branch_id) : $user->branch_id;

        $meeting = Meeting::create([
            'branch_id' => $branchId,
            'supervisor_id' => $user->id,
            'title' => $validated['title'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'type' => $validated['type'],
            'status' => 'scheduled',
            'agendas' => $validated['agendas'],
        ]);

        $channels = $validated['notification_channels'] ?? [];
        $notificationService = new \App\Services\NotificationService();
        $meetingUrl = url('/meetings/' . $meeting->id); // Assuming this route exists or they can view it in their dashboard

        foreach ($validated['participants'] as $participantId) {
            $meeting->participants()->create([
                'user_id' => $participantId,
                'attendance_status' => 'pending',
            ]);
            
            $participantUser = User::find($participantId);
            if ($participantUser) {
                $title = "دعوة لاجتماع جديد: {$meeting->title}";
                $message = "تمت دعوتك لحضور اجتماع بتاريخ {$meeting->date} الساعة {$meeting->time}. يرجى تأكيد حضورك.";

                try {
                    if (in_array('system', $channels)) {
                        $notificationService->sendInternalNotification(
                            $participantUser->id,
                            $title,
                            $message,
                            'meeting',
                            $user->id
                        );
                    }

                    if (in_array('mail', $channels) && $participantUser->email) {
                        Mail::to($participantUser->email)->queue(new MeetingInvitationMail($meeting));
                    }

                    if (in_array('firebase', $channels)) {
                        $notificationService->sendFirebaseNotification(
                            $participantUser,
                            $title,
                            $message,
                            ['type' => 'meeting', 'url' => '/meetings/' . $meeting->id]
                        );
                    }
                } catch (\Exception $e) {
                    \Log::error('Failed to send meeting notification: ' . $e->getMessage());
                }
            }
        }

        return redirect()->back()->with('success', 'تم إنشاء الاجتماع وإرسال الدعوات بنجاح');
    }

    public function show(Meeting $meeting)
    {
        $meeting->load(['supervisor', 'participants.user.employee.jobGrade']);
        
        $user = auth()->user();
        $isSupervisor = $user->id === $meeting->supervisor_id;
        $isParticipant = $meeting->participants->contains('user_id', $user->id);

        if (!$isSupervisor && !$isParticipant) {
            abort(403, 'غير مصرح لك بمشاهدة هذا الاجتماع');
        }

        $users = \App\Models\User::with('employee.jobGrade')->get();

        return Inertia::render('HR/Meetings/Show', [
            'meeting' => $meeting,
            'isSupervisor' => $isSupervisor,
            'users' => $users
        ]);
    }

    public function updateAttendance(Request $request, Meeting $meeting)
    {
        if (auth()->id() !== $meeting->supervisor_id) {
            abort(403);
        }

        $validated = $request->validate([
            'participants' => 'required|array',
            'participants.*.id' => 'required|exists:meeting_participants,id',
            'participants.*.status' => 'required|in:attended,absent,pending',
        ]);

        foreach ($validated['participants'] as $participantData) {
            MeetingParticipant::where('id', $participantData['id'])
                ->where('meeting_id', $meeting->id)
                ->update(['attendance_status' => $participantData['status']]);
        }

        return redirect()->back()->with('success', 'تم تحديث حالة الحضور');
    }

    public function completeMeeting(Request $request, Meeting $meeting)
    {
        if (auth()->id() !== $meeting->supervisor_id) {
            abort(403);
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

        return redirect()->back()->with('success', 'تم إنهاء الاجتماع وحفظ المخرجات');
    }

    public function update(Request $request, Meeting $meeting)
    {
        if (auth()->id() !== $meeting->supervisor_id) {
            abort(403);
        }

        $dateStr = $meeting->date instanceof \Carbon\Carbon ? $meeting->date->format('Y-m-d') : \Carbon\Carbon::parse($meeting->date)->format('Y-m-d');
        $timeStr = $meeting->time instanceof \Carbon\Carbon ? $meeting->time->format('H:i') : \Carbon\Carbon::parse($meeting->time)->format('H:i');
        $meetingDateTime = \Carbon\Carbon::parse($dateStr . ' ' . $timeStr);
        $isPast = $meetingDateTime->isPast() && $meeting->status === 'scheduled';

        if ($meetingDateTime->isPast() && $meeting->status !== 'scheduled') {
            return redirect()->back()->with('error', 'لا يمكن تعديل أو إعادة جدولة اجتماع مكتمل أو ملغى.');
        }

        $validated = $request->validate([
            'title' => $isPast ? 'nullable' : 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|date_format:H:i',
            'type' => $isPast ? 'nullable' : 'required|in:in_person,online',
            'agendas' => $isPast ? 'nullable' : 'required|array|min:1',
            'agendas.*' => $isPast ? 'nullable' : 'required|string',
            'participants' => $isPast ? 'nullable' : 'required|array|min:1',
            'participants.*' => $isPast ? 'nullable' : 'exists:users,id',
            'notification_channels' => 'nullable|array',
            'notification_channels.*' => 'in:system,mail,firebase'
        ]);

        $valDateStr = \Carbon\Carbon::parse($validated['date'])->format('Y-m-d');
        $valTimeStr = \Carbon\Carbon::parse($validated['time'])->format('H:i');
        $newMeetingDateTime = \Carbon\Carbon::parse($valDateStr . ' ' . $valTimeStr);
        
        $validated['date'] = $valDateStr;
        $validated['time'] = $valTimeStr;

        if ($isPast && $newMeetingDateTime->isPast()) {
            return redirect()->back()->with('error', 'يجب اختيار تاريخ ووقت في المستقبل لإعادة جدولة الاجتماع المنقضي.');
        }

        $notificationService = new \App\Services\NotificationService();
        $channels = $validated['notification_channels'] ?? ['system'];

        if ($isPast) {
            // Only update date and time for past meetings (Reschedule)
            $meeting->update([
                'date' => $validated['date'],
                'time' => $validated['time'],
            ]);

            // Notify participants about reschedule
            $existingParticipantIds = $meeting->participants()->pluck('user_id')->toArray();
            foreach ($existingParticipantIds as $userId) {
                $user = \App\Models\User::find($userId);
                if ($user) {
                    if (in_array('system', $channels)) {
                        $notificationService->sendInternalNotification(
                            $user->id,
                            "إعادة جدولة اجتماع: {$meeting->title}",
                            "تم إعادة جدولة الاجتماع ليكون في تاريخ {$validated['date']} الساعة {$validated['time']}.",
                            'meeting_rescheduled',
                            auth()->id()
                        );
                    }
                    if (in_array('firebase', $channels)) {
                        $notificationService->sendFirebaseNotification(
                            $user,
                            "إعادة جدولة اجتماع: {$meeting->title}",
                            "تم إعادة جدولة الاجتماع ليكون في تاريخ {$validated['date']} الساعة {$validated['time']}.",
                            ['type' => 'meeting_rescheduled', 'url' => '/meetings/' . $meeting->id]
                        );
                    }
                }
            }

            return redirect()->route('meetings.index')->with('success', 'تم إعادة جدولة الاجتماع بنجاح');
        }

        // Normal update logic for future meetings
        $meeting->update([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'type' => $validated['type'],
            'agendas' => $validated['agendas'],
        ]);

        $existingParticipantIds = $meeting->participants()->pluck('user_id')->toArray();
        $newParticipantIds = $validated['participants'];
        
        $toAdd = array_diff($newParticipantIds, $existingParticipantIds);
        $toRemove = array_diff($existingParticipantIds, $newParticipantIds);

        // Notify and Add new
        foreach ($toAdd as $userId) {
            \App\Models\MeetingParticipant::create([
                'meeting_id' => $meeting->id,
                'user_id' => $userId,
                'attendance_status' => 'pending'
            ]);

            $user = \App\Models\User::find($userId);
            if ($user) {
                if (in_array('system', $channels)) {
                    $notificationService->sendInternalNotification(
                        $user->id,
                        "دعوة لاجتماع جديد: {$meeting->title}",
                        "لقد تمت إضافتك لاجتماع مجدول بتاريخ {$meeting->date} الساعة {$meeting->time}.",
                        'meeting_invitation',
                        auth()->id()
                    );
                }
                if (in_array('firebase', $channels)) {
                    $notificationService->sendFirebaseNotification(
                        $user,
                        "دعوة لاجتماع جديد: {$meeting->title}",
                        "تمت دعوتك لاجتماع جديد، يرجى مراجعة التفاصيل.",
                        ['type' => 'meeting_invitation', 'url' => '/meetings/' . $meeting->id]
                    );
                }
            }
        }

        // Notify removed participants of cancellation
        if (count($toRemove) > 0) {
            foreach ($toRemove as $userId) {
                $user = \App\Models\User::find($userId);
                if ($user) {
                    if (in_array('system', $channels)) {
                        $notificationService->sendInternalNotification(
                            $user->id,
                            "إلغاء دعوة لاجتماع: {$meeting->title}",
                            "لقد تم إعفائك من حضور الاجتماع المجدول بتاريخ {$meeting->date} الساعة {$meeting->time}.",
                            'meeting_cancelled',
                            auth()->id()
                        );
                    }
                    if (in_array('firebase', $channels)) {
                        $notificationService->sendFirebaseNotification(
                            $user,
                            "إلغاء دعوة لاجتماع: {$meeting->title}",
                            "تم إعفائك من حضور الاجتماع.",
                            ['type' => 'meeting_cancelled', 'url' => '/meetings']
                        );
                    }
                }
            }
            \App\Models\MeetingParticipant::where('meeting_id', $meeting->id)->whereIn('user_id', $toRemove)->delete();
        }

        return redirect()->back()->with('success', 'تم تعديل تفاصيل الاجتماع بنجاح');
    }

    public function destroy(Request $request, Meeting $meeting)
    {
        if (auth()->id() !== $meeting->supervisor_id) {
            abort(403);
        }

        $dateStr = $meeting->date instanceof \Carbon\Carbon ? $meeting->date->format('Y-m-d') : \Carbon\Carbon::parse($meeting->date)->format('Y-m-d');
        $timeStr = $meeting->time instanceof \Carbon\Carbon ? $meeting->time->format('H:i') : \Carbon\Carbon::parse($meeting->time)->format('H:i');
        $meetingDateTime = \Carbon\Carbon::parse($dateStr . ' ' . $timeStr);
        if ($meetingDateTime->isPast()) {
            return redirect()->back()->with('error', 'لا يمكن حذف اجتماع قد حان موعده أو مضى.');
        }

        $channels = $request->input('notification_channels', ['system']);
        
        // Send cancellation to participants
        $notificationService = new \App\Services\NotificationService();
        $title = "إلغاء اجتماع: {$meeting->title}";
        $message = "تم إلغاء الاجتماع الذي كان مقرراً بتاريخ {$meeting->date} الساعة {$meeting->time}.";

        foreach ($meeting->participants as $participant) {
            if ($participant->user) {
                if (in_array('system', $channels)) {
                    $notificationService->sendInternalNotification(
                        $participant->user->id,
                        $title,
                        $message,
                        'meeting_cancelled',
                        auth()->id()
                    );
                }
                
                if (in_array('firebase', $channels)) {
                    $notificationService->sendFirebaseNotification(
                        $participant->user,
                        $title,
                        $message,
                        ['type' => 'meeting_cancelled']
                    );
                }
            }
        }

        $meeting->delete();
        return redirect()->route('meetings.index')->with('success', 'تم حذف الاجتماع وإشعار المدعوين');
    }

    public function remindParticipants(Request $request, Meeting $meeting)
    {
        if (auth()->id() !== $meeting->supervisor_id) {
            abort(403);
        }

        $validated = $request->validate([
            'reminder_type' => 'required|string|in:now,5_minutes,15_minutes,custom',
            'custom_message' => 'nullable|string',
            'notification_channels' => 'nullable|array',
            'notification_channels.*' => 'in:system,mail,firebase'
        ]);

        $channels = $validated['notification_channels'] ?? ['system'];
        $notificationService = new \App\Services\NotificationService();
        $user = auth()->user();

        $message = '';
        if ($validated['reminder_type'] === 'now') {
            $message = "الاجتماع ({$meeting->title}) بدأ الآن، يرجى الانضمام.";
        } elseif ($validated['reminder_type'] === '5_minutes') {
            $message = "تذكير: الاجتماع ({$meeting->title}) سيبدأ بعد 5 دقائق.";
        } elseif ($validated['reminder_type'] === '15_minutes') {
            $message = "تذكير: الاجتماع ({$meeting->title}) سيبدأ بعد 15 دقيقة.";
        } else {
            $message = $validated['custom_message'] ?? "تذكير بخصوص الاجتماع ({$meeting->title}).";
        }

        $title = "تذكير باجتماع: {$meeting->title}";

        foreach ($meeting->participants as $participant) {
            if ($participant->user) {
                try {
                    if (in_array('system', $channels)) {
                        $notificationService->sendInternalNotification(
                            $participant->user->id,
                            $title,
                            $message,
                            'meeting_reminder',
                            $user->id
                        );
                    }

                    if (in_array('mail', $channels) && $participant->user->email) {
                        \Illuminate\Support\Facades\Mail::to($participant->user->email)->queue(new \App\Mail\SystemNotificationMail(
                            $participant->user,
                            $title,
                            $message,
                            'عرض تفاصيل الاجتماع',
                            url('/meetings/' . $meeting->id)
                        ));
                    }

                    if (in_array('firebase', $channels)) {
                        $notificationService->sendFirebaseNotification(
                            $participant->user,
                            $title,
                            $message,
                            ['type' => 'meeting_reminder', 'url' => '/meetings/' . $meeting->id]
                        );
                    }
                } catch (\Exception $e) {
                    \Log::error('Failed to send meeting reminder to user ' . $participant->user->id . ': ' . $e->getMessage());
                }
            }
        }

        return redirect()->back()->with('success', 'تم إرسال التنبيه للمدعوين بنجاح');
    }

    public function uploadAttachment(Request $request, Meeting $meeting)
    {
        if (auth()->id() !== $meeting->supervisor_id) {
            abort(403);
        }

        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('meetings/attachments', 'public');

        $attachments = $meeting->attachments ?? [];
        $attachments[] = [
            'name' => $file->getClientOriginalName(),
            'path' => $path,
            'size' => $file->getSize(),
            'type' => $file->getClientMimeType()
        ];

        $meeting->update(['attachments' => $attachments]);

        return redirect()->back()->with('success', 'تم رفع المرفق بنجاح');
    }

    public function deleteAttachment(Request $request, Meeting $meeting, $index)
    {
        if (auth()->id() !== $meeting->supervisor_id) {
            abort(403);
        }

        $attachments = $meeting->attachments ?? [];
        
        if (isset($attachments[$index])) {
            $attachment = $attachments[$index];
            \Illuminate\Support\Facades\Storage::disk('public')->delete($attachment['path']);
            unset($attachments[$index]);
            $meeting->update(['attachments' => array_values($attachments)]);
            return redirect()->back()->with('success', 'تم حذف المرفق بنجاح');
        }

        return redirect()->back()->with('error', 'المرفق غير موجود');
    }
}
