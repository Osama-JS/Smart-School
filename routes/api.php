<?php

use App\Http\Controllers\Api\AttendanceApiController;
use App\Http\Controllers\Api\MobileAuthController;
use App\Http\Controllers\Api\MobileFeaturesController;
use App\Http\Controllers\Api\V1\BranchManagerController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\ClassAttendanceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Attendance Geolocation System
|--------------------------------------------------------------------------
*/

// Public route to test API is working
Route::get('/ping', fn() => response()->json(['status' => 'ok', 'message' => 'Smart School API']));

// Users & Branch Managers API (wrapped in web middleware to access session, named with api. prefix to prevent conflicts)
Route::middleware('web')->name('api.')->group(function () {
    // Branch Managers API
    Route::get('/branch-managers', [BranchManagerController::class, 'index'])->name('branch-managers');

    // Users API (requires 'إدارة المستخدمين' permission check)
    Route::middleware('permission:إدارة المستخدمين')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});

// Mobile App Authentication API
Route::prefix('mobile')->group(function () {
    Route::post('/login', [MobileAuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [MobileAuthController::class, 'logout']);
        Route::post('/change-password', [MobileAuthController::class, 'changePassword']);
        Route::get('/profile', [MobileAuthController::class, 'getProfile']);
        Route::get('/linked-accounts', [MobileAuthController::class, 'getLinkedAccounts']);
        Route::post('/switch-account/{user}', [MobileAuthController::class, 'switchAccount']);
        Route::post('/user/device-token', [\App\Http\Controllers\NotificationController::class, 'saveFcmToken']);
    });
});

// Attendance API (Protected by Sanctum)
Route::middleware('auth:sanctum')->prefix('attendance')->group(function () {
    Route::get('/today-shifts', [AttendanceApiController::class, 'getTodayShifts']);
    Route::post('/check-in',  [AttendanceApiController::class, 'checkIn']);
    Route::post('/check-out', [AttendanceApiController::class, 'checkOut']);
    Route::get('/report/{employeeId}', [AttendanceApiController::class, 'employeeReport'])->name('api.attendance.employee-report');
});

