<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Installation Routes ──
Route::get('/install', [\App\Http\Controllers\InstallController::class, 'index'])->name('install');
Route::post('/install/step', [\App\Http\Controllers\InstallController::class, 'runStep'])->name('install.step');

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ── System Logs ──
    Route::get('/admin/activity-logs', [\App\Http\Controllers\Admin\ActivityLogController::class, 'index'])->name('admin.activity-logs.index');

    // ── News & Announcements ──
    Route::resource('/news', \App\Http\Controllers\NewsController::class)->except(['create', 'edit']);
    Route::post('/news/{news}/view', [\App\Http\Controllers\NewsController::class, 'recordView'])->name('news.view');
    Route::post('/news/{news}/like', [\App\Http\Controllers\NewsInteractionController::class, 'toggleLike'])->name('news.like');
    Route::post('/news/{news}/comment', [\App\Http\Controllers\NewsInteractionController::class, 'storeComment'])->name('news.comment.store');
    Route::delete('/news/comment/{comment}', [\App\Http\Controllers\NewsInteractionController::class, 'destroyComment'])->name('news.comment.destroy');

    // ── Notifications ──
    Route::prefix('notifications')->group(function () {
        Route::get('/my-notifications', [\App\Http\Controllers\NotificationController::class, 'myNotifications'])->name('notifications.my-notifications');
        Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
        Route::post('/fcm-token', [\App\Http\Controllers\NotificationController::class, 'saveFcmToken'])->name('notifications.fcm-token');
    });

    Route::prefix('admin/notifications')->group(function () {
        Route::get('/send', [\App\Http\Controllers\Admin\NotificationSenderController::class, 'create'])->name('admin.notifications.send');
        Route::post('/send', [\App\Http\Controllers\Admin\NotificationSenderController::class, 'store'])->name('admin.notifications.store');
        Route::get('/users', [\App\Http\Controllers\Admin\NotificationSenderController::class, 'getUsers'])->name('admin.notifications.users');
        Route::get('/logs', [\App\Http\Controllers\Admin\NotificationSenderController::class, 'logs'])->name('admin.notifications.logs');
    });

    // ── Users ──
    Route::middleware('permission:إدارة المستخدمين')->group(function () {
        Route::post('/users/bulk', [UserController::class, 'bulk'])->name('users.bulk');
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
        Route::patch('/users/{user}/quick-update', [UserController::class, 'quickUpdate'])->name('users.quick-update');
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // ── Quick Tasks ──
    Route::post('/dashboard/quick-tasks', [\App\Http\Controllers\DashboardController::class, 'storeQuickTask'])->name('dashboard.quick-tasks.store');
    Route::patch('/dashboard/quick-tasks/{task}/toggle', [\App\Http\Controllers\DashboardController::class, 'toggleQuickTask'])->name('dashboard.quick-tasks.toggle');
    Route::delete('/dashboard/quick-tasks/{task}', [\App\Http\Controllers\DashboardController::class, 'destroyQuickTask'])->name('dashboard.quick-tasks.destroy');

    // ── System Admin Only Routes ──
    Route::middleware([\App\Http\Middleware\SystemAdminOnly::class])->group(function () {
        // ── Permissions & Roles ──
        Route::get('/admin/permissions', [\App\Http\Controllers\Admin\PermissionController::class, 'index'])->name('admin.permissions');
        Route::post('/admin/roles', [\App\Http\Controllers\Admin\PermissionController::class, 'storeRole'])->name('admin.roles.store');
        Route::delete('/admin/roles/{role}', [\App\Http\Controllers\Admin\PermissionController::class, 'destroyRole'])->name('admin.roles.destroy');
        Route::post('/admin/roles/{role}/permissions', [\App\Http\Controllers\Admin\PermissionController::class, 'syncRolePermissions'])->name('admin.roles.permissions');

        // ── Settings ──
        Route::get('/admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index'])->name('admin.settings');
        Route::post('/admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update'])->name('admin.settings.update');


        // ── Branches ──
        Route::get('/hr/branches', [\App\Http\Controllers\HR\BranchController::class, 'index'])->name('hr.branches');
        Route::post('/hr/branches', [\App\Http\Controllers\HR\BranchController::class, 'store'])->name('hr.branches.store');
        Route::put('/hr/branches/{branch}', [\App\Http\Controllers\HR\BranchController::class, 'update'])->name('hr.branches.update');
        Route::delete('/hr/branches/{branch}', [\App\Http\Controllers\HR\BranchController::class, 'destroy'])->name('hr.branches.destroy');
        Route::post('/hr/branches/{branch}/assign-manager', [\App\Http\Controllers\HR\BranchController::class, 'assignManager'])->name('hr.branches.assign-manager');
        Route::post('/hr/branches/{branch}/store-manager', [\App\Http\Controllers\HR\BranchController::class, 'storeManager'])->name('hr.branches.store-manager');
    });

    // ── Academic Routes ──
    Route::middleware('permission:إدارة السنوات الدراسية')->group(function () {
        Route::get('/academic/years', [\App\Http\Controllers\Academic\AcademicYearController::class, 'index'])->name('academic.years');
        Route::post('/academic/years', [\App\Http\Controllers\Academic\AcademicYearController::class, 'store'])->name('academic.years.store');
        Route::put('/academic/years/{academicYear}', [\App\Http\Controllers\Academic\AcademicYearController::class, 'update'])->name('academic.years.update');
        Route::delete('/academic/years/{academicYear}', [\App\Http\Controllers\Academic\AcademicYearController::class, 'destroy'])->name('academic.years.destroy');
        Route::post('/academic/years/{academicYear}/toggle', [\App\Http\Controllers\Academic\AcademicYearController::class, 'toggleActive'])->name('academic.years.toggle');

        Route::post('/academic/years/{academicYear}/semesters', [\App\Http\Controllers\Academic\AcademicYearController::class, 'storeSemester'])->name('academic.semesters.store');
        Route::put('/academic/semesters/{semester}', [\App\Http\Controllers\Academic\AcademicYearController::class, 'updateSemester'])->name('academic.semesters.update');
        Route::delete('/academic/semesters/{semester}', [\App\Http\Controllers\Academic\AcademicYearController::class, 'destroySemester'])->name('academic.semesters.destroy');
        Route::post('/academic/semesters/{semester}/toggle', [\App\Http\Controllers\Academic\AcademicYearController::class, 'toggleSemesterActive'])->name('academic.semesters.toggle');
    });
        
    Route::middleware('permission:إدارة المراحل والصفوف')->group(function () {
        // Structure (Sections, Grades, Divisions)
        Route::get('/academic/structure', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'index'])->name('academic.structure');
        
        Route::post('/academic/sections', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'storeSection'])->name('academic.sections.store');
        Route::put('/academic/sections/{section}', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'updateSection'])->name('academic.sections.update');
        Route::delete('/academic/sections/{section}', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'destroySection'])->name('academic.sections.destroy');
        
        Route::post('/academic/grades', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'storeGrade'])->name('academic.grades.store');
        Route::put('/academic/grades/{grade}', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'updateGrade'])->name('academic.grades.update');
        Route::delete('/academic/grades/{grade}', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'destroyGrade'])->name('academic.grades.destroy');
        
        Route::post('/academic/divisions', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'storeDivision'])->name('academic.divisions.store');
        Route::put('/academic/divisions/{division}', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'updateDivision'])->name('academic.divisions.update');
        Route::delete('/academic/divisions/{division}', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'destroyDivision'])->name('academic.divisions.destroy');
        Route::post('/academic/divisions/copy', [\App\Http\Controllers\Academic\AcademicStructureController::class, 'copyDivisions'])->name('academic.divisions.copy');
    });

    Route::middleware('permission:إدارة المواد الدراسية')->group(function () {
        // Subjects
        Route::get('/academic/subjects', [\App\Http\Controllers\Academic\SubjectController::class, 'index'])->name('academic.subjects.index');
        Route::post('/academic/subjects', [\App\Http\Controllers\Academic\SubjectController::class, 'store'])->name('academic.subjects.store');
        Route::put('/academic/subjects/{subject}', [\App\Http\Controllers\Academic\SubjectController::class, 'update'])->name('academic.subjects.update');
        Route::delete('/academic/subjects/{subject}', [\App\Http\Controllers\Academic\SubjectController::class, 'destroy'])->name('academic.subjects.destroy');
    });

    Route::middleware('permission:إدارة الجداول الدراسية')->group(function () {
        // Timetables & Periods
        Route::resource('/academic/periods', \App\Http\Controllers\Academic\DailyPeriodController::class)->names([
            'index'   => 'academic.periods',
            'store'   => 'academic.periods.store',
            'update'  => 'academic.periods.update',
            'destroy' => 'academic.periods.destroy',
        ])->except(['create', 'edit', 'show']);

        Route::get('/academic/timetable', [\App\Http\Controllers\Academic\TimetableController::class, 'index'])->name('academic.timetable');
        Route::post('/academic/timetable/assign', [\App\Http\Controllers\Academic\TimetableController::class, 'assign'])->name('academic.timetable.assign');
        Route::post('/academic/timetable/unassign', [\App\Http\Controllers\Academic\TimetableController::class, 'unassign'])->name('academic.timetable.unassign');
        
        // Class Coverage (Absence & Substitution)
        Route::get('/academic/coverage', [\App\Http\Controllers\Academic\ClassCoverageController::class, 'index'])->name('academic.coverage.index');
        Route::get('/academic/coverage/create', [\App\Http\Controllers\Academic\ClassCoverageController::class, 'create'])->name('academic.coverage.create');
        Route::get('/academic/coverage/teacher-periods', [\App\Http\Controllers\Academic\ClassCoverageController::class, 'getTeacherPeriods'])->name('academic.coverage.teacher-periods');
        Route::post('/academic/coverage', [\App\Http\Controllers\Academic\ClassCoverageController::class, 'store'])->name('academic.coverage.store');
        Route::delete('/academic/coverage/{coverage}', [\App\Http\Controllers\Academic\ClassCoverageController::class, 'destroy'])->name('academic.coverage.destroy');
        
        // Exam Schedules
        Route::resource('/academic/exam-schedules', \App\Http\Controllers\Academic\ExamScheduleController::class)->names([
            'index'   => 'academic.exam-schedules.index',
            'store'   => 'academic.exam-schedules.store',
            'show'    => 'academic.exam-schedules.show',
            'destroy' => 'academic.exam-schedules.destroy',
        ])->except(['create', 'edit', 'update']);
        Route::post('/academic/exam-schedules/{examSchedule}/items', [\App\Http\Controllers\Academic\ExamScheduleController::class, 'updateItems'])->name('academic.exam-schedules.items.update');
        Route::get('/academic/exam-schedules/{examSchedule}/print', [\App\Http\Controllers\Academic\ExamScheduleController::class, 'printSchedule'])->name('academic.exam-schedules.print');
    });

    Route::middleware('permission:إدارة الزيارات الصفية')->group(function () {
        Route::resource('/academic/classroom-visits', \App\Http\Controllers\Academic\ClassroomVisitController::class)->names([
            'index'   => 'academic.classroom-visits',
            'store'   => 'academic.classroom-visits.store',
            'update'  => 'academic.classroom-visits.update',
            'destroy' => 'academic.classroom-visits.destroy',
        ])->except(['create', 'edit', 'show']);
        
        Route::post('/academic/classroom-visits/{classroomVisit}/approve', [\App\Http\Controllers\Academic\ClassroomVisitController::class, 'approve'])->name('academic.classroom-visits.approve');
        Route::post('/academic/classroom-visits/{classroomVisit}/teacher-sign', [\App\Http\Controllers\Academic\ClassroomVisitController::class, 'teacherSign'])->name('academic.classroom-visits.teacher-sign');
    });

    Route::middleware('permission:عرض دفاتر التحضير')->group(function () {
        Route::resource('/academic/lesson-preparations', \App\Http\Controllers\Academic\LessonPreparationController::class)->names([
            'index'   => 'academic.lesson-preparations',
            'destroy' => 'academic.lesson-preparations.destroy',
        ])->only(['index', 'destroy']);
    });

    Route::middleware('permission:إدارة الخطط الدراسية')->group(function () {
        Route::get('/academic/study-plans', [\App\Http\Controllers\Academic\StudyPlanController::class, 'index'])->name('academic.study-plans.index');
        Route::post('/academic/study-plans/{studyPlan}/review', [\App\Http\Controllers\Academic\StudyPlanController::class, 'review'])->name('academic.study-plans.review');
        Route::delete('/academic/study-plans/{studyPlan}', [\App\Http\Controllers\Academic\StudyPlanController::class, 'destroy'])->name('academic.study-plans.destroy');
        Route::get('/academic/study-plans/{studyPlan}/download', [\App\Http\Controllers\Academic\StudyPlanController::class, 'download'])->name('academic.study-plans.download');
    });

    // ── Library & Learning Resources ──
    Route::prefix('academic/library')->name('academic.library.')->group(function () {
        // Digital Library
        Route::middleware('permission:عرض المكتبة الرقمية')->group(function () {
            Route::get('/digital', [\App\Http\Controllers\Academic\LibraryItemController::class, 'index'])->name('digital.index');
            Route::post('/digital', [\App\Http\Controllers\Academic\LibraryItemController::class, 'store'])->name('digital.store');
            Route::post('/digital/{libraryItem}', [\App\Http\Controllers\Academic\LibraryItemController::class, 'update'])->name('digital.update');
            Route::delete('/digital/{libraryItem}', [\App\Http\Controllers\Academic\LibraryItemController::class, 'destroy'])->name('digital.destroy');
            Route::post('/digital/{libraryItem}/increment-views', [\App\Http\Controllers\Academic\LibraryItemController::class, 'incrementViews'])->name('digital.increment-views');
            Route::post('/digital/{libraryItem}/increment-downloads', [\App\Http\Controllers\Academic\LibraryItemController::class, 'incrementDownloads'])->name('digital.increment-downloads');
            Route::post('/digital/{libraryItem}/bookmark', [\App\Http\Controllers\Academic\LibraryItemController::class, 'toggleBookmark'])->name('digital.bookmark');
            Route::post('/digital/{libraryItem}/rating', [\App\Http\Controllers\Academic\LibraryItemController::class, 'submitRating'])->name('digital.rating');
        });

        // Physical Books
        Route::middleware('permission:عرض الكتب الورقية')->group(function () {
            Route::get('/books', [\App\Http\Controllers\Academic\BookController::class, 'index'])->name('books.index');
            Route::post('/books', [\App\Http\Controllers\Academic\BookController::class, 'store'])->name('books.store');
            Route::post('/books/{book}', [\App\Http\Controllers\Academic\BookController::class, 'update'])->name('books.update');
            Route::delete('/books/{book}', [\App\Http\Controllers\Academic\BookController::class, 'destroy'])->name('books.destroy');
        });

        // Borrowings
        Route::middleware('permission:عرض الاستعارات')->group(function () {
            Route::get('/borrowings', [\App\Http\Controllers\Academic\BorrowingController::class, 'index'])->name('borrowings.index');
            Route::post('/borrowings', [\App\Http\Controllers\Academic\BorrowingController::class, 'store'])->name('borrowings.store');
            Route::post('/borrowings/{borrowing}/return', [\App\Http\Controllers\Academic\BorrowingController::class, 'returnBook'])->name('borrowings.return');
            Route::delete('/borrowings/{borrowing}', [\App\Http\Controllers\Academic\BorrowingController::class, 'destroy'])->name('borrowings.destroy');
        });
    });

    // Teacher's Timetable and Classroom Visits (No specific permission needed, checking logic in controller or open to all teachers)
    Route::get('/academic/my-timetable', [\App\Http\Controllers\Academic\TimetableController::class, 'myTimetable'])->name('academic.my-timetable');
    
    // Student's Exam Schedule
    Route::get('/student/my-exam-schedule', [\App\Http\Controllers\Student\ExamScheduleController::class, 'index'])->name('student.exam-schedule');
    Route::get('/student/my-exam-schedule/{examSchedule}/ics', [\App\Http\Controllers\Student\ExamScheduleController::class, 'exportIcs'])->name('student.exam-schedule.ics');
    Route::get('/student/my-exam-schedule/{examSchedule}/print', [\App\Http\Controllers\Student\ExamScheduleController::class, 'printSchedule'])->name('student.exam-schedule.print');
    
    // Teacher's Classroom Visits
    Route::get('/teacher/my-classroom-visits', [\App\Http\Controllers\Teacher\ClassroomVisitController::class, 'index'])->name('teacher.my-classroom-visits');
    Route::post('/teacher/my-classroom-visits/{classroomVisit}/sign', [\App\Http\Controllers\Teacher\ClassroomVisitController::class, 'sign'])->name('teacher.my-classroom-visits.sign');

    // Teacher's Lesson Preparations
    Route::resource('/teacher/lesson-preparations', \App\Http\Controllers\Teacher\LessonPreparationController::class)->names([
        'index'   => 'teacher.lesson-preparations.index',
        'store'   => 'teacher.lesson-preparations.store',
        'update'  => 'teacher.lesson-preparations.update',
        'destroy' => 'teacher.lesson-preparations.destroy',
    ])->except(['create', 'show', 'edit']);

    // Teacher's Study Plans
    Route::resource('/teacher/study-plans', \App\Http\Controllers\Teacher\StudyPlanController::class)->names([
        'index'   => 'teacher.study-plans.index',
        'store'   => 'teacher.study-plans.store',
        'update'  => 'teacher.study-plans.update',
        'destroy' => 'teacher.study-plans.destroy',
    ])->except(['create', 'show', 'edit']);
    Route::get('/teacher/study-plans/{studyPlan}/download', [\App\Http\Controllers\Teacher\StudyPlanController::class, 'download'])->name('teacher.study-plans.download');

    // Teacher's Follow-up Books
    Route::get('/teacher/followup-books', [\App\Http\Controllers\Teacher\FollowupBookController::class, 'index'])->name('teacher.followup-books.index');
    Route::get('/teacher/followup-books/show', [\App\Http\Controllers\Teacher\FollowupBookController::class, 'show'])->name('teacher.followup-books.show');
    Route::post('/teacher/followup-books', [\App\Http\Controllers\Teacher\FollowupBookController::class, 'store'])->name('teacher.followup-books.store');

    // Admin's Follow-up Books
    Route::middleware('permission:إدارة دفاتر المتابعة')->group(function () {
        Route::get('/admin/followup-books/export', [\App\Http\Controllers\Admin\FollowupBookController::class, 'export'])->name('admin.followup-books.export');
        Route::get('/admin/followup-books', [\App\Http\Controllers\Admin\FollowupBookController::class, 'index'])->name('admin.followup-books.index');
        Route::get('/admin/followup-books/{teacher}', [\App\Http\Controllers\Admin\FollowupBookController::class, 'show'])->name('admin.followup-books.show');
        Route::post('/admin/followup-books/settings', [\App\Http\Controllers\Admin\FollowupBookController::class, 'updateSettings'])->name('admin.followup-books.settings');
    });

    Route::middleware('permission:إدارة الطلاب')->group(function () {
        // Parents
        Route::post('/academic/parents/quick-store', [\App\Http\Controllers\Academic\ParentController::class, 'quickStore'])->name('academic.parents.quick-store');
        Route::resource('/academic/parents', \App\Http\Controllers\Academic\ParentController::class)->names([
            'index'   => 'academic.parents',
            'create'  => 'academic.parents.create',
            'store'   => 'academic.parents.store',
            'edit'    => 'academic.parents.edit',
            'update'  => 'academic.parents.update',
            'destroy' => 'academic.parents.destroy',
        ]);

        // Students & Enrollments
        Route::resource('/academic/students', \App\Http\Controllers\Academic\StudentController::class)->names([
            'index'   => 'academic.students',
            'create'  => 'academic.students.create',
            'store'   => 'academic.students.store',
            'edit'    => 'academic.students.edit',
            'destroy' => 'academic.students.destroy',
        ]);

        // Bulk Promotion
        Route::get('/academic/promotions', [\App\Http\Controllers\Academic\PromotionController::class, 'index'])->name('academic.promotions');
        Route::post('/academic/promotions/students', [\App\Http\Controllers\Academic\PromotionController::class, 'students'])->name('academic.promotions.students');
        Route::post('/academic/promotions', [\App\Http\Controllers\Academic\PromotionController::class, 'promote'])->name('academic.promotions.promote');


        // Student Attendance Reports
        Route::get('/academic/attendances', [\App\Http\Controllers\StudentAttendanceController::class, 'index'])->name('academic.attendances.index');
        Route::get('/academic/class-attendances', [\App\Http\Controllers\StudentAttendanceController::class, 'classReports'])->name('academic.attendances.classes');
        
        // Result Periods
        Route::resource('/academic/result-periods', \App\Http\Controllers\Academic\ResultPeriodController::class)->names([
            'index'   => 'academic.result-periods.index',
            'store'   => 'academic.result-periods.store',
            'update'  => 'academic.result-periods.update',
            'destroy' => 'academic.result-periods.destroy',
        ])->except(['create', 'edit', 'show']);

        // Subject Grade Settings
        Route::get('/academic/subject-grade-settings', [\App\Http\Controllers\Academic\SubjectGradeSettingController::class, 'index'])->name('academic.subject-grade-settings.index');
        Route::post('/academic/subject-grade-settings', [\App\Http\Controllers\Academic\SubjectGradeSettingController::class, 'store'])->name('academic.subject-grade-settings.store');
        
        // Monthly Grades for Teachers & Admin
        Route::get('/academic/monthly-grades', [\App\Http\Controllers\Academic\MonthlyGradeController::class, 'index'])->name('academic.monthly-grades.index');
        Route::get('/academic/monthly-grades/division/{division}/subject/{subject_id}/period/{period}', [\App\Http\Controllers\Academic\MonthlyGradeController::class, 'gradeEntry'])->name('academic.monthly-grades.entry');
        Route::post('/academic/monthly-grades/division/{division}/subject/{subject_id}/period/{period}', [\App\Http\Controllers\Academic\MonthlyGradeController::class, 'storeGrades'])->name('academic.monthly-grades.store');
    });

    // ── HR Routes ──
    Route::middleware('permission:إدارة الأقسام')->group(function () {
        Route::resource('/hr/departments', \App\Http\Controllers\HR\DepartmentController::class)->names([
            'index'   => 'hr.departments',
            'store'   => 'hr.departments.store',
            'update'  => 'hr.departments.update',
            'destroy' => 'hr.departments.destroy',
        ]);
    });

    Route::middleware('permission:إدارة الدرجات الوظيفية')->group(function () {
        Route::resource('/hr/job-grades', \App\Http\Controllers\HR\JobGradeController::class)->names([
            'index'   => 'hr.job-grades',
            'store'   => 'hr.job-grades.store',
            'update'  => 'hr.job-grades.update',
            'destroy' => 'hr.job-grades.destroy',
        ]);
    });

    Route::middleware('permission:إدارة الموظفين')->group(function () {
        Route::get('/hr/employees/import/template', [\App\Http\Controllers\HR\EmployeeController::class, 'downloadTemplate'])->name('hr.employees.template');
        Route::post('/hr/employees/import', [\App\Http\Controllers\HR\EmployeeController::class, 'import'])->name('hr.employees.import');
        Route::patch('/hr/employees/{employee}/quick-update', [\App\Http\Controllers\HR\EmployeeController::class, 'quickUpdate'])->name('hr.employees.quick-update');
        Route::resource('/hr/employees', \App\Http\Controllers\HR\EmployeeController::class)->names([
            'index'   => 'hr.employees',
            'create'  => 'hr.employees.create',
            'store'   => 'hr.employees.store',
            'edit'    => 'hr.employees.edit',
            'update'  => 'hr.employees.update',
            'destroy' => 'hr.employees.destroy',
        ]);
    });


    // ── Violations (المخالفات) ──
    Route::middleware('permission:إدارة أنواع المخالفات')->group(function () {
        Route::resource('/hr/violation-types', \App\Http\Controllers\HR\ViolationTypeController::class)->names([
            'index'   => 'hr.violation-types',
            'store'   => 'hr.violation-types.store',
            'update'  => 'hr.violation-types.update',
            'destroy' => 'hr.violation-types.destroy',
        ])->except(['create', 'edit', 'show']);
    });

    Route::middleware('permission:إدارة المخالفات')->group(function () {
        Route::resource('/hr/employee-violations', \App\Http\Controllers\HR\EmployeeViolationController::class)->names([
            'index'   => 'hr.employee-violations',
            'store'   => 'hr.employee-violations.store',
            'update'  => 'hr.employee-violations.update',
            'destroy' => 'hr.employee-violations.destroy',
        ])->except(['create', 'edit', 'show']);
        
        Route::get('/hr/employee-violations/check-repetition', [\App\Http\Controllers\HR\EmployeeViolationController::class, 'checkRepetition'])->name('hr.employee-violations.check-repetition');
        Route::put('/hr/employee-violations/{violation}/status', [\App\Http\Controllers\HR\EmployeeViolationController::class, 'updateStatus'])->name('hr.employee-violations.update-status');
        Route::post('/hr/employee-violations/{violation}/notify', [\App\Http\Controllers\HR\EmployeeViolationController::class, 'notifyForSignature'])->name('hr.employee-violations.notify');
    });

    Route::middleware('permission:عرض مخالفاتي')->group(function () {
        Route::get('/hr/my-violations', [\App\Http\Controllers\HR\MyViolationController::class, 'index'])->name('hr.my-violations');
        Route::post('/hr/my-violations/{violation}/sign', [\App\Http\Controllers\HR\MyViolationController::class, 'sign'])->name('hr.my-violations.sign');
    });

    // ── Achievements (الإنجازات) ──
    Route::middleware('permission:عرض أنواع الإنجازات')->group(function () {
        Route::resource('/hr/achievement-types', \App\Http\Controllers\HR\AchievementTypeController::class)->names([
            'index'   => 'hr.achievement-types',
            'store'   => 'hr.achievement-types.store',
            'update'  => 'hr.achievement-types.update',
            'destroy' => 'hr.achievement-types.destroy',
        ])->except(['create', 'edit', 'show']);
    });

    Route::middleware('permission:عرض الإنجازات')->group(function () {
        Route::resource('/hr/employee-achievements', \App\Http\Controllers\HR\EmployeeAchievementController::class)->names([
            'index'   => 'hr.employee-achievements',
            'store'   => 'hr.employee-achievements.store',
            'update'  => 'hr.employee-achievements.update',
            'destroy' => 'hr.employee-achievements.destroy',
        ])->except(['create', 'edit', 'show']);
        
        Route::post('/hr/employee-achievements/{achievement}/notify', [\App\Http\Controllers\HR\EmployeeAchievementController::class, 'notifyForSignature'])->name('hr.employee-achievements.notify');
        Route::post('/hr/employee-achievements/{achievement}/broadcast', [\App\Http\Controllers\HR\EmployeeAchievementController::class, 'broadcast'])->name('hr.employee-achievements.broadcast');
        Route::get('/hr/employee-achievements/{achievement}/certificate', [\App\Http\Controllers\HR\EmployeeAchievementController::class, 'certificate'])->name('hr.employee-achievements.certificate');
    });

    // لا نضع صلاحية مخصصة هنا ليتمكن كل موظف من رؤية إنجازاته بمجرد تسجيل الدخول
    Route::get('/hr/my-achievements', [\App\Http\Controllers\HR\MyAchievementController::class, 'index'])->name('hr.my-achievements');
    Route::post('/hr/my-achievements/{achievement}/sign', [\App\Http\Controllers\HR\MyAchievementController::class, 'sign'])->name('hr.my-achievements.sign');



    // ── Shifts ──
    Route::middleware('permission:إدارة الشفتات')->group(function () {
        Route::get('/hr/shifts', [\App\Http\Controllers\HR\ShiftController::class, 'index'])->name('hr.shifts');
        Route::post('/hr/shifts', [\App\Http\Controllers\HR\ShiftController::class, 'store'])->name('hr.shifts.store');
        Route::put('/hr/shifts/{shift}', [\App\Http\Controllers\HR\ShiftController::class, 'update'])->name('hr.shifts.update');
        Route::delete('/hr/shifts/{shift}', [\App\Http\Controllers\HR\ShiftController::class, 'destroy'])->name('hr.shifts.destroy');
    });

    // ── Holidays & Leaves ──
    Route::middleware('permission:إدارة الموظفين')->group(function () {
        Route::post('/hr/holidays/bulk-delete', [\App\Http\Controllers\HR\HolidayController::class, 'bulkDestroy'])->name('hr.holidays.bulk-destroy');
        Route::resource('/hr/holidays', \App\Http\Controllers\HR\HolidayController::class)->names([
            'index'   => 'hr.holidays',
            'store'   => 'hr.holidays.store',
            'update'  => 'hr.holidays.update',
            'destroy' => 'hr.holidays.destroy',
        ])->except(['create', 'edit', 'show']);

        Route::resource('/hr/leaves', \App\Http\Controllers\HR\LeaveController::class)->names([
            'index'   => 'hr.leaves',
            'store'   => 'hr.leaves.store',
            'update'  => 'hr.leaves.update',
            'destroy' => 'hr.leaves.destroy',
        ])->except(['create', 'edit', 'show']);

        Route::resource('/hr/leave-types', \App\Http\Controllers\HR\LeaveTypeController::class)->names([
            'index'   => 'hr.leave-types',
            'store'   => 'hr.leave-types.store',
            'update'  => 'hr.leave-types.update',
            'destroy' => 'hr.leave-types.destroy',
        ])->except(['create', 'edit', 'show']);

        Route::get('/hr/leave-balances', [\App\Http\Controllers\HR\LeaveBalanceController::class, 'index'])->name('hr.leave-balances');
        Route::post('/hr/leave-balances', [\App\Http\Controllers\HR\LeaveBalanceController::class, 'store'])->name('hr.leave-balances.store');
        Route::post('/hr/leave-balances/generate', [\App\Http\Controllers\HR\LeaveBalanceController::class, 'generate'])->name('hr.leave-balances.generate');
        Route::delete('/hr/leave-balances/{leaveBalance}', [\App\Http\Controllers\HR\LeaveBalanceController::class, 'destroy'])->name('hr.leave-balances.destroy');
    });

    // ── Attendance ──
    Route::middleware('permission:إدارة الحضور والانصراف')->group(function () {
        Route::get('/hr/attendance', [\App\Http\Controllers\HR\AttendanceController::class, 'index'])->name('hr.attendance');
        Route::get('/hr/attendance/report', [\App\Http\Controllers\HR\AttendanceController::class, 'report'])->name('hr.attendance.report');
        Route::get('/hr/attendance/employee-report/{employeeId}', [\App\Http\Controllers\Api\AttendanceApiController::class, 'employeeReport'])->name('hr.attendance.employee-report');
        Route::post('/hr/attendance', [\App\Http\Controllers\HR\AttendanceController::class, 'store'])->name('hr.attendance.store');
        Route::post('/hr/attendance/bulk-update', [\App\Http\Controllers\HR\AttendanceController::class, 'bulkUpdate'])->name('hr.attendance.bulk-update');
        Route::put('/hr/attendance/{attendance}', [\App\Http\Controllers\HR\AttendanceController::class, 'update'])->name('hr.attendance.update');
    });
    // ── Reports ──
    Route::middleware('permission:إدارة قوالب التقارير')->group(function () {
        Route::resource('/hr/reports/templates', \App\Http\Controllers\HR\ReportTemplateController::class)->names([
            'index'   => 'reports.templates',
            'store'   => 'reports.templates.store',
            'update'  => 'reports.templates.update',
            'destroy' => 'reports.templates.destroy',
        ])->except(['create', 'show', 'edit']);

        Route::put('/hr/reports/templates/{template}/fields', [\App\Http\Controllers\HR\ReportTemplateController::class, 'updateFields'])->name('reports.templates.fields.update');

    });

    // My Reports (Employee Side) - Accessible to all authenticated users
    Route::get('/hr/reports/my-reports', [\App\Http\Controllers\HR\MyReportController::class, 'index'])->name('hr.reports.my-reports.index');
    Route::get('/hr/reports/my-reports/create/{template}', [\App\Http\Controllers\HR\MyReportController::class, 'create'])->name('hr.reports.my-reports.create');
    Route::post('/hr/reports/my-reports/{template}', [\App\Http\Controllers\HR\MyReportController::class, 'store'])->name('hr.reports.my-reports.store');
    Route::get('/hr/reports/my-reports/show/{report}', [\App\Http\Controllers\HR\MyReportController::class, 'show'])->name('hr.reports.my-reports.show');
    Route::delete('/hr/reports/my-reports/{report}', [\App\Http\Controllers\HR\MyReportController::class, 'destroy'])->name('hr.reports.my-reports.destroy');

    Route::middleware('permission:إدارة التقارير')->group(function () {
        Route::get('/hr/reports', [\App\Http\Controllers\HR\ReportController::class, 'index'])->name('reports.index');
        Route::get('/hr/reports/template/{template}', [\App\Http\Controllers\HR\ReportController::class, 'showTemplate'])->name('reports.submit.view');
        Route::post('/hr/reports/template/{template}', [\App\Http\Controllers\HR\ReportController::class, 'store'])->name('reports.store');
        Route::get('/hr/reports/{report}', [\App\Http\Controllers\HR\ReportController::class, 'show'])->name('reports.show');
        Route::post('/hr/reports/{report}/review', [\App\Http\Controllers\HR\ReportController::class, 'review'])->name('reports.review');
        Route::delete('/hr/reports/{report}', [\App\Http\Controllers\HR\ReportController::class, 'destroy'])->name('reports.destroy');
    });

    // ── Meetings ──
    Route::middleware('permission:إدارة الاجتماعات')->group(function () {
        Route::resource('/meetings', \App\Http\Controllers\HR\MeetingController::class)->names([
            'index'   => 'meetings.index',
            'store'   => 'meetings.store',
            'show'    => 'meetings.show',
            'update'  => 'meetings.update',
            'destroy' => 'meetings.destroy',
        ]);
        
        Route::post('/meetings/{meeting}/attendance', [\App\Http\Controllers\HR\MeetingController::class, 'updateAttendance'])->name('meetings.attendance');
        Route::post('/meetings/{meeting}/complete', [\App\Http\Controllers\HR\MeetingController::class, 'completeMeeting'])->name('meetings.complete');
        Route::post('/meetings/{meeting}/remind', [\App\Http\Controllers\HR\MeetingController::class, 'remindParticipants'])->name('meetings.remind');
        Route::post('/meetings/{meeting}/attachments', [\App\Http\Controllers\HR\MeetingController::class, 'uploadAttachment'])->name('meetings.attachments.store');
        Route::delete('/meetings/{meeting}/attachments/{index}', [\App\Http\Controllers\HR\MeetingController::class, 'deleteAttachment'])->name('meetings.attachments.destroy');
    });

    // ── Employee Requests ──
    Route::middleware('permission:إدارة طلبات الموظفين')->group(function () {
        Route::get('/hr/requests', [\App\Http\Controllers\HR\EmployeeRequestController::class, 'index'])->name('hr.requests.index');
        Route::post('/hr/requests/{employeeRequest}/review', [\App\Http\Controllers\HR\EmployeeRequestController::class, 'review'])->name('hr.requests.review');
    });

    // Employee side - accessible to all authenticated users with an employee record
    Route::get('/hr/my-requests', [\App\Http\Controllers\HR\EmployeeRequestController::class, 'myRequests'])->name('hr.my-requests.index');
    Route::post('/hr/my-requests', [\App\Http\Controllers\HR\EmployeeRequestController::class, 'store'])->name('hr.my-requests.store');
});

require __DIR__.'/auth.php';

