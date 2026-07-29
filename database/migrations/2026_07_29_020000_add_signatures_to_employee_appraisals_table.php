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
        Schema::table('employee_appraisals', function (Blueprint $table) {
            $table->longText('employee_signature')->nullable()->after('hr_comments');
            $table->longText('manager_signature')->nullable()->after('employee_signature');
            $table->longText('hr_signature')->nullable()->after('manager_signature');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_appraisals', function (Blueprint $table) {
            $table->dropColumn([
                'employee_signature',
                'manager_signature',
                'hr_signature',
            ]);
        });
    }
};
