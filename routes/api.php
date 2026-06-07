<?php

use App\Http\Controllers\Api\AttendanceApiController;
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

// Attendance API (requires employee API token later — for now open for development)
Route::prefix('attendance')->group(function () {
    Route::post('/check-in',  [AttendanceApiController::class, 'checkIn']);
    Route::post('/check-out', [AttendanceApiController::class, 'checkOut']);
    Route::get('/report/{employeeId}', [AttendanceApiController::class, 'employeeReport']);
});
