<?php

namespace App\Http\Controllers\Academic;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\SemesterResult;
use App\Models\MonthlyGrade;
use App\Models\Subject;

class StudentGradeReportController extends Controller implements \Illuminate\Routing\Controllers\HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new \Illuminate\Routing\Controllers\Middleware('permission:عرض درجات الطلاب', only: ['show', 'exportPdf']),
        ];
    }

    public function show($studentId)
    {
        $student = Student::with('user')->findOrFail($studentId);
        
        $enrollment = Enrollment::with(['division.grade.subjects', 'academicYear.semesters'])
            ->where('student_id', $studentId)
            ->where('status', 'active')
            ->orderBy('id', 'desc')
            ->firstOrFail();

        $subjects = $enrollment->division->grade->subjects;
        $semesters = $enrollment->academicYear->semesters;
        
        $reportData = [];

        foreach ($subjects as $subject) {
            $gradeSetting = Subject::find($subject->id);
            $subjectData = [
                'id' => $subject->id,
                'name' => $subject->name,
                'settings' => $gradeSetting,
                'semesters' => [],
                'yearly_total' => 0
            ];

            $yearlyTotal = 0;

            foreach ($semesters as $semester) {
                // Fetch monthly grades for this semester and subject
                $months = MonthlyGrade::with('period')
                    ->where('enrollment_id', $enrollment->id)
                    ->where('semester_id', $semester->id)
                    ->where('subject_id', $subject->id)
                    ->get();

                $semesterResult = SemesterResult::where('enrollment_id', $enrollment->id)
                    ->where('semester_id', $semester->id)
                    ->where('subject_id', $subject->id)
                    ->first();

                if ($semesterResult) {
                    $yearlyTotal += $semesterResult->semester_total;
                }

                $subjectData['semesters'][$semester->id] = [
                    'name' => $semester->name,
                    'months' => $months->map(function ($m) {
                        return [
                            'month_name' => $m->period->month_name,
                            'weekly_scores' => $m->weekly_scores,
                            'scores' => $m->scores,
                            'is_submitted' => $m->is_submitted,
                        ];
                    }),
                    'result' => $semesterResult ? [
                        'monthly_aggregate' => $semesterResult->monthly_aggregate,
                        'final_exam_score' => $semesterResult->final_exam_score,
                        'semester_total' => $semesterResult->semester_total,
                        'status' => $semesterResult->status,
                    ] : null
                ];
            }

            $subjectData['yearly_total'] = $yearlyTotal;
            $reportData[] = $subjectData;
        }

        return Inertia::render('Academic/StudentGradeReport/Show', [
            'student' => $student,
            'enrollment' => $enrollment,
            'reportData' => $reportData,
        ]);
    }
}
