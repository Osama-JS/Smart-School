<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('exam_schedules', 'status')) {
                $table->enum('status', ['draft', 'published', 'archived'])
                    ->default('draft')
                    ->after('details')
                    ->index();
            }
            if (!Schema::hasColumn('exam_schedules', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('exam_schedules', 'published_by')) {
                $table->foreignId('published_by')
                    ->nullable()
                    ->after('published_at')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });

        // Keep pre-existing schedules that already have items visible as published
        DB::table('exam_schedules')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('exam_schedule_items')
                    ->whereColumn('exam_schedule_items.schedule_id', 'exam_schedules.id');
            })
            ->update([
                'status' => 'published',
                'published_at' => now(),
            ]);
    }

    public function down(): void
    {
        Schema::table('exam_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('exam_schedules', 'published_by')) {
                $table->dropForeign(['published_by']);
                $table->dropColumn('published_by');
            }
            if (Schema::hasColumn('exam_schedules', 'published_at')) {
                $table->dropColumn('published_at');
            }
            if (Schema::hasColumn('exam_schedules', 'status')) {
                $table->dropIndex(['status']);
                $table->dropColumn('status');
            }
        });
    }
};
