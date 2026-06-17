<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Branch;
use App\Models\Department;
use App\Models\JobGrade;
use App\Models\Shift;
use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::first();
        if (!$branch) return;

        // 1. Departments
        $departments = [
            ['name' => 'الإدارة العليا', 'branch_id' => $branch->id],
            ['name' => 'الشؤون الأكاديمية', 'branch_id' => $branch->id],
            ['name' => 'شؤون الطلاب', 'branch_id' => $branch->id],
            ['name' => 'الموارد البشرية', 'branch_id' => $branch->id],
            ['name' => 'المالية', 'branch_id' => $branch->id],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(['name' => $dept['name'], 'branch_id' => $branch->id], $dept);
        }

        // 2. Job Grades
        $jobGrades = [
            ['name' => 'مدير عام', 'level' => 1, 'branch_id' => $branch->id],
            ['name' => 'مدير قسم', 'level' => 2, 'branch_id' => $branch->id],
            ['name' => 'معلم', 'level' => 3, 'branch_id' => $branch->id],
            ['name' => 'إداري', 'level' => 3, 'branch_id' => $branch->id],
            ['name' => 'حارس أمن', 'level' => 4, 'branch_id' => $branch->id],
        ];

        foreach ($jobGrades as $grade) {
            JobGrade::firstOrCreate(['name' => $grade['name'], 'branch_id' => $branch->id], $grade);
        }

        // 3. Shifts
        $shift = Shift::firstOrCreate(
            ['name' => 'الدوام الصباحي', 'branch_id' => $branch->id],
            [
                'start_time' => '07:00',
                'end_time' => '14:00',
                'grace_period_minutes' => 15,
            ]
        );

        // 4. Employees & Users
        $teacherRole = Role::where('name', 'معلم')->first();
        $hrDept = Department::where('name', 'الموارد البشرية')->first();
        $academicDept = Department::where('name', 'الشؤون الأكاديمية')->first();
        $adminGrade = JobGrade::where('name', 'إداري')->first();
        $teacherGrade = JobGrade::where('name', 'معلم')->first();

        // Create 3 Teachers
        for ($i = 1; $i <= 3; $i++) {
            $user = User::firstOrCreate(
                ['username' => "teacher$i"],
                [
                    'name' => "معلم تجريبي $i",
                    'password' => Hash::make('password'),
                    'email' => "teacher$i@school.com",
                    'phone' => "050000000$i",
                    'role_id' => $teacherRole->id,
                    'branch_id' => $branch->id,
                    'is_active' => true,
                ]
            );

            $emp = Employee::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'department_id' => $academicDept->id,
                    'job_grade_id' => $teacherGrade->id,
                    'job_title' => 'معلم',
                    'hire_date' => now()->subMonths(rand(1, 24)),
                ]
            );
            
            $emp->shifts()->sync([
                $shift->id => [
                    'branch_id' => $branch->id,
                    'working_days' => json_encode([0, 1, 2, 3, 4])
                ]
            ]);
        }
    }
}
