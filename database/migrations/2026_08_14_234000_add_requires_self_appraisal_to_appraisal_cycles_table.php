<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appraisal_cycles', function (Blueprint $table) {
            $table->boolean('requires_self_appraisal')->default(true)->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('appraisal_cycles', function (Blueprint $table) {
            $table->dropColumn('requires_self_appraisal');
        });
    }
};
