<?php

use App\Http\Controllers\Api\AttendanceApiController;
use App\Http\Controllers\Api\MobileAuthController;
use App\Http\Controllers\Api\MobileFeaturesController;
use App\Http\Controllers\Api\V1\BranchManagerController;
use App\Http\Controllers\Api\V1\UserController;
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
    // Teacher
    Route::get('/timetable', [MobileFeaturesController::class, 'getTimetable']);
    Route::get('/preparations', [MobileFeaturesController::class, 'getPreparations']);
    Route::get('/preparations/form-data', [MobileFeaturesController::class, 'getPreparationFormData']);
    Route::post('/preparations', [MobileFeaturesController::class, 'storePreparation']);
    Route::put('/preparations/{lessonPreparation}', [MobileFeaturesController::class, 'updatePreparation']);
    Route::delete('/preparations/{lessonPreparation}', [MobileFeaturesController::class, 'deletePreparation']);
    
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

    // Employee Achievements
    Route::get('/achievements', [MobileFeaturesController::class, 'getAchievements']);
});
