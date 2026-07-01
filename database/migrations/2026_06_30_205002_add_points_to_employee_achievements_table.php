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
        Schema::table('employee_achievements', function (Blueprint $table) {
            $table->integer('points')->default(0)->after('achievement_type_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_achievements', function (Blueprint $table) {
            $table->dropColumn('points');
        });
    }
};
