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
        Schema::table('branch_employee_shift', function (Blueprint $table) {
            // Store working days as JSON array, e.g. [0, 1, 2, 3, 4] for Sunday-Thursday
            $table->json('working_days')->nullable()->after('shift_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_employee_shift', function (Blueprint $table) {
            $table->dropColumn('working_days');
        });
    }
};
