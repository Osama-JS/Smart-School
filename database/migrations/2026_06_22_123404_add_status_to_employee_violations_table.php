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
        Schema::table('employee_violations', function (Blueprint $table) {
            $table->enum('status', ['قيد المتابعة', 'تم تنفيذ الإجراء'])->default('قيد المتابعة')->after('action_taken');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_violations', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
