<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * ترتيب تشغيل الـ Seeders مهم جداً بسبب العلاقات بين الجداول.
     * لا تغير الترتيب إلا إذا كنت متأكداً من العلاقات.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Smart School database seeding...');
        $this->command->newLine();

        // المرحلة 1: الصلاحيات والأدوار (لا تعتمد على أي شيء)
        $this->command->info('── المرحلة 1: الصلاحيات والأدوار ──');
        $this->call(PermissionsSeeder::class);
        $this->call(RolesSeeder::class);

        // المرحلة 2: الفروع (تعتمد عليها باقي البيانات)
        $this->command->info('── المرحلة 2: الفروع ──');
        $this->call(BranchesSeeder::class);

        // المرحلة 3: المستخدمون الأساسيون (تعتمد على الفروع والأدوار)
        $this->command->info('── المرحلة 3: المستخدمون الأساسيون ──');
        $this->call(UsersSeeder::class);

        // المرحلة 4: بيانات الموارد البشرية (تعتمد على المستخدمين والفروع)
        $this->command->info('── المرحلة 4: الموارد البشرية ──');
        $this->call(HRSeeder::class);

        // المرحلة 5: أنواع الطلبات الإدارية
        $this->command->info('── المرحلة 5: أنواع الطلبات ──');
        $this->call(RequestTypesSeeder::class);

        // المرحلة 6: السنوات والفصول الدراسية (تعتمد على الفروع)
        $this->command->info('── المرحلة 6: السنوات الدراسية والفصول ──');
        $this->call(AcademicYearSeeder::class);

        // المرحلة 7: الهيكل الأكاديمي (مراحل، صفوف، شعب، مواد) - تعتمد على السنوات الدراسية
        $this->command->info('── المرحلة 7: الهيكل الأكاديمي ──');
        $this->call(AcademicStructureSeeder::class);

        $this->command->newLine();
        $this->command->info('🎉 Database seeding completed successfully!');
    }
}
