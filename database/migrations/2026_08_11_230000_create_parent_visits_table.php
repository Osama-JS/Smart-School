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
        Schema::create('parent_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('visitor_name');
            $table->string('visitor_relation'); // e.g. Father, Mother, Brother
            $table->foreignId('employee_id')->nullable()->constrained('users')->nullOnDelete(); // Host employee
            $table->date('visit_date');
            $table->time('visit_time')->nullable();
            $table->text('purpose')->nullable();
            $table->enum('status', ['مجدولة', 'جارية', 'مكتملة', 'ملغاة'])->default('مجدولة');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parent_visits');
    }
};
