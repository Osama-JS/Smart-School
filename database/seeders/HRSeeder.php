<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use App\Models\Department;
use App\Models\JobGrade;
use App\Models\Employee;
use App\Models\Shift;

class HRSeeder extends Seeder
{
    public function run(): void
    {
        $mainBranch   = Branch::where('name', 'الفرع الرئيسي')->first();
        $jeddahBranch = Branch::where('name', 'فرع جدة')->first();
        $teacherRole  = Role::where('name', 'معلم')->first();
        $adminRole    = Role::where('name', 'إداري')->first();
        $supervisorRole = Role::where('name', 'مشرف تربوي')->first();

        // ── 1. الدرجات الوظيفية (مشتركة) ──
        $gradesData = [
            ['name' => 'مدير الفرع',       'level' => 1],
            ['name' => 'مدير إدارة',     'level' => 2],
            ['name' => 'رئيس قسم',       'level' => 3],
            ['name' => 'مشرف تربوي',     'level' => 4],
            ['name' => 'أخصائي شؤون',    'level' => 5],
            ['name' => 'معلم أول',        'level' => 6],
            ['name' => 'معلم',            'level' => 7],
            ['name' => 'إداري عام',       'level' => 8],
            ['name' => 'موظف خدمات',     'level' => 9],
        ];

        $gradeIds = [];
        foreach ($gradesData as $grade) {
            $obj = JobGrade::firstOrCreate(['name' => $grade['name']], $grade);
            $gradeIds[$grade['name']] = $obj->id;
        }

        $this->command->info('  ✅ Job Grades seeded: ' . count($gradeIds));

        // ── 2. الأقسام (للفرع الرئيسي) ──
        $topDept  = Department::firstOrCreate(['name' => 'الإدارة العليا',     'branch_id' => $mainBranch->id, 'parent_id' => null]);
        $academic = Department::firstOrCreate(['name' => 'الشؤون الأكاديمية', 'branch_id' => $mainBranch->id, 'parent_id' => $topDept->id]);
        $hr       = Department::firstOrCreate(['name' => 'الموارد البشرية',   'branch_id' => $mainBranch->id, 'parent_id' => $topDept->id]);
        $it       = Department::firstOrCreate(['name' => 'تقنية المعلومات',   'branch_id' => $mainBranch->id, 'parent_id' => $topDept->id]);
        $students = Department::firstOrCreate(['name' => 'شؤون الطلاب',       'branch_id' => $mainBranch->id, 'parent_id' => $academic->id]);
        $guidance = Department::firstOrCreate(['name' => 'التوجيه والإرشاد',  'branch_id' => $mainBranch->id, 'parent_id' => $academic->id]);

        // أقسام فرع جدة
        $jTopDept  = Department::firstOrCreate(['name' => 'الإدارة العليا',     'branch_id' => $jeddahBranch->id, 'parent_id' => null]);
        $jAcademic = Department::firstOrCreate(['name' => 'الشؤون الأكاديمية', 'branch_id' => $jeddahBranch->id, 'parent_id' => $jTopDept->id]);
        $jHr       = Department::firstOrCreate(['name' => 'الموارد البشرية',   'branch_id' => $jeddahBranch->id, 'parent_id' => $jTopDept->id]);

        $this->command->info('  ✅ Departments seeded.');

        // ── 3. الشفتات ──
        Shift::firstOrCreate(['name' => 'الفترة الصباحية'], [
            'start_time'           => '07:00',
            'end_time'             => '14:00',
            'grace_period_minutes' => 15,
            'is_active'            => true,
        ]);

        Shift::firstOrCreate(['name' => 'الفترة المسائية'], [
            'start_time'           => '14:00',
            'end_time'             => '21:00',
            'grace_period_minutes' => 15,
            'is_active'            => true,
        ]);

        $this->command->info('  ✅ Shifts seeded.');

        // ── 4. الموظفون (الفرع الرئيسي) ──
        $employeesData = [
            ['name' => 'أحمد محمود الزهراني',   'username' => 'ahmed.z',   'dept' => $topDept->id,  'grade' => $gradeIds['مدير الفرع'],     'hire' => '2018-09-01', 'role' => $adminRole],
            ['name' => 'سارة خالد العمري',        'username' => 'sara.o',    'dept' => $hr->id,        'grade' => $gradeIds['مدير إدارة'],   'hire' => '2019-03-15', 'role' => $adminRole],
            ['name' => 'عمر عبدالله القحطاني',   'username' => 'omar.q',    'dept' => $it->id,        'grade' => $gradeIds['رئيس قسم'],     'hire' => '2020-01-10', 'role' => $adminRole],
            ['name' => 'فهد علي الدوسري',          'username' => 'fahad.d',   'dept' => $academic->id,  'grade' => $gradeIds['مشرف تربوي'],   'hire' => '2020-09-05', 'role' => $supervisorRole],
            ['name' => 'منى سعد الغامدي',          'username' => 'mona.g',    'dept' => $students->id,  'grade' => $gradeIds['معلم أول'],     'hire' => '2022-01-15', 'role' => $teacherRole],
            ['name' => 'خالد ناصر العتيبي',        'username' => 'khaled.a',  'dept' => $it->id,        'grade' => $gradeIds['إداري عام'],    'hire' => '2022-06-01', 'role' => $adminRole],
            ['name' => 'رنا يوسف الشمري',          'username' => 'rana.sh',   'dept' => $guidance->id,  'grade' => $gradeIds['أخصائي شؤون'],  'hire' => '2021-03-22', 'role' => $teacherRole],
            ['name' => 'محمد حسين الزيد',          'username' => 'mohd.z',    'dept' => $academic->id,  'grade' => $gradeIds['مشرف تربوي'],   'hire' => '2019-11-01', 'role' => $supervisorRole],
            ['name' => 'هند عبدالرحمن المطيري',    'username' => 'hend.m',    'dept' => $hr->id,        'grade' => $gradeIds['إداري عام'],    'hire' => '2023-02-10', 'role' => $adminRole],
            ['name' => 'نورة محمد السلمي',          'username' => 'noura.s',   'dept' => $hr->id,        'grade' => $gradeIds['أخصائي شؤون'], 'hire' => '2021-08-20', 'role' => $adminRole],
        ];

        foreach ($employeesData as $data) {
            $user = User::firstOrCreate(['username' => $data['username']], [
                'branch_id' => $mainBranch->id,
                'role_id'   => $data['role']->id,
                'name'      => $data['name'],
                'password'  => Hash::make('password'),
                'is_active' => true,
            ]);

            Employee::firstOrCreate(['user_id' => $user->id], [
                'department_id' => $data['dept'],
                'job_grade_id'  => $data['grade'],
                'hire_date'     => $data['hire'],
            ]);
        }

        // إنشاء سجل موظف لمدير الفرع الرئيسي
        $mainManager = User::where('username', 'manager.main')->first();
        if ($mainManager) {
            Employee::firstOrCreate(['user_id' => $mainManager->id], [
                'department_id' => $topDept->id,
                'job_grade_id'  => $gradeIds['مدير إدارة'],
                'hire_date'     => '2020-01-01',
            ]);
        }

        $jeddahManager = User::where('username', 'manager.jeddah')->first();
        if ($jeddahManager) {
            Employee::firstOrCreate(['user_id' => $jeddahManager->id], [
                'department_id' => $jTopDept->id,
                'job_grade_id'  => $gradeIds['مدير إدارة'],
                'hire_date'     => '2020-01-01',
            ]);
        }

        $this->command->info('  ✅ Employees seeded.');
    }
}
