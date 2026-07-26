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
        Schema::table('student_pledges', function (Blueprint $table) {
            $table->string('student_signature_path')->nullable()->after('is_signed_by_student');
            $table->string('parent_signature_path')->nullable()->after('is_signed_by_parent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_pledges', function (Blueprint $table) {
            $table->dropColumn(['student_signature_path', 'parent_signature_path']);
        });
    }
};
