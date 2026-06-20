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
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
            }
            if (!Schema::hasColumn('attendances', 'semester_id')) {
                $table->foreignId('semester_id')->nullable()->constrained('semesters')->nullOnDelete();
            }
        });

        Schema::table('leaves', function (Blueprint $table) {
            if (!Schema::hasColumn('leaves', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
            }
            if (!Schema::hasColumn('leaves', 'semester_id')) {
                $table->foreignId('semester_id')->nullable()->constrained('semesters')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropForeign(['semester_id']);
            $table->dropColumn(['academic_year_id', 'semester_id']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropForeign(['semester_id']);
            $table->dropColumn(['academic_year_id', 'semester_id']);
        });
    }
};
