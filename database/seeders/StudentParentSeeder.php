<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Branch;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;

class StudentParentSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::first();
        if (!$branch) {
            $this->command->error('No branch found! Please seed branches first.');
            return;
        }

        $studentRole = Role::where('name', 'طالب')->first();
        $parentRole = Role::where('name', 'ولي أمر')->first();

        if (!$studentRole || !$parentRole) {
            $this->command->error('Roles "طالب" or "ولي أمر" not found! Please run RolesSeeder first.');
            return;
        }

        $this->command->info('👨‍👩‍👦 Seeding Parents and Students...');

        // Create 3 Parents
        for ($i = 1; $i <= 3; $i++) {
            $parentUser = User::firstOrCreate(
                ['username' => "parent$i"],
                [
                    'name'      => "ولي أمر تجريبي $i",
                    'password'  => Hash::make('password'),
                    'email'     => "parent$i@school.com",
                    'phone'     => "055000000$i",
                    'role_id'   => $parentRole->id,
                    'branch_id' => $branch->id,
                    'is_active' => true,
                    'national_id' => "100000000$i",
                ]
            );

            // Create 2 Students for each parent
            for ($j = 1; $j <= 2; $j++) {
                $studentUser = User::firstOrCreate(
                    ['username' => "student{$i}_{$j}"],
                    [
                        'name'      => "طالب تجريبي {$j} لولي الأمر {$i}",
                        'password'  => Hash::make('password'),
                        'email'     => "student{$i}_{$j}@school.com",
                        'role_id'   => $studentRole->id,
                        'branch_id' => $branch->id,
                        'is_active' => true,
                        'national_id' => "20000000{$i}{$j}",
                    ]
                );

                $student = Student::firstOrCreate(
                    ['user_id' => $studentUser->id],
                    [
                        'transport_subscription' => rand(0, 1) ? 'yes' : 'no'
                    ]
                );

                // Attach Parent to Student if not already attached
                if (!$student->parents()->where('parent_id', $parentUser->id)->exists()) {
                    $student->parents()->attach($parentUser->id, [
                        'relationship_type' => 'أب' // Father
                    ]);
                }
            }
        }

        $this->command->info('✅ Parents and Students seeded successfully!');
    }
}
