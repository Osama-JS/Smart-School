<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Delete duplicate records, keeping only the one with highest priority
        // Priority: present > late > excused > leave > holiday > weekend > absent
        // For each (employee_id, date) pair, keep only ONE record.
        // We keep the record with the "best" status (present > late > ...) or if equal, keep the one with check_in
        DB::statement("
            DELETE a1 FROM attendances a1
            INNER JOIN attendances a2 
            WHERE a1.employee_id = a2.employee_id 
              AND a1.date = a2.date 
              AND a1.id > a2.id
        ");

        // Step 2: Add unique constraint to prevent future duplicates
        Schema::table('attendances', function (Blueprint $table) {
            $table->unique(['employee_id', 'date'], 'attendances_employee_date_unique');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('attendances_employee_date_unique');
        });
    }
};
