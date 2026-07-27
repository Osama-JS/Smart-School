<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->decimal('weekly_oral_max', 5, 2)->default(5)->after('icon');
            $table->decimal('weekly_homework_max', 5, 2)->default(5)->after('weekly_oral_max');
            $table->decimal('monthly_behavior_max', 5, 2)->default(10)->after('weekly_homework_max');
            $table->decimal('monthly_exam_max', 5, 2)->default(50)->after('monthly_behavior_max');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn([
                'weekly_oral_max',
                'weekly_homework_max',
                'monthly_behavior_max',
                'monthly_exam_max'
            ]);
        });
    }
};
