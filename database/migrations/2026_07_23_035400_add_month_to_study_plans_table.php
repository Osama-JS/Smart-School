<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('study_plans', function (Blueprint $table) {
            $table->string('month')->nullable()->after('title');
        });
    }

    public function down()
    {
        Schema::table('study_plans', function (Blueprint $table) {
            $table->dropColumn('month');
        });
    }
};
