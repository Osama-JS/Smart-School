<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('name');               // "الفصل الأول", "الفصل الثاني", "الفصل الصيفي"
            $table->tinyInteger('term_number');   // 1, 2, 3
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            // لا يمكن تكرار رقم الفصل في نفس السنة الدراسية
            $table->unique(['academic_year_id', 'term_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semesters');
    }
};
