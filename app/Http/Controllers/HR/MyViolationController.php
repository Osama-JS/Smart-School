<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeViolation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MyViolationController extends Controller
{
    public function index(Request $request)
    {
        $activeYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');

        $query = EmployeeViolation::with('violationType')
            ->where('user_id', Auth::id())
            ->where('academic_year_id', $activeYearId);

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

        $violations = $query->latest('violation_date')->paginate(15)->through(function ($violation) {
            return [
                'id' => $violation->id,
                'violation_date' => $violation->violation_date->format('Y-m-d'),
                'violation_type' => $violation->violationType,
                'details' => $violation->details,
                'action_taken' => $violation->action_taken,
                'employee_signature' => $violation->employee_signature,
                'admin_signature' => $violation->admin_signature,
                'employee_signature_url' => $violation->employee_signature_url,
                'admin_signature_url' => $violation->admin_signature_url,
                'attachment_url' => $violation->attachment_url,
                'attachment_path' => $violation->attachment_path,
            ];
        });

        $types = \App\Models\ViolationType::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('HR/MyViolations/Index', [
            'violations' => $violations,
            'types' => $types,
            'filters' => $request->only(['violation_type_id', 'start_date', 'end_date', 'status']),
        ]);
    }

    public function sign(Request $request, EmployeeViolation $violation)
    {
        if ($violation->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'employee_signature' => 'required|string', // Base64 image
        ]);

        if (Str::startsWith($request->employee_signature, 'data:image')) {
            $violation->employee_signature = $this->saveBase64Signature($request->employee_signature, 'employee');
            $violation->save();
        }

        return back()->with('success', 'تم التوقيع على المخالفة بنجاح.');
    }

    private function saveBase64Signature($base64String, $prefix)
    {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            return null;
        }
        $base64String = substr($base64String, strpos($base64String, ',') + 1);
        $type = strtolower($type[1]); // jpg, png, webp
        $base64String = base64_decode($base64String);
        $fileName = 'violations/signatures/' . $prefix . '_' . uniqid() . '.' . $type;
        Storage::disk('public')->put($fileName, $base64String);
        return $fileName;
    }
}
