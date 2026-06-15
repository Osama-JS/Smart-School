<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use App\Models\Branch;
use App\Models\Role;
use App\Models\AcademicYear;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InstallController extends Controller
{
    public function index()
    {
        // Double check if already installed
        if (User::count() > 0) {
            return redirect('/');
        }
        
        return Inertia::render('Install/Wizard');
    }

    public function runStep(Request $request)
    {
        // Must return JSON for axios
        $step = $request->input('step');
        
        try {
            switch ($step) {
                case 'migrate':
                    Artisan::call('migrate', ['--force' => true]);
                    return response()->json(['success' => true, 'message' => 'تم تهيئة الجداول (Migrations) بنجاح.']);
                    
                case 'branch_and_roles':
                    DB::beginTransaction();
                    $validated = $request->validate([
                        'branch_name' => 'required|string|max:255',
                        'branch_address' => 'nullable|string|max:255',
                        'branch_phone' => 'nullable|string|max:20',
                        'academic_year_name' => 'required|string|max:255',
                        'academic_year_start' => 'required|date',
                        'academic_year_end' => 'required|date|after:academic_year_start',
                    ]);

                    $branch = Branch::create([
                        'name' => $validated['branch_name'],
                        'address' => $validated['branch_address'],
                        'phone' => $validated['branch_phone'],
                        'is_active' => true,
                    ]);

                    // Create first Academic Year
                    AcademicYear::create([
                        'branch_id' => $branch->id,
                        'name' => $validated['academic_year_name'],
                        'start_date' => $validated['academic_year_start'],
                        'end_date' => $validated['academic_year_end'],
                        'is_active' => true,
                    ]);

                    $rolesData = [
                        ['name' => 'مدير النظام', 'is_system_role' => true, 'access_type' => 'dashboard'],
                        ['name' => 'مدير الفرع', 'is_system_role' => true, 'access_type' => 'dashboard'],
                        ['name' => 'معلم', 'is_system_role' => true, 'access_type' => 'app'],
                        ['name' => 'طالب', 'is_system_role' => true, 'access_type' => 'app'],
                        ['name' => 'ولي أمر', 'is_system_role' => true, 'access_type' => 'app'],
                    ];

                    foreach ($rolesData as $roleData) {
                        Role::firstOrCreate(['name' => $roleData['name']], $roleData);
                    }
                    DB::commit();
                    return response()->json(['success' => true, 'message' => 'تم إعداد الفرع والسنة الدراسية والأدوار.']);

                case 'admin_and_permissions':
                    DB::beginTransaction();
                    $validated = $request->validate([
                        'admin_name' => 'required|string|max:255',
                        'admin_username' => 'required|string|unique:users,username|max:255',
                        'admin_password' => 'required|string|min:6',
                    ]);

                    $branch = Branch::first();
                    $adminRole = Role::where('name', 'مدير النظام')->first();
                    
                    $admin = User::create([
                        'name' => $validated['admin_name'],
                        'username' => $validated['admin_username'],
                        'password' => Hash::make($validated['admin_password']),
                        'role_id' => $adminRole->id,
                        'branch_id' => $branch->id,
                        'is_active' => true,
                    ]);

                    Artisan::call('db:seed', ['--class' => 'SystemPermissionsSeeder', '--force' => true]);
                    DB::commit();
                    
                    auth()->login($admin); // Automatically login
                    
                    return response()->json(['success' => true, 'message' => 'تم إنشاء مدير النظام ومنح الصلاحيات.']);

                case 'dummy_data':
                    if ($request->input('install_dummy_data')) {
                        Artisan::call('db:seed', ['--class' => 'DummyDataSeeder', '--force' => true]);
                        return response()->json(['success' => true, 'message' => 'تم توليد البيانات التجريبية.']);
                    }
                    return response()->json(['success' => true, 'message' => 'تم تخطي البيانات التجريبية.']);

                default:
                    return response()->json(['error' => 'خطوة غير صالحة'], 400);
            }
        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
