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
        Schema::table('result_periods', function (Blueprint $table) {
            if (Schema::hasColumn('result_periods', 'academic_year')) {
                $table->dropColumn('academic_year');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('result_periods', function (Blueprint $table) {
            $table->string('academic_year')->nullable();
        });
    }
};
