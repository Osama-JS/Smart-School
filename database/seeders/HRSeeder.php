<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HRSeeder extends Seeder
{
    public function run(): void
    {
        // 1. الدرجات الوظيفية
        $gradesData = [
            ['name' => 'مدير عام',      'level' => 10],
            ['name' => 'مدير إدارة',    'level' => 9],
            ['name' => 'رئيس قسم',      'level' => 8],
            ['name' => 'مشرف تربوي',    'level' => 7],
            ['name' => 'أخصائي شؤون',   'level' => 6],
            ['name' => 'معلم أول',       'level' => 5],
            ['name' => 'إداري عام',      'level' => 4],
        ];

        $gradeIds = [];
        foreach ($gradesData as $grade) {
            $gradeIds[$grade['name']] = \App\Models\JobGrade::create($grade)->id;
        }

        // 2. الأقسام
        $topDept  = \App\Models\Department::create(['name' => 'الإدارة العليا',     'parent_id' => null]);
        $academic = \App\Models\Department::create(['name' => 'الشؤون الأكاديمية', 'parent_id' => $topDept->id]);
        $hr       = \App\Models\Department::create(['name' => 'الموارد البشرية',   'parent_id' => $topDept->id]);
        $it       = \App\Models\Department::create(['name' => 'تقنية المعلومات',   'parent_id' => $topDept->id]);
        $students = \App\Models\Department::create(['name' => 'شؤون الطلاب',       'parent_id' => $academic->id]);
        $guidance = \App\Models\Department::create(['name' => 'التوجيه والإرشاد',  'parent_id' => $academic->id]);

        // 3. أنواع الطلبات الإدارية
        \App\Models\RequestType::create(['name' => 'إجازة اعتيادية', 'requires_approval' => true]);
        \App\Models\RequestType::create(['name' => 'إجازة مرضية',    'requires_approval' => true]);
        \App\Models\RequestType::create(['name' => 'مغادرة مبكرة',   'requires_approval' => true]);
        \App\Models\RequestType::create(['name' => 'سلفة مالية',      'requires_approval' => true]);

        // 4. جلب الـ role_id و branch_id الأول المتاح
        $adminRoleId = \App\Models\Role::first()?->id ?? 1;
        $branchId    = \App\Models\Branch::first()?->id ?? 1;

        // 5. الموظفون الوهميون
        $employeesData = [
            ['name' => 'أحمد محمود الزهراني',  'username' => 'ahmed.z',  'dept' => $topDept->id,  'grade' => $gradeIds['مدير عام'],    'hire' => '2018-09-01'],
            ['name' => 'سارة خالد العمري',      'username' => 'sara.o',   'dept' => $hr->id,       'grade' => $gradeIds['مدير إدارة'],  'hire' => '2019-03-15'],
            ['name' => 'عمر عبدالله القحطاني',  'username' => 'omar.q',   'dept' => $it->id,       'grade' => $gradeIds['رئيس قسم'],    'hire' => '2020-01-10'],
            ['name' => 'نورة محمد السلمي',      'username' => 'noura.s',  'dept' => $hr->id,       'grade' => $gradeIds['أخصائي شؤون'], 'hire' => '2021-08-20'],
            ['name' => 'فهد علي الدوسري',       'username' => 'fahad.d',  'dept' => $academic->id, 'grade' => $gradeIds['مشرف تربوي'],  'hire' => '2020-09-05'],
            ['name' => 'منى سعد الغامدي',       'username' => 'mona.g',   'dept' => $students->id, 'grade' => $gradeIds['معلم أول'],    'hire' => '2022-01-15'],
            ['name' => 'خالد ناصر العتيبي',     'username' => 'khaled.a', 'dept' => $it->id,       'grade' => $gradeIds['إداري عام'],   'hire' => '2022-06-01'],
            ['name' => 'رنا يوسف الشمري',       'username' => 'rana.sh',  'dept' => $guidance->id, 'grade' => $gradeIds['أخصائي شؤون'], 'hire' => '2021-03-22'],
            ['name' => 'محمد حسين الزيد',       'username' => 'mohd.z',   'dept' => $academic->id, 'grade' => $gradeIds['مشرف تربوي'],  'hire' => '2019-11-01'],
            ['name' => 'هند عبدالرحمن المطيري', 'username' => 'hend.m',   'dept' => $hr->id,       'grade' => $gradeIds['إداري عام'],   'hire' => '2023-02-10'],
        ];

        foreach ($employeesData as $data) {
            $user = \App\Models\User::create([
                'branch_id' => $branchId,
                'role_id'   => $adminRoleId,
                'name'      => $data['name'],
                'username'  => $data['username'],
                'password'  => Hash::make('password'),
            ]);

            \App\Models\Employee::create([
                'user_id'       => $user->id,
                'department_id' => $data['dept'],
                'job_grade_id'  => $data['grade'],
                'hire_date'     => $data['hire'],
            ]);
        }

        // إنشاء ملف تعريف موظف (Employee) لمديري الفروع الافتراضيين
        $mainManagerUser = \App\Models\User::where('username', 'manager.main')->first();
        if ($mainManagerUser) {
            \App\Models\Employee::create([
                'user_id'       => $mainManagerUser->id,
                'department_id' => $topDept->id,
                'job_grade_id'  => $gradeIds['مدير إدارة'],
                'hire_date'     => '2020-01-01',
            ]);
        }

        $jeddahManagerUser = \App\Models\User::where('username', 'manager.jeddah')->first();
        if ($jeddahManagerUser) {
            \App\Models\Employee::create([
                'user_id'       => $jeddahManagerUser->id,
                'department_id' => $topDept->id,
                'job_grade_id'  => $gradeIds['مدير إدارة'],
                'hire_date'     => '2020-01-01',
            ]);
        }
    }
}
