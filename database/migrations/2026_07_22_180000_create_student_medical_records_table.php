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
        Schema::create('student_medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            
            // Basic Vitals & Info
            $table->decimal('height', 5, 2)->nullable()->comment('Height in cm');
            $table->decimal('weight', 5, 2)->nullable()->comment('Weight in kg');
            $table->string('blood_type', 10)->nullable();
            
            // Medical Details
            $table->text('allergies')->nullable();
            $table->text('chronic_diseases')->nullable();
            $table->text('regular_medications')->nullable();
            $table->text('past_surgeries')->nullable();
            
            // Consent
            $table->boolean('consent_given')->default(false)->comment('Parent consent for first aid/medicine');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_medical_records');
    }
};
