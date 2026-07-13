<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\User;
use App\Models\Branch;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();

        foreach ($branches as $branch) {
            $users = User::where('branch_id', $branch->id)->get();
            if ($users->count() < 2) continue;

            $admin = $users->first();
            $assignees = $users->where('id', '!=', $admin->id)->values();

            if ($assignees->isEmpty()) continue;

            $tasks = [
                [
                    'title' => 'مراجعة المناهج الدراسية',
                    'description' => 'مراجعة المناهج الدراسية للفصل الدراسي القادم',
                    'status' => 'todo',
                    'priority' => 'high',
                    'due_date' => now()->addDays(7),
                ],
                [
                    'title' => 'اجتماع القسم الأكاديمي',
                    'description' => 'التحضير لاجتماع القسم الأكاديمي لمناقشة التحديثات',
                    'status' => 'in_progress',
                    'priority' => 'medium',
                    'due_date' => now()->addDays(2),
                ],
                [
                    'title' => 'تقييم أداء الطلاب',
                    'description' => 'إعداد تقرير تقييم أداء الطلاب للشهر الحالي',
                    'status' => 'review',
                    'priority' => 'high',
                    'due_date' => now()->subDays(1),
                ],
                [
                    'title' => 'تنظيم جدول الامتحانات',
                    'description' => 'ترتيب جداول المراقبة للامتحانات النهائية',
                    'status' => 'completed',
                    'priority' => 'low',
                    'due_date' => now()->subDays(5),
                ],
                [
                    'title' => 'تحديث بيانات التواصل',
                    'description' => 'التأكد من تحديث أرقام هواتف أولياء الأمور',
                    'status' => 'cancelled',
                    'priority' => 'low',
                    'due_date' => now()->subDays(10),
                ],
            ];

            foreach ($tasks as $task) {
                Task::create(array_merge($task, [
                    'branch_id' => $branch->id,
                    'assigned_to' => $assignees->random()->id,
                    'assigned_by' => $admin->id,
                ]));
            }
        }
    }
}
