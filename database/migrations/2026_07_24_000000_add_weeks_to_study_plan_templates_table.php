<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('study_plan_templates', function (Blueprint $table) {
            $table->json('weeks')->nullable()->after('columns');
        });
    }

    public function down()
    {
        Schema::table('study_plan_templates', function (Blueprint $table) {
            $table->dropColumn('weeks');
        });
    }
};
