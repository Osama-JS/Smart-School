<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\SubjectGradeSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubjectGradeSettingController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:إدارة المواد الدراسية', only: ['index', 'store']),
        ];
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير النظام';

        $query = Subject::with('branch');

        if (!$isAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        $subjects = $query->get();
        $settings = SubjectGradeSetting::whereIn('subject_id', $subjects->pluck('id'))->get()->keyBy('subject_id');

        return Inertia::render('Academic/Subjects/GradeSettings', [
            'subjects' => $subjects,
            'settings' => $settings,
            'isAdmin'  => $isAdmin,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->role && $user->role->name === 'مدير النظام';

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.subject_id' => 'required|exists:subjects,id',
            'settings.*.criteria_weights' => 'required|array',
            'settings.*.criteria_weights.*.name' => 'required|string|max:100',
            'settings.*.criteria_weights.*.max_score' => 'required|numeric|min:0',
        ]);

        foreach ($validated['settings'] as $settingData) {
            $subject = Subject::find($settingData['subject_id']);
            
            if (!$isAdmin && $subject->branch_id !== $user->branch_id) {
                continue;
            }

            SubjectGradeSetting::updateOrCreate(
                ['subject_id' => $subject->id],
                ['criteria_weights' => $settingData['criteria_weights']]
            );
        }

        return redirect()->back()->with('success', 'تم حفظ إعدادات الدرجات بنجاح');
    }
}
