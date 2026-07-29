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
        Schema::create('appraisal_goals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('appraisal_score_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('progress')->default(0); // 0 to 100
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamps();

            $table->foreign('appraisal_score_id')->references('id')->on('employee_appraisal_scores')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('appraisal_goals');
    }
};
