<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('study_plans', function (Blueprint $table) {
            $table->foreignId('template_id')->nullable()->constrained('study_plan_templates')->nullOnDelete();
            $table->json('content')->nullable();
            $table->string('attachment_path')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('study_plans', function (Blueprint $table) {
            $table->dropForeign(['template_id']);
            $table->dropColumn(['template_id', 'content']);
            $table->string('attachment_path')->nullable(false)->change();
        });
    }
};
