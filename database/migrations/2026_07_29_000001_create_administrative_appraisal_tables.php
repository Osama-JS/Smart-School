<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Appraisal Templates
        Schema::create('appraisal_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->unsignedBigInteger('job_grade_id')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('job_grade_id')->references('id')->on('job_grades')->onDelete('set null');
        });

        // 2. Appraisal KPIs
        Schema::create('appraisal_kpis', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('template_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('weight')->default(1);
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->foreign('template_id')->references('id')->on('appraisal_templates')->onDelete('cascade');
        });

        // 3. Appraisal Cycles
        Schema::create('appraisal_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('type', ['monthly', 'semi-annual', 'annual'])->default('monthly');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->timestamps();
        });

        // 4. Employee Appraisals (The Evaluation Form)
        Schema::create('employee_appraisals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('cycle_id');
            $table->unsignedBigInteger('template_id');
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->unsignedBigInteger('hr_id')->nullable(); // Who approved it from HR
            $table->enum('status', ['pending_self', 'pending_manager', 'pending_hr', 'completed'])->default('pending_self');
            
            $table->decimal('self_score', 8, 2)->nullable();
            $table->decimal('manager_score', 8, 2)->nullable();
            $table->decimal('final_score', 8, 2)->nullable();
            
            $table->text('self_comments')->nullable();
            $table->text('manager_comments')->nullable();
            $table->text('hr_comments')->nullable();
            
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('cycle_id')->references('id')->on('appraisal_cycles')->onDelete('cascade');
            $table->foreign('template_id')->references('id')->on('appraisal_templates')->onDelete('cascade');
            $table->foreign('manager_id')->references('id')->on('employees')->onDelete('set null');
            $table->foreign('hr_id')->references('id')->on('users')->onDelete('set null');
            
            // Prevent multiple evaluations for the same cycle
            $table->unique(['employee_id', 'cycle_id']);
        });

        // 5. Employee Appraisal Scores (Individual KPI Scores)
        Schema::create('employee_appraisal_scores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('appraisal_id');
            $table->unsignedBigInteger('kpi_id');
            $table->integer('self_score')->nullable(); // e.g. 1-5
            $table->integer('manager_score')->nullable();
            $table->timestamps();

            $table->foreign('appraisal_id')->references('id')->on('employee_appraisals')->onDelete('cascade');
            $table->foreign('kpi_id')->references('id')->on('appraisal_kpis')->onDelete('cascade');
            
            $table->unique(['appraisal_id', 'kpi_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('employee_appraisal_scores');
        Schema::dropIfExists('employee_appraisals');
        Schema::dropIfExists('appraisal_cycles');
        Schema::dropIfExists('appraisal_kpis');
        Schema::dropIfExists('appraisal_templates');
    }
};
