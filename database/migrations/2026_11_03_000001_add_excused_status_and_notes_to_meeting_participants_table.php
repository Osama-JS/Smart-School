<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add excused status if not already present
        DB::statement("ALTER TABLE `meeting_participants` MODIFY COLUMN `attendance_status` ENUM('pending', 'attended', 'absent', 'excused') NOT NULL DEFAULT 'pending'");

        if (!Schema::hasColumn('meeting_participants', 'notes')) {
            Schema::table('meeting_participants', function (Blueprint $table) {
                $table->text('notes')->nullable()->after('attendance_status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('meeting_participants', 'notes')) {
            Schema::table('meeting_participants', function (Blueprint $table) {
                $table->dropColumn('notes');
            });
        }
        DB::statement("ALTER TABLE `meeting_participants` MODIFY COLUMN `attendance_status` ENUM('pending', 'attended', 'absent') NOT NULL DEFAULT 'pending'");
    }
};

