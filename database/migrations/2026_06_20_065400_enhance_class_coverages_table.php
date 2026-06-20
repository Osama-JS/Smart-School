<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('class_coverages', function (Blueprint $table) {
            // Foreign key to semester (to scope coverage to the right term)
            $table->foreignId('semester_id')->nullable()->after('division_id')
                  ->constrained('semesters')->nullOnDelete();

            // Subject being taught during coverage (may differ from original)
            $table->foreignId('subject_id')->nullable()->after('semester_id')
                  ->constrained('subjects')->nullOnDelete();

            // Branch isolation
            $table->foreignId('branch_id')->nullable()->after('subject_id')
                  ->constrained('branches')->nullOnDelete();

            // Who recorded this coverage
            $table->foreignId('recorded_by')->nullable()->after('substitute_teacher_id')
                  ->constrained('users')->nullOnDelete();

            // Type of coverage
            $table->enum('coverage_type', ['substitution', 'free', 'merged'])
                  ->default('substitution')->after('recorded_by');

            // Optional notes
            $table->text('notes')->nullable()->after('coverage_type');

            // Notification flag (for when notifications are implemented)
            $table->boolean('substitute_notified')->default(false)->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('class_coverages', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropForeign(['subject_id']);
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['recorded_by']);
            $table->dropColumn([
                'semester_id', 'subject_id', 'branch_id',
                'recorded_by', 'coverage_type', 'notes', 'substitute_notified'
            ]);
        });
    }
};
