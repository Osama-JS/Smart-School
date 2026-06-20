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
    public function index()
    {
        $violations = EmployeeViolation::with('violationType')
            ->where('user_id', Auth::id())
            ->latest('violation_date')
            ->paginate(15);

        return Inertia::render('HR/MyViolations/Index', [
            'violations' => $violations
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
