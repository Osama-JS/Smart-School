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
        Schema::create('clinic_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()->comment('The nurse or doctor');
            
            $table->dateTime('visited_at');
            $table->text('symptoms')->nullable();
            $table->text('action_taken')->nullable();
            
            $table->enum('status', [
                'returned_to_class', 
                'sent_home', 
                'emergency'
            ])->default('returned_to_class');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_visits');
    }
};
