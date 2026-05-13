<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('subject_grade_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            // أوزان الدرجات من 100
            $table->integer('written_weight')->default(40);
            $table->integer('homework_weight')->default(20);
            $table->integer('oral_weight')->default(20);
            $table->integer('attendance_weight')->default(20);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('subject_grade_settings');
    }
};
