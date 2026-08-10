<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permission_modules', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();       // e.g. 'hr', 'academic', 'admin'
            $table->string('label');               // e.g. 'الموارد البشرية'
            $table->boolean('is_system')->default(false); // system modules = predefined
            $table->timestamps();
        });

        // Seed from existing permission modules so nothing is lost
        $existingModules = DB::table('permissions')
            ->distinct()
            ->pluck('module')
            ->filter()
            ->values();

        $systemKeys = ['hr', 'academic', 'admin', 'students', 'reports',
                       'supervision', 'communications', 'clinic',
                       'student_portal', 'parent_portal', 'mobile_app'];

        $defaultLabels = [
            'hr'             => 'الموارد البشرية',
            'academic'       => 'الشؤون الأكاديمية',
            'admin'          => 'الإدارة والنظام',
            'students'       => 'الطلاب',
            'reports'        => 'التقارير والاجتماعات',
            'supervision'    => 'الإشراف التربوي',
            'communications' => 'التواصل والأخبار',
            'clinic'         => 'العيادة المدرسية',
            'student_portal' => 'بوابة الطالب',
            'parent_portal'  => 'بوابة ولي الأمر',
            'mobile_app'     => 'صلاحيات تطبيق الجوال',
        ];

        foreach ($existingModules as $moduleKey) {
            DB::table('permission_modules')->insertOrIgnore([
                'key'       => $moduleKey,
                'label'     => $defaultLabels[$moduleKey] ?? $moduleKey,
                'is_system' => in_array($moduleKey, $systemKeys),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_modules');
    }
};
