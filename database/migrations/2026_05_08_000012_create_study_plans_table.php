<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('study_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->string('title'); // مثلاً: خطة لغتي للفصل الدراسي الأول
            $table->string('attachment_path'); // ملف PDF لتوزيع المنهج
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('study_plans');
    }
};
