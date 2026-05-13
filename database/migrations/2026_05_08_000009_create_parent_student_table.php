<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('parent_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('users')->cascadeOnDelete(); // حساب الأب
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete(); // حساب الابن
            $table->string('relationship_type')->default('Father'); // أب، أم، ولي أمر
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('parent_student');
    }
};
