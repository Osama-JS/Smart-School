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
        Schema::table('lesson_preparations', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('division_id')->nullable()->constrained()->onDelete('set null');
            
            // Rename content to topics_covered, or just add new fields
            // Assuming we just add the requested fields
            $table->text('topics_covered')->nullable();
            $table->text('notes')->nullable();
            $table->text('homework')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lesson_preparations', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['academic_year_id']);
            $table->dropForeign(['division_id']);
            
            $table->dropColumn([
                'branch_id',
                'academic_year_id',
                'division_id',
                'topics_covered',
                'notes',
                'homework'
            ]);
        });
    }
};
