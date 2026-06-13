<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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

        // Subjects
        Route::get('/academic/subjects', [\App\Http\Controllers\Academic\SubjectController::class, 'index'])->name('academic.subjects.index');
        Route::post('/academic/subjects', [\App\Http\Controllers\Academic\SubjectController::class, 'store'])->name('academic.subjects.store');
        Route::put('/academic/subjects/{subject}', [\App\Http\Controllers\Academic\SubjectController::class, 'update'])->name('academic.subjects.update');
        Route::delete('/academic/subjects/{subject}', [\App\Http\Controllers\Academic\SubjectController::class, 'destroy'])->name('academic.subjects.destroy');

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
        
        // Teacher's Timetable
        Route::get('/academic/my-timetable', [\App\Http\Controllers\Academic\TimetableController::class, 'myTimetable'])->name('academic.my-timetable');

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
            'update'  => 'academic.students.update',
            'destroy' => 'academic.students.destroy',
        ]);
    });

    // ── HR Routes ──
    Route::resource('/hr/departments', \App\Http\Controllers\HR\DepartmentController::class)->names([
        'index'   => 'hr.departments',
        'store'   => 'hr.departments.store',
        'update'  => 'hr.departments.update',
        'destroy' => 'hr.departments.destroy',
    ]);
    Route::resource('/hr/job-grades', \App\Http\Controllers\HR\JobGradeController::class)->names([
        'index'   => 'hr.job-grades',
        'store'   => 'hr.job-grades.store',
        'update'  => 'hr.job-grades.update',
        'destroy' => 'hr.job-grades.destroy',
    ]);
    Route::patch('/hr/employees/{employee}/quick-update', [\App\Http\Controllers\HR\EmployeeController::class, 'quickUpdate'])->name('hr.employees.quick-update');
    Route::resource('/hr/employees', \App\Http\Controllers\HR\EmployeeController::class)->names([
        'index'   => 'hr.employees',
        'create'  => 'hr.employees.create',
        'store'   => 'hr.employees.store',
        'edit'    => 'hr.employees.edit',
        'update'  => 'hr.employees.update',
        'destroy' => 'hr.employees.destroy',
    ]);
    Route::resource('/hr/requests', \App\Http\Controllers\HR\RequestController::class)->names([
        'index' => 'hr.requests'
    ]);
    Route::resource('/hr/approvals', \App\Http\Controllers\HR\ApprovalController::class)->names([
        'index' => 'hr.approvals'
    ]);


    // ── Shifts ──
    Route::get('/hr/shifts', [\App\Http\Controllers\HR\ShiftController::class, 'index'])->name('hr.shifts');
    Route::post('/hr/shifts', [\App\Http\Controllers\HR\ShiftController::class, 'store'])->name('hr.shifts.store');
    Route::put('/hr/shifts/{shift}', [\App\Http\Controllers\HR\ShiftController::class, 'update'])->name('hr.shifts.update');
    Route::delete('/hr/shifts/{shift}', [\App\Http\Controllers\HR\ShiftController::class, 'destroy'])->name('hr.shifts.destroy');

    // ── Holidays & Leaves ──
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

    // ── Attendance ──
    Route::get('/hr/attendance', [\App\Http\Controllers\HR\AttendanceController::class, 'index'])->name('hr.attendance');
    Route::get('/hr/attendance/report', [\App\Http\Controllers\HR\AttendanceController::class, 'report'])->name('hr.attendance.report');
    Route::post('/hr/attendance', [\App\Http\Controllers\HR\AttendanceController::class, 'store'])->name('hr.attendance.store');
    Route::post('/hr/attendance/bulk-update', [\App\Http\Controllers\HR\AttendanceController::class, 'bulkUpdate'])->name('hr.attendance.bulk-update');
    Route::put('/hr/attendance/{attendance}', [\App\Http\Controllers\HR\AttendanceController::class, 'update'])->name('hr.attendance.update');
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

    Route::middleware('permission:إدارة التقارير')->group(function () {
        Route::get('/hr/reports', [\App\Http\Controllers\HR\ReportController::class, 'index'])->name('reports.index');
        Route::get('/hr/reports/template/{template}', [\App\Http\Controllers\HR\ReportController::class, 'showTemplate'])->name('reports.submit.view');
        Route::post('/hr/reports/template/{template}', [\App\Http\Controllers\HR\ReportController::class, 'store'])->name('reports.store');
        Route::get('/hr/reports/{report}', [\App\Http\Controllers\HR\ReportController::class, 'show'])->name('reports.show');
        Route::post('/hr/reports/{report}/review', [\App\Http\Controllers\HR\ReportController::class, 'review'])->name('reports.review');
    });

    // ── Meetings ──
    Route::middleware('permission:إدارة الاجتماعات')->group(function () {
        Route::resource('/meetings', \App\Http\Controllers\HR\MeetingController::class)->names([
            'index'   => 'meetings.index',
            'store'   => 'meetings.store',
            'show'    => 'meetings.show',
            'destroy' => 'meetings.destroy',
        ])->except(['create', 'edit', 'update']);
        
        Route::post('/meetings/{meeting}/attendance', [\App\Http\Controllers\HR\MeetingController::class, 'updateAttendance'])->name('meetings.attendance');
        Route::post('/meetings/{meeting}/complete', [\App\Http\Controllers\HR\MeetingController::class, 'completeMeeting'])->name('meetings.complete');
    });
});

require __DIR__.'/auth.php';
