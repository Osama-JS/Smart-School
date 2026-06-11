<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name');           // "2025/2026"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            // ضمان عدم تكرار اسم السنة الدراسية لنفس الفرع
            $table->unique(['branch_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_years');
    }
};
