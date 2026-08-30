<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Division;
use App\Models\Subject;
use App\Models\SemesterResult;
use App\Models\Enrollment;
use App\Models\Semester;
use Illuminate\Support\Facades\DB;

class SemesterResultController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:إدارة الدرجات', only: ['index', 'store', 'lock']),
        ];
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $branchId = $user->branch_id;

        $academicYears = \App\Models\AcademicYear::where('branch_id', $branchId)->orderBy('start_date', 'desc')->get();
        $activeYear = \App\Models\AcademicYear::currentForBranch($branchId);

        $yearId = $request->query('academic_year_id');
        if (!$yearId && $activeYear) {
            $yearId = $activeYear->id;
        }

        $semesters = [];
        if ($yearId) {
            $semesters = Semester::where('academic_year_id', $yearId)->orderBy('start_date', 'asc')->get();
        }

        $semesterId = $request->query('semester_id');
        $semester = null;

        if ($semesterId) {
            $semester = Semester::find($semesterId);
        } else {
            if ($yearId && $activeYear && $yearId == $activeYear->id) {
                $semester = Semester::currentForYear($yearId);
            }
            if (!$semester && count($semesters) > 0) {
                $semester = $semesters->first();
            }
        }

        $divisions = Division::where('branch_id', $branchId)->with('grade')->get();
        
        $divisionId = $request->query('division_id');
        $subjectId = $request->query('subject_id');
        
        $subjects = [];
        $studentsData = [];
        $gradeSetting = null;

        if ($divisionId) {
            $division = Division::with('grade.subjects')->find($divisionId);
            if ($division && $division->grade) {
                $subjects = $division->grade->subjects;
            }
        }

        if ($divisionId && $subjectId && $semester) {
            $enrollments = Enrollment::with('student.user')
                ->where('division_id', $divisionId)
                ->where('academic_year_id', $semester->academic_year_id)
                ->where('status', 'active')
                ->get();
            
            $gradeSetting = Subject::find($subjectId);
            $aggregateMax = $gradeSetting ? (float) $gradeSetting->semester_aggregate_max : 20.0;

            // Load existing semester results
            $existingResults = SemesterResult::where('semester_id', $semester->id)
                ->where('subject_id', $subjectId)
                ->whereIn('enrollment_id', $enrollments->pluck('id'))
                ->get()->keyBy('enrollment_id');

            foreach ($enrollments as $enroll) {
                // Compute aggregate from scratch (in case months were just submitted)
                $computedAggregate = SemesterResult::computeAggregate($enroll->id, $semester->id, $subjectId, $aggregateMax);
                
                $existing = $existingResults->get($enroll->id);
                
                $studentsData[] = [
                    'enrollment_id' => $enroll->id,
                    'student_name' => $enroll->student->user->name,
                    'student_username' => $enroll->student->user->username,
                    'monthly_aggregate' => $computedAggregate,
                    'final_exam_score' => $existing ? $existing->final_exam_score : '',
                    'status' => $existing ? $existing->status : 'draft',
                    'notes' => $existing ? $existing->notes : '',
                    'attachment_path' => $existing ? $existing->attachment_path : null,
                ];
            }
        }

        return Inertia::render('Academic/SemesterResults/Index', [
            'academicYears' => $academicYears,
            'semesters' => $semesters,
            'semester' => $semester,
            'divisions' => $divisions,
            'subjects' => $subjects,
            'studentsData' => $studentsData,
            'filters' => [
                'academic_year_id' => $yearId,
                'semester_id' => $semester ? $semester->id : null,
                'division_id' => $divisionId,
                'subject_id' => $subjectId,
            ],
            'gradeSetting' => $gradeSetting
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'semester_id' => 'required|exists:semesters,id',
            'subject_id' => 'required|exists:subjects,id',
            'grades' => 'required|array',
            'grades.*.enrollment_id' => 'required|exists:enrollments,id',
            'grades.*.monthly_aggregate' => 'required|numeric|min:0',
            'grades.*.final_exam_score' => 'required|numeric|min:0',
            'grades.*.notes' => 'nullable|string',
            'grades.*.attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $branchId = auth()->user()->branch_id;

        DB::beginTransaction();
        try {
            foreach ($validated['grades'] as $index => $grade) {
                $total = $grade['monthly_aggregate'] + $grade['final_exam_score'];
                
                $updateData = [
                    'branch_id' => $branchId,
                    'monthly_aggregate' => $grade['monthly_aggregate'],
                    'final_exam_score' => $grade['final_exam_score'],
                    'semester_total' => $total,
                ];

                if (isset($grade['notes'])) {
                    $updateData['notes'] = $grade['notes'];
                }

                // Handle file upload
                if ($request->hasFile("grades.{$index}.attachment")) {
                    $file = $request->file("grades.{$index}.attachment");
                    $path = $file->store('semester_results_attachments', 'public');
                    $updateData['attachment_path'] = $path;
                }

                SemesterResult::updateOrCreate(
                    [
                        'enrollment_id' => $grade['enrollment_id'],
                        'semester_id' => $validated['semester_id'],
                        'subject_id' => $validated['subject_id'],
                    ],
                    $updateData
                );
            }
            DB::commit();
            return redirect()->back()->with('success', 'تم حفظ درجات الفصل بنجاح.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ: ' . $e->getMessage());
        }
    }

    public function lock(Request $request)
    {
        $validated = $request->validate([
            'semester_id' => 'required|exists:semesters,id',
            'subject_id' => 'required|exists:subjects,id',
        ]);

        SemesterResult::where('semester_id', $validated['semester_id'])
            ->where('subject_id', $validated['subject_id'])
            ->update([
                'status' => 'locked',
                'finalized_by' => auth()->id(),
                'finalized_at' => now()
            ]);

        return redirect()->back()->with('success', 'تم قفل واعتماد نتائج الفصل بنجاح.');
    }

    /**
     * كشف درجات ونتائج الطلاب المجمع (Class Report)
     */
    public function classReport(Request $request)
    {
        $user = auth()->user();
        $branchId = $user->branch_id;

        $academicYears = \App\Models\AcademicYear::where('branch_id', $branchId)->orderBy('start_date', 'desc')->get();
        $activeYear = \App\Models\AcademicYear::currentForBranch($branchId);

        $yearId = $request->query('academic_year_id') ?: ($activeYear->id ?? null);
        $semesters = $yearId ? Semester::where('academic_year_id', $yearId)->orderBy('start_date', 'asc')->get() : collect();
        $semesterId = $request->query('semester_id') ?: ($semesters->first()->id ?? null);

        $divisions = Division::where('branch_id', $branchId)->with('grade')->get();
        $divisionId = $request->query('division_id');

        $studentsData = [];
        $subjects = [];
        $division = null;
        $semester = Semester::find($semesterId);

        if ($divisionId && $semester) {
            $division = Division::with('grade.subjects')->find($divisionId);
            if ($division && $division->grade) {
                $subjects = $division->grade->subjects;
            }

            $enrollments = Enrollment::with('student.user')
                ->where('division_id', $divisionId)
                ->where('academic_year_id', $semester->academic_year_id)
                ->where('status', 'active')
                ->get();

            // Load existing semester results for all students in this division for all subjects
            $existingResults = SemesterResult::where('semester_id', $semester->id)
                ->whereIn('enrollment_id', $enrollments->pluck('id'))
                ->get()
                ->groupBy('enrollment_id');

            foreach ($enrollments as $enroll) {
                $studentResults = $existingResults->get($enroll->id) ? $existingResults->get($enroll->id)->keyBy('subject_id') : collect();
                
                $subjectScores = [];
                $totalScore = 0;
                $maxPossibleTotal = 0;

                foreach ($subjects as $subject) {
                    $result = $studentResults->get($subject->id);
                    $score = $result ? (float)$result->semester_total : 0;
                    
                    // We need the max score for percentage. Assuming semester_aggregate_max + final_exam_max
                    // or just 100 for default.
                    $subjectMax = ($subject->semester_aggregate_max ?? 0) + ($subject->final_exam_max ?? 0);
                    if ($subjectMax == 0) $subjectMax = 100; // Fallback

                    $subjectScores[$subject->id] = $score;
                    $totalScore += $score;
                    $maxPossibleTotal += $subjectMax;
                }

                $percentage = $maxPossibleTotal > 0 ? ($totalScore / $maxPossibleTotal) * 100 : 0;

                $studentsData[] = [
                    'enrollment_id' => $enroll->id,
                    'student_name' => $enroll->student->user->name,
                    'student_id_number' => $enroll->student->user->id_number,
                    'scores' => $subjectScores,
                    'total_score' => $totalScore,
                    'max_total' => $maxPossibleTotal,
                    'percentage' => round($percentage, 2),
                ];
            }

            // Default sorting: Alphabetical (since that's what the user prefers for lists typically)
            // But we'll do it by name
            usort($studentsData, function($a, $b) {
                return strcmp($a['student_name'], $b['student_name']);
            });
        }

        return Inertia::render('Academic/SemesterResults/ClassReport', [
            'academicYears' => $academicYears,
            'semesters' => $semesters,
            'divisions' => $divisions,
            'subjects' => $subjects,
            'studentsData' => $studentsData,
            'divisionInfo' => $division,
            'semesterInfo' => $semester,
            'filters' => [
                'academic_year_id' => $yearId,
                'semester_id' => $semesterId,
                'division_id' => $divisionId,
            ]
        ]);
    }
}
