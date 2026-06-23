<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ClassroomVisit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class ClassroomVisitController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض زياراتي الصفية', only: ['index', 'sign']),
        ];
    }

    public function index(Request $request)
    {
        // عرض زيارات المعلم فقط
        $visits = ClassroomVisit::with(['supervisor', 'grade', 'division'])
            ->where('teacher_id', Auth::id())
            ->latest('visit_date')
            ->paginate(15);

        return Inertia::render('Teacher/ClassroomVisits/Index', [
            'visits' => $visits
        ]);
    }

    public function sign(Request $request, ClassroomVisit $classroomVisit)
    {
        // التحقق أن الزيارة تخص المعلم
        if ($classroomVisit->teacher_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'teacher_signature' => 'required|string', // Base64
        ]);

        if ($request->filled('teacher_signature') && str_starts_with($request->teacher_signature, 'data:image')) {
            if ($classroomVisit->teacher_signature) {
                Storage::disk('public')->delete($classroomVisit->teacher_signature);
            }
            $imageParts = explode(";base64,", $request->teacher_signature);
            if (count($imageParts) == 2) {
                $imageTypeAux = explode("image/", $imageParts[0]);
                $imageType = $imageTypeAux[1];
                $imageBase64 = base64_decode($imageParts[1]);
                $fileName = 'signatures/visits_teacher_' . time() . '_' . uniqid() . '.' . $imageType;
                Storage::disk('public')->put($fileName, $imageBase64);
                $classroomVisit->teacher_signature = $fileName;
                $classroomVisit->save();
            }
        }

        return back()->with('success', 'تم التوقيع على الزيارة الصفية بنجاح.');
    }
}
