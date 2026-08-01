<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ClassAttendance;
use Carbon\Carbon;

use App\Traits\ResolvesStudent;

class MyAttendanceController extends Controller
{
    use ResolvesStudent;

    public function index(Request $request)
    {
        [$student, $children] = $this->resolveStudent($request);
        
        if (!$student) {
            // In case a parent has no children
            return Inertia::render('Student/Attendance/Index', [
                'allAttendance' => [],
                'recentAttendance' => [],
                'stats' => [],
                'subjectBreakdown' => [],
                'children' => $children,
                'activeChildId' => null,
            ]);
        }
        
        // Get all attendance records
        $allAttendance = ClassAttendance::with(['subject', 'period', 'teacher'])
            ->where('student_id', $student->id)
            ->orderBy('date', 'desc')
            ->get();
            
        // Calculate Days Absent vs Classes Absent
        // Day absent = any date where the student was marked absent or unexcused
        $absentClasses = $allAttendance->whereIn('status', ['absent', 'unexcused']);
        $lateClasses = $allAttendance->where('status', 'late');
        $excusedClasses = $allAttendance->where('status', 'excused');
        
        $uniqueDaysAbsent = $absentClasses->pluck('date')->map(fn($d) => $d->format('Y-m-d'))->unique()->count();
        $uniqueDaysLate = $lateClasses->pluck('date')->map(fn($d) => $d->format('Y-m-d'))->unique()->count();
        $totalClassesAbsent = $absentClasses->count();
        $totalClassesLate = $lateClasses->count();
        
        // Subject Breakdown
        $subjectBreakdown = [];
        foreach ($absentClasses as $att) {
            $subName = $att->subject ? $att->subject->name : 'غير محدد';
            if (!isset($subjectBreakdown[$subName])) {
                $subjectBreakdown[$subName] = 0;
            }
            $subjectBreakdown[$subName]++;
        }
        
        // Sort subjects by highest absence
        arsort($subjectBreakdown);
        
        // Format for Chart/UI: [{ name: 'Math', value: 5 }]
        $formattedBreakdown = [];
        foreach ($subjectBreakdown as $name => $value) {
            $formattedBreakdown[] = [
                'name' => $name,
                'absences' => $value
            ];
        }
        
        // For Heatmap (last 30 days or so, or just return history)
        // Group by date
        $heatmapData = [];
        foreach ($allAttendance as $att) {
            $dateStr = $att->date->format('Y-m-d');
            if (!isset($heatmapData[$dateStr])) {
                $heatmapData[$dateStr] = [
                    'date' => $dateStr,
                    'status' => 'present',
                    'count' => 0,
                    'details' => []
                ];
            }
            $heatmapData[$dateStr]['details'][] = $att;
            
            // Determine worst status for the day to color the heatmap
            if (in_array($att->status, ['absent', 'unexcused'])) {
                $heatmapData[$dateStr]['status'] = 'absent';
            } elseif ($att->status === 'late' && $heatmapData[$dateStr]['status'] !== 'absent') {
                $heatmapData[$dateStr]['status'] = 'late';
            } elseif ($att->status === 'excused' && $heatmapData[$dateStr]['status'] === 'present') {
                $heatmapData[$dateStr]['status'] = 'excused';
            }
            
            $heatmapData[$dateStr]['count']++;
        }
        
        $heatmapData = array_values($heatmapData);

        return Inertia::render('Student/Attendance/Index', [
            'stats' => [
                'daysAbsent' => $uniqueDaysAbsent,
                'classesAbsent' => $totalClassesAbsent,
                'daysLate' => $uniqueDaysLate,
                'classesLate' => $totalClassesLate,
                'classesExcused' => $excusedClasses->count()
            ],
            'subjectBreakdown' => $formattedBreakdown,
            'history' => $allAttendance,
            'heatmapData' => $heatmapData,
            'children' => $children,
            'activeChildId' => $student->id,
            'dangerLimitDays' => 15, // Threshold for danger bar
            'dangerLimitClasses' => 40 // Threshold for classes
        ]);
    }
}
