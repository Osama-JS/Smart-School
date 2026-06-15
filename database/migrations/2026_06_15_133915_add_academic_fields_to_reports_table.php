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
        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('academic_year_id')->nullable()->after('branch_id')->constrained('academic_years')->nullOnDelete();
            $table->foreignId('semester_id')->nullable()->after('academic_year_id')->constrained('semesters')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropForeign(['semester_id']);
            $table->dropColumn(['academic_year_id', 'semester_id']);
        });
    }
};
