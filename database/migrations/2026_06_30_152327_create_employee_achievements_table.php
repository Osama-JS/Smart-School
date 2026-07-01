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
        Schema::create('employee_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('achievement_type_id')->constrained('achievement_types')->cascadeOnDelete();
            
            $table->date('achievement_date');
            $table->text('details')->nullable();
            
            $table->string('attachment_path')->nullable(); // For uploaded files (PDF, images)
            
            // Signatures (Stored as image paths / WebP)
            $table->string('admin_signature')->nullable();
            $table->string('employee_signature')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_achievements');
    }
};
