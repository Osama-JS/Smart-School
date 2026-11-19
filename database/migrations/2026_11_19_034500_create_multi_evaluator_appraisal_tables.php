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
        Schema::table('appraisal_kpis', function (Blueprint $table) {
            $table->json('evaluator_roles')->nullable()->after('category');
        });

        Schema::table('employee_appraisal_scores', function (Blueprint $table) {
            $table->decimal('manager_score', 5, 2)->nullable()->change();
        });

        Schema::create('employee_appraisal_evaluators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appraisal_id')->constrained('employee_appraisals')->cascadeOnDelete();
            $table->foreignId('evaluator_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role_type', 50)->default('committee');
            $table->unsignedInteger('weight')->default(100);
            $table->enum('status', ['pending', 'submitted'])->default('pending');
            $table->decimal('calculated_score', 8, 2)->nullable();
            $table->text('comments')->nullable();
            $table->longText('signature')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['appraisal_id', 'evaluator_user_id'], 'appraisal_evaluator_unique');
        });

        Schema::create('employee_appraisal_evaluator_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appraisal_score_id')->constrained('employee_appraisal_scores')->cascadeOnDelete();
            $table->foreignId('evaluator_id')->constrained('employee_appraisal_evaluators')->cascadeOnDelete();
            $table->unsignedTinyInteger('score');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['appraisal_score_id', 'evaluator_id'], 'eval_score_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_appraisal_evaluator_scores');
        Schema::dropIfExists('employee_appraisal_evaluators');

        Schema::table('employee_appraisal_scores', function (Blueprint $table) {
            $table->integer('manager_score')->nullable()->change();
        });

        Schema::table('appraisal_kpis', function (Blueprint $table) {
            $table->dropColumn('evaluator_roles');
        });
    }
};
