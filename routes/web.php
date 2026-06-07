<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

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

    // ── Permissions & Roles ──
    Route::get('/admin/permissions', [\App\Http\Controllers\Admin\PermissionController::class, 'index'])->name('admin.permissions');
    Route::post('/admin/roles', [\App\Http\Controllers\Admin\PermissionController::class, 'storeRole'])->name('admin.roles.store');
    Route::delete('/admin/roles/{role}', [\App\Http\Controllers\Admin\PermissionController::class, 'destroyRole'])->name('admin.roles.destroy');
    Route::post('/admin/roles/{role}/permissions', [\App\Http\Controllers\Admin\PermissionController::class, 'syncRolePermissions'])->name('admin.roles.permissions');

    // ── Settings ──
    Route::get('/admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index'])->name('admin.settings');
    Route::post('/admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update'])->name('admin.settings.update');

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
        'index' => 'hr.employees'
    ]);
    Route::resource('/hr/requests', \App\Http\Controllers\HR\RequestController::class)->names([
        'index' => 'hr.requests'
    ]);
    Route::resource('/hr/approvals', \App\Http\Controllers\HR\ApprovalController::class)->names([
        'index' => 'hr.approvals'
    ]);

    // ── Branches ──
    Route::get('/hr/branches', [\App\Http\Controllers\HR\BranchController::class, 'index'])->name('hr.branches');
    Route::post('/hr/branches', [\App\Http\Controllers\HR\BranchController::class, 'store'])->name('hr.branches.store');
    Route::put('/hr/branches/{branch}', [\App\Http\Controllers\HR\BranchController::class, 'update'])->name('hr.branches.update');
    Route::delete('/hr/branches/{branch}', [\App\Http\Controllers\HR\BranchController::class, 'destroy'])->name('hr.branches.destroy');

    // ── Shifts ──
    Route::get('/hr/shifts', [\App\Http\Controllers\HR\ShiftController::class, 'index'])->name('hr.shifts');
    Route::post('/hr/shifts', [\App\Http\Controllers\HR\ShiftController::class, 'store'])->name('hr.shifts.store');
    Route::put('/hr/shifts/{shift}', [\App\Http\Controllers\HR\ShiftController::class, 'update'])->name('hr.shifts.update');
    Route::delete('/hr/shifts/{shift}', [\App\Http\Controllers\HR\ShiftController::class, 'destroy'])->name('hr.shifts.destroy');

    // ── Attendance ──
    Route::get('/hr/attendance', [\App\Http\Controllers\HR\AttendanceController::class, 'index'])->name('hr.attendance');
    Route::post('/hr/attendance', [\App\Http\Controllers\HR\AttendanceController::class, 'store'])->name('hr.attendance.store');
    Route::post('/hr/attendance/bulk-update', [\App\Http\Controllers\HR\AttendanceController::class, 'bulkUpdate'])->name('hr.attendance.bulk-update');
    Route::put('/hr/attendance/{attendance}', [\App\Http\Controllers\HR\AttendanceController::class, 'update'])->name('hr.attendance.update');
});

require __DIR__.'/auth.php';
