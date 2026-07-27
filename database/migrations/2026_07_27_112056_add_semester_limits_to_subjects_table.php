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
            $table->decimal('semester_aggregate_max', 5, 2)->default(20)->after('monthly_exam_max');
            $table->decimal('final_exam_max', 5, 2)->default(80)->after('semester_aggregate_max');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn([
                'semester_aggregate_max',
                'final_exam_max'
            ]);
        });
    }
};
