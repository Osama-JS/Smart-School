<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('followup_books', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedBigInteger('teacher_id');
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('division_id')->constrained()->cascadeOnDelete();
            
            // For multi-tenant support if needed
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->nullable()->constrained()->onDelete('cascade');
            
            $table->date('date');
            $table->string('lesson_title')->nullable();
            $table->text('notes')->nullable();
            $table->string('page_number')->nullable();
            
            $table->text('homework')->nullable();
            $table->string('homework_page')->nullable();
            
            $table->enum('upload_source', ['app', 'dashboard'])->default('dashboard');
            $table->timestamp('uploaded_at')->nullable();
            
            $table->timestamps();

            $table->foreign('teacher_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('followup_books');
    }
};
