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
        Schema::create('daily_period_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_period_id')->constrained('daily_periods')->cascadeOnDelete();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::table('daily_periods', function (Blueprint $table) {
            $table->dropForeign(['grade_id']);
            $table->dropColumn('grade_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_periods', function (Blueprint $table) {
            $table->foreignId('grade_id')->nullable()->constrained('grades')->nullOnDelete()->after('branch_id');
        });
        
        Schema::dropIfExists('daily_period_grades');
    }
};
