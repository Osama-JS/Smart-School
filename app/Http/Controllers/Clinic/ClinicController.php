<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\ClinicVisit;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClinicController extends Controller
{
    /**
     * Display the clinic dashboard.
     */
    public function index(Request $request)
    {
        $recentVisits = ClinicVisit::with(['student.user'])
            ->latest('visited_at')
            ->take(10)
            ->get()
            ->map(function ($visit) {
                // Map to what frontend expects
                return [
                    'id' => $visit->id,
                    'student_id' => $visit->student_id,
                    'visited_at' => $visit->visited_at,
                    'symptoms' => $visit->symptoms,
                    'action_taken' => $visit->action_taken,
                    'status' => $visit->status,
                    'student' => [
                        'name' => $visit->student->user->name ?? 'غير معروف',
                    ],
                ];
            });

        // Count of today's visits
        $todayVisitsCount = ClinicVisit::whereDate('visited_at', today())->count();

        return Inertia::render('Clinic/Index', [
            'recentVisits' => $recentVisits,
            'todayVisitsCount' => $todayVisitsCount,
        ]);
    }
    
    /**
     * API endpoint to search students for clinic.
     */
    public function searchStudents(Request $request)
    {
        try {
            $search = $request->query('query');
            
            if (empty($search) || mb_strlen($search) < 2) {
                return response()->json([]);
            }

            // Test if "all" is typed
            if ($search === 'all') {
                $students = Student::with(['user', 'currentEnrollment.division.grade', 'medicalRecord'])->take(5)->get();
            } else {
                $students = Student::whereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('username', 'like', "%{$search}%");
                    })
                    ->with(['user', 'currentEnrollment.division.grade', 'medicalRecord'])
                    ->take(10)
                    ->get();
            }

            $formatted = $students->map(function ($student) {
                $enrollment = $student->currentEnrollment;
                return [
                    'id' => $student->id,
                    'name' => $student->user->name ?? 'غير معروف',
                    'national_id' => $student->user->username ?? '---',
                    'grade' => $enrollment && $enrollment->division && $enrollment->division->grade ? ['name' => $enrollment->division->grade->name] : null,
                    'division' => $enrollment && $enrollment->division ? ['name' => $enrollment->division->name] : null,
                    'medical_record' => $student->medicalRecord ? clone $student->medicalRecord : null,
                ];
            });

            return response()->json($formatted);
        } catch (\Throwable $e) {
            return response()->json([
                [
                    'id' => 999999,
                    'name' => 'Error: ' . $e->getMessage() . ' line: ' . $e->getLine(),
                    'national_id' => 'ERROR',
                    'grade' => ['name' => 'Error'],
                    'division' => null,
                    'medical_record' => null
                ]
            ]);
        }
    }
}
