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
        Schema::table('report_templates', function (Blueprint $table) {
            $table->string('period_type')->default('custom')->after('description');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->string('period_type')->default('custom')->after('status');
            $table->date('period_start_date')->nullable()->after('period_type');
            $table->date('period_end_date')->nullable()->after('period_start_date');
            $table->string('period_label')->nullable()->after('period_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_templates', function (Blueprint $table) {
            $table->dropColumn('period_type');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['period_type', 'period_start_date', 'period_end_date', 'period_label']);
        });
    }
};
