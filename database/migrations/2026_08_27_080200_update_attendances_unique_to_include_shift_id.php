<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // First add standalone index on employee_id so foreign key constraint is satisfied
            $table->index('employee_id', 'attendances_employee_id_index');
            // Drop old unique constraint
            $table->dropUnique('attendances_employee_date_unique');
            // Add new composite unique constraint including shift_id
            $table->unique(['employee_id', 'date', 'shift_id'], 'attendances_employee_date_shift_unique');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('attendances_employee_date_shift_unique');
            $table->unique(['employee_id', 'date'], 'attendances_employee_date_unique');
        });
    }
};
