<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('followup_books', function (Blueprint $table) {
            if (!Schema::hasColumn('followup_books', 'period_id')) {
                $table->foreignId('period_id')->nullable()->after('division_id')->constrained('daily_periods')->nullOnDelete();
            }
            if (!Schema::hasColumn('followup_books', 'attachments')) {
                $table->json('attachments')->nullable()->after('homework_page');
            }
            if (!Schema::hasColumn('followup_books', 'supervisor_rating')) {
                $table->unsignedTinyInteger('supervisor_rating')->nullable()->after('uploaded_at');
            }
            if (!Schema::hasColumn('followup_books', 'supervisor_notes')) {
                $table->text('supervisor_notes')->nullable()->after('supervisor_rating');
            }
            if (!Schema::hasColumn('followup_books', 'reviewed_by')) {
                $table->foreignId('reviewed_by')->nullable()->after('supervisor_notes')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('followup_books', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('followup_books', function (Blueprint $table) {
            if (Schema::hasColumn('followup_books', 'reviewed_by')) {
                $table->dropForeign(['reviewed_by']);
            }
            if (Schema::hasColumn('followup_books', 'period_id')) {
                $table->dropForeign(['period_id']);
            }

            $columns = array_values(array_filter([
                'period_id',
                'attachments',
                'supervisor_rating',
                'supervisor_notes',
                'reviewed_by',
                'reviewed_at',
            ], fn ($col) => Schema::hasColumn('followup_books', $col)));

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
