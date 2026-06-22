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
            $table->integer('repetition_level')->default(1)->after('violation_type_id')->comment('1: First time, 2: Second time, 3: Third time+');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_violations', function (Blueprint $table) {
            $table->dropColumn('repetition_level');
        });
    }
};
