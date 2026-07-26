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
        // 1. Types of Student Violations
        Schema::create('student_violation_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            
            // Degree or Severity: e.g., 'first_degree', 'second_degree', 'third_degree'
            $table->string('degree')->default('first_degree'); 
            
            // Action-based system: warning, summon, pledge, suspension
            $table->string('first_time_action')->nullable();
            $table->string('second_time_action')->nullable();
            $table->string('third_time_action')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Student Violations
        Schema::create('student_violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained()->nullOnDelete();
            // In the DB, students are in `students` table, linked to `users`. We can link to `students`.
            // The previous migration shows `students` has an `id` and `user_id`. Let's link to `students`.
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            
            $table->foreignId('violation_type_id')->constrained('student_violation_types')->cascadeOnDelete();
            
            // Who recorded it
            $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
            
            $table->date('violation_date');
            $table->text('details');
            $table->string('action_taken'); // The specific action applied in this instance
            $table->string('status')->default('pending'); // pending, resolved
            
            $table->string('attachment_path')->nullable(); // For uploaded files (PDF, images)
            
            $table->timestamps();
        });

        // 3. Parent Summons
        Schema::create('parent_summons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('student_violation_id')->nullable()->constrained('student_violations')->nullOnDelete();
            
            $table->date('summon_date');
            $table->text('reason');
            $table->string('status')->default('scheduled'); // scheduled, attended, no_show
            $table->text('notes')->nullable(); // notes after meeting
            
            $table->timestamps();
        });

        // 4. Student Pledges (التعهدات)
        Schema::create('student_pledges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('student_violation_id')->nullable()->constrained('student_violations')->nullOnDelete();
            
            $table->text('pledge_text'); // What the student is pledging
            $table->date('date');
            $table->boolean('is_signed_by_student')->default(false);
            $table->boolean('is_signed_by_parent')->default(false);
            
            $table->string('attachment_path')->nullable(); // Scan of physical signed paper
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_pledges');
        Schema::dropIfExists('parent_summons');
        Schema::dropIfExists('student_violations');
        Schema::dropIfExists('student_violation_types');
    }
};