// Mobile Features API
Route::middleware('auth:sanctum')->prefix('mobile/features')->group(function () {
    // Shared: News & Announcements
    Route::get('/news', [\App\Http\Controllers\Api\MobileNewsController::class, 'index']);
    Route::get('/news/{id}', [\App\Http\Controllers\Api\MobileNewsController::class, 'show']);
    Route::post('/news/{id}/like', [\App\Http\Controllers\Api\MobileNewsController::class, 'toggleLike']);
    Route::post('/news/{id}/comment', [\App\Http\Controllers\Api\MobileNewsController::class, 'addComment']);
    Route::delete('/news/{id}/comment/{commentId}', [\App\Http\Controllers\Api\MobileNewsController::class, 'deleteComment']);

    // Shared: Quick Tasks (To-Do List)
    Route::get('/quick-tasks', [\App\Http\Controllers\Api\MobileQuickTaskController::class, 'index']);
    Route::post('/quick-tasks', [\App\Http\Controllers\Api\MobileQuickTaskController::class, 'store']);
    Route::patch('/quick-tasks/{id}/toggle', [\App\Http\Controllers\Api\MobileQuickTaskController::class, 'toggle']);
    Route::delete('/quick-tasks/{id}', [\App\Http\Controllers\Api\MobileQuickTaskController::class, 'destroy']);


    // Teacher
    Route::get('/timetable', [MobileFeaturesController::class, 'getTimetable']);
    Route::get('/preparations', [MobileFeaturesController::class, 'getPreparations']);
    Route::get('/preparations/form-data', [MobileFeaturesController::class, 'getPreparationFormData']);
    Route::post('/preparations', [MobileFeaturesController::class, 'storePreparation']);
    Route::put('/preparations/{lessonPreparation}', [MobileFeaturesController::class, 'updatePreparation']);
    Route::delete('/preparations/{lessonPreparation}', [MobileFeaturesController::class, 'deletePreparation']);
    
    // Teacher Class Attendance
    Route::get('/class-attendance/form-data', [ClassAttendanceController::class, 'getFormData']);
    Route::get('/class-attendance/students', [ClassAttendanceController::class, 'getStudents']);
    Route::post('/class-attendance', [ClassAttendanceController::class, 'store']);
    Route::get('/teacher/class-attendances/today', [ClassAttendanceController::class, 'getTeacherTodaySchedule']);
    Route::get('/mobile/features/teacher/class-attendances/today', [ClassAttendanceController::class, 'getTeacherTodaySchedule']);
    Route::post('/teacher/class-attendances/get-students', [ClassAttendanceController::class, 'getStudents']);
    Route::post('/mobile/features/teacher/class-attendances/get-students', [ClassAttendanceController::class, 'getStudents']);
    Route::post('/mobile/features/teacher/class-attendances/save', [ClassAttendanceController::class, 'store']);

    // Academic Daily Student Attendance (matching academic/attendances)
    Route::get('/academic/attendances', [MobileFeaturesController::class, 'getDailyAttendancesList']);
    Route::get('/mobile/features/academic/attendances', [MobileFeaturesController::class, 'getDailyAttendancesList']);
    Route::get('/academic/attendances/form-data', [MobileFeaturesController::class, 'getDailyAttendanceFormData']);
    Route::get('/mobile/features/academic/attendances/form-data', [MobileFeaturesController::class, 'getDailyAttendanceFormData']);
    Route::get('/academic/attendances/students', [MobileFeaturesController::class, 'getDailyAttendanceStudents']);
    Route::get('/mobile/features/academic/attendances/students', [MobileFeaturesController::class, 'getDailyAttendanceStudents']);
    Route::post('/academic/attendances/save', [MobileFeaturesController::class, 'saveDailyAttendance']);
    Route::post('/mobile/features/academic/attendances/save', [MobileFeaturesController::class, 'saveDailyAttendance']);

    // HR / Employee Requests
    Route::get('/requests', [MobileFeaturesController::class, 'getEmployeeRequests']);
    Route::post('/requests', [MobileFeaturesController::class, 'storeEmployeeRequest']);

    // Attendance Review (Admin)
    Route::get('/attendance-review', [MobileFeaturesController::class, 'getAttendanceReview']);

    // Classroom Visits
    Route::get('/classroom-visits/my', [MobileFeaturesController::class, 'getMyClassroomVisits']);
    Route::get('/classroom-visits', [MobileFeaturesController::class, 'getManageClassroomVisits']);
    Route::post('/classroom-visits', [MobileFeaturesController::class, 'storeClassroomVisit']);

    // Employee Violations / Infractions
    Route::get('/infractions', [MobileFeaturesController::class, 'getInfractions']);
    Route::post('/infractions/{id}/sign', [MobileFeaturesController::class, 'signInfraction']);

    // Employee Achievements
    Route::get('/achievements', [MobileFeaturesController::class, 'getAchievements']);
    Route::post('/achievements/{id}/sign', [MobileFeaturesController::class, 'signAchievement']);

    // Student App Routes
    Route::get('/student/grades', [\App\Http\Controllers\Api\StudentAppController::class, 'getMonthlyGrades']);
    Route::get('/student/semester-results', [\App\Http\Controllers\Api\StudentAppController::class, 'getSemesterResults']);
    Route::get('/student/attendance', [\App\Http\Controllers\Api\StudentAppController::class, 'getAttendance']);
    Route::get('/student/timetable', [\App\Http\Controllers\Api\StudentAppController::class, 'getTimetable']);
    Route::get('/student/exam-schedules', [\App\Http\Controllers\Api\StudentAppController::class, 'getExamSchedules']);
    Route::get('/student/homework', [\App\Http\Controllers\Api\StudentAppController::class, 'getHomework']);
    Route::get('/student/library', [\App\Http\Controllers\Api\StudentAppController::class, 'getLibraryItems']);
    Route::get('/student/discipline', [\App\Http\Controllers\Api\StudentAppController::class, 'getDiscipline']);
    Route::post('/student/pledges/{pledge}/sign', [\App\Http\Controllers\Api\StudentAppController::class, 'signPledge']);
    Route::get('/student/achievements', [\App\Http\Controllers\Api\StudentAppController::class, 'getAchievements']);
    // Parent App Routes
    Route::get('/parent/children', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildren']);
    Route::get('/parent/children/{student_id}/grades', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildGrades']);
    Route::get('/parent/children/{student_id}/semester-results', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildSemesterResults']);
    Route::get('/parent/children/{student_id}/attendance', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildAttendance']);
    Route::get('/parent/children/{student_id}/timetable', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildTimetable']);
    Route::get('/parent/children/{student_id}/exam-schedules', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildExamSchedules']);
    Route::get('/parent/children/{student_id}/homework', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildHomework']);
    Route::get('/parent/children/{student_id}/medical-record', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildMedicalRecord']);
    Route::put('/parent/children/{student_id}/medical-record', [\App\Http\Controllers\Api\ParentAppController::class, 'updateChildMedicalRecord']);
    Route::get('/parent/children/{student_id}/clinic-visits', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildClinicVisits']);
    Route::get('/parent/children/{student_id}/discipline', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildDiscipline']);
    Route::post('/parent/children/{student_id}/pledges/{pledge}/sign', [\App\Http\Controllers\Api\ParentAppController::class, 'signChildPledge']);
    Route::get('/parent/children/{student_id}/achievements', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildAchievements']);
    Route::get('/parent/children/{student_id}/summons', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildSummons']);
    Route::get('/parent/children/{student_id}/visits', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildVisits']);
    Route::get('/parent/children/{student_id}/library', [\App\Http\Controllers\Api\ParentAppController::class, 'getChildLibraryItems']);
    // Notifications (reusing NotificationController JSON responses)
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::get('/notifications/all', [\App\Http\Controllers\NotificationController::class, 'myNotifications']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    Route::post('/mobile/user/device-token', [\App\Http\Controllers\NotificationController::class, 'saveFcmToken']);
    Route::post('/user/device-token', [\App\Http\Controllers\NotificationController::class, 'saveFcmToken']);
    Route::post('/notifications/fcm-token', [\App\Http\Controllers\NotificationController::class, 'saveFcmToken']);

    // My Reports
    Route::get('/my-reports/templates', [MobileFeaturesController::class, 'getMyReportTemplates']);
    Route::get('/my-reports/templates/{id}', [MobileFeaturesController::class, 'getReportTemplateDetails']);
    Route::post('/my-reports/submit/{id}', [MobileFeaturesController::class, 'submitReport']);
    Route::get('/my-reports', [MobileFeaturesController::class, 'getMyReports']);

    // Teacher Study Plans
    Route::get('/study-plans', [MobileFeaturesController::class, 'getStudyPlans']);
    Route::get('/study-plans/{studyPlan}', [MobileFeaturesController::class, 'getStudyPlanDetails']);
    Route::post('/study-plans/{studyPlan}/comments', [MobileFeaturesController::class, 'storeStudyPlanComment']);

    // Teacher Monthly Grades Entry
    Route::get('/teacher/monthly-grades/form-data', [MobileFeaturesController::class, 'getMonthlyGradesFormData']);
    Route::get('/teacher/monthly-grades/students', [MobileFeaturesController::class, 'getMonthlyGradesStudents']);
    Route::post('/teacher/monthly-grades', [MobileFeaturesController::class, 'storeMonthlyGrades']);
    Route::post('/teacher/monthly-grades/weekly', [MobileFeaturesController::class, 'saveWeeklyMonthlyGrades']);
    Route::post('/teacher/monthly-grades/submit', [MobileFeaturesController::class, 'submitFinalMonthlyGrades']);

    // Teacher Exam Invigilation Schedules
    Route::get('/teacher/my-exam-schedules', [MobileFeaturesController::class, 'getTeacherExamSchedules']);

    // Teacher Class Coverages / Substitutes
    Route::get('/teacher/my-coverages', [MobileFeaturesController::class, 'getTeacherCoverages']);

    // Classroom Visits Management (Supervisor & Academic)
    Route::get('/classroom-visits', [MobileFeaturesController::class, 'getClassroomVisits']);
    Route::get('/mobile/features/classroom-visits', [MobileFeaturesController::class, 'getClassroomVisits']);
    Route::get('/classroom-visits/form-data', [MobileFeaturesController::class, 'getClassroomVisitsFormData']);
    Route::get('/mobile/features/classroom-visits/form-data', [MobileFeaturesController::class, 'getClassroomVisitsFormData']);
    Route::post('/classroom-visits', [MobileFeaturesController::class, 'storeClassroomVisit']);
    Route::post('/mobile/features/classroom-visits', [MobileFeaturesController::class, 'storeClassroomVisit']);
    Route::put('/classroom-visits/{classroomVisit}', [MobileFeaturesController::class, 'updateClassroomVisit']);
    Route::post('/classroom-visits/{classroomVisit}/update', [MobileFeaturesController::class, 'updateClassroomVisit']);
    Route::delete('/classroom-visits/{classroomVisit}', [MobileFeaturesController::class, 'destroyClassroomVisit']);
    Route::post('/classroom-visits/{classroomVisit}/delete', [MobileFeaturesController::class, 'destroyClassroomVisit']);
    Route::post('/classroom-visits/{classroomVisit}/approve', [MobileFeaturesController::class, 'approveClassroomVisit']);

    // Teacher's Classroom Visits (My Visits)
    Route::get('/classroom-visits/my', [MobileFeaturesController::class, 'getMyClassroomVisits']);
    Route::get('/mobile/features/classroom-visits/my', [MobileFeaturesController::class, 'getMyClassroomVisits']);
    Route::post('/classroom-visits/{classroomVisit}/teacher-sign', [MobileFeaturesController::class, 'signClassroomVisit']);
    Route::post('/mobile/features/classroom-visits/{classroomVisit}/teacher-sign', [MobileFeaturesController::class, 'signClassroomVisit']);

    // Teacher Digital Library
    Route::get('/teacher/library', [MobileFeaturesController::class, 'getTeacherLibraryItems']);
    Route::get('/mobile/features/teacher/library', [MobileFeaturesController::class, 'getTeacherLibraryItems']);
    Route::post('/teacher/library', [MobileFeaturesController::class, 'storeLibraryItem']);
    Route::post('/mobile/features/teacher/library', [MobileFeaturesController::class, 'storeLibraryItem']);
    Route::post('/teacher/library/{id}/bookmark', [MobileFeaturesController::class, 'toggleLibraryBookmark']);
    Route::post('/mobile/features/teacher/library/{id}/bookmark', [MobileFeaturesController::class, 'toggleLibraryBookmark']);

    // Leave Balances (Employee)
    Route::get('/leave-balances', [MobileFeaturesController::class, 'getLeaveBalances']);

    // Digital Signing on Infractions & Achievements
    Route::post('/infractions/{id}/sign', [MobileFeaturesController::class, 'signInfraction']);
    Route::post('/achievements/{id}/sign', [MobileFeaturesController::class, 'signAchievement']);

    // Employee Appraisals & KPIs
    Route::get('/appraisals', [MobileFeaturesController::class, 'getAppraisals']);
    Route::get('/mobile/features/appraisals', [MobileFeaturesController::class, 'getAppraisals']);
    Route::get('/appraisals/{id}', [MobileFeaturesController::class, 'getAppraisalDetails']);
    Route::get('/mobile/features/appraisals/{id}', [MobileFeaturesController::class, 'getAppraisalDetails']);
    Route::post('/appraisals/{id}/submit-self', [MobileFeaturesController::class, 'submitAppraisalSelf']);
    Route::post('/mobile/features/appraisals/{id}/submit-self', [MobileFeaturesController::class, 'submitAppraisalSelf']);
    Route::post('/appraisals/{id}/submit-manager', [MobileFeaturesController::class, 'submitAppraisalManager']);
    Route::post('/mobile/features/appraisals/{id}/submit-manager', [MobileFeaturesController::class, 'submitAppraisalManager']);
    Route::post('/appraisals/{id}/scores/{score}/goals', [MobileFeaturesController::class, 'storeAppraisalGoal']);
    Route::post('/mobile/features/appraisals/{id}/scores/{score}/goals', [MobileFeaturesController::class, 'storeAppraisalGoal']);
    Route::post('/appraisals/{id}/goals/{goal}/progress', [MobileFeaturesController::class, 'updateAppraisalGoalProgress']);
    Route::put('/appraisals/{id}/goals/{goal}/progress', [MobileFeaturesController::class, 'updateAppraisalGoalProgress']);
    Route::post('/mobile/features/appraisals/{id}/goals/{goal}/progress', [MobileFeaturesController::class, 'updateAppraisalGoalProgress']);
    Route::put('/mobile/features/appraisals/{id}/goals/{goal}/progress', [MobileFeaturesController::class, 'updateAppraisalGoalProgress']);
    Route::delete('/appraisals/{id}/goals/{goal}', [MobileFeaturesController::class, 'destroyAppraisalGoal']);
    Route::delete('/mobile/features/appraisals/{id}/goals/{goal}', [MobileFeaturesController::class, 'destroyAppraisalGoal']);

    // Staff & Teacher Meetings
    Route::get('/meetings', [MobileFeaturesController::class, 'getMeetings']);
    Route::post('/meetings/{id}/attendance', [MobileFeaturesController::class, 'confirmMeetingAttendance']);
    Route::post('/meetings/{id}/complete', [MobileFeaturesController::class, 'completeMeetingFromMobile']);

    // Teacher Parent Interactions (Summons & Visits)
    Route::get('/teacher/parent-summons', [MobileFeaturesController::class, 'getTeacherParentSummons']);
    Route::post('/teacher/parent-summons', [MobileFeaturesController::class, 'storeTeacherParentSummon']);
    Route::get('/teacher/parent-visits/form-data', [MobileFeaturesController::class, 'getParentVisitsFormData']);
    Route::get('/teacher/parent-visits', [MobileFeaturesController::class, 'getTeacherParentVisits']);
    Route::post('/teacher/parent-visits', [MobileFeaturesController::class, 'storeTeacherParentVisit']);
    Route::put('/teacher/parent-visits/{id}', [MobileFeaturesController::class, 'updateTeacherParentVisit']);
    Route::post('/teacher/parent-visits/{id}/update', [MobileFeaturesController::class, 'updateTeacherParentVisit']);
    Route::delete('/teacher/parent-visits/{id}', [MobileFeaturesController::class, 'destroyTeacherParentVisit']);
    Route::post('/teacher/parent-visits/{id}/delete', [MobileFeaturesController::class, 'destroyTeacherParentVisit']);
    Route::post('/teacher/parent-visits/{id}/convert-achievement', [MobileFeaturesController::class, 'convertParentVisitToAchievement']);
    Route::post('/teacher/parent-visits/{id}/convert-violation', [MobileFeaturesController::class, 'convertParentVisitToViolation']);
    Route::get('/teacher/students-list', [MobileFeaturesController::class, 'getTeacherStudentsList']);
});

