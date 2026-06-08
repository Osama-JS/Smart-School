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

class MeetingController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);
        $branchId = $isAdmin ? session('active_branch_id') : $user->branch_id;

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
        ]);

        $user = auth()->user();
        $isAdmin = $user && $user->role && in_array($user->role->name, ['مدير عام', 'مدير النظام']);
        $branchId = $isAdmin ? session('active_branch_id') : $user->branch_id;

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

        foreach ($validated['participants'] as $participantId) {
            $meeting->participants()->create([
                'user_id' => $participantId,
                'attendance_status' => 'pending',
            ]);
            
            // Send email
            $participantUser = User::find($participantId);
            if ($participantUser && $participantUser->email) {
                Mail::to($participantUser->email)->queue(new MeetingInvitationMail($meeting));
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

        return Inertia::render('HR/Meetings/Show', [
            'meeting' => $meeting,
            'isSupervisor' => $isSupervisor
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

    public function destroy(Meeting $meeting)
    {
        if (auth()->id() !== $meeting->supervisor_id) {
            abort(403);
        }

        $meeting->delete();
        return redirect()->route('meetings.index')->with('success', 'تم حذف الاجتماع');
    }
}
