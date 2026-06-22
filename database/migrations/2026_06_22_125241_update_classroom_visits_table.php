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
        Schema::table('classroom_visits', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('grade_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('division_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('visit_type')->nullable(); // توجيهية، نموذجية
            $table->text('discussed_points')->nullable();
            $table->text('supervisor_signature')->nullable();
            $table->text('teacher_signature')->nullable();
            $table->boolean('is_approved')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classroom_visits', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['grade_id']);
            $table->dropForeign(['division_id']);
            $table->dropColumn([
                'branch_id', 'grade_id', 'division_id', 
                'visit_type', 'discussed_points', 
                'supervisor_signature', 'teacher_signature', 'is_approved'
            ]);
        });
    }
};
