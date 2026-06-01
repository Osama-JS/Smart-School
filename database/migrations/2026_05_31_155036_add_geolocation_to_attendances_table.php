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
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('employee_id')->constrained('branches')->nullOnDelete();
            $table->foreignId('shift_id')->nullable()->after('branch_id')->constrained('shifts')->nullOnDelete();
            
            // Storing coordinates for check-in and check-out
            $table->decimal('check_in_lat', 10, 8)->nullable()->after('check_in');
            $table->decimal('check_in_lng', 11, 8)->nullable()->after('check_in_lat');
            
            $table->decimal('check_out_lat', 10, 8)->nullable()->after('check_out');
            $table->decimal('check_out_lng', 11, 8)->nullable()->after('check_out_lat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['shift_id']);
            $table->dropColumn([
                'branch_id', 'shift_id', 
                'check_in_lat', 'check_in_lng', 
                'check_out_lat', 'check_out_lng'
            ]);
        });
    }
};
