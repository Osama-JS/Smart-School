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
        Schema::table('student_achievements', function (Blueprint $table) {
            $table->foreignId('student_achievement_type_id')->after('branch_id')->constrained('student_achievement_types')->cascadeOnDelete();
            $table->dropColumn(['category', 'title']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_achievements', function (Blueprint $table) {
            $table->dropForeign(['student_achievement_type_id']);
            $table->dropColumn('student_achievement_type_id');
            $table->string('category', 100)->after('branch_id');
            $table->string('title')->after('category');
        });
    }
};
