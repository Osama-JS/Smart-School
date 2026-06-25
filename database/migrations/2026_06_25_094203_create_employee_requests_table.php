<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->string('type'); // leave, permission, loan, maintenance, supplies, certificate
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->json('details')->nullable(); // flexible data per request type
            $table->text('employee_notes')->nullable();
            $table->string('employee_signature')->nullable(); // path to signature image
            $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('manager_signature')->nullable(); // path to manager signature image
            $table->text('manager_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_requests');
    }
};
