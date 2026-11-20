<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_preparations', function (Blueprint $table) {
            if (!Schema::hasColumn('lesson_preparations', 'language')) {
                $table->enum('language', ['ar', 'en'])->default('ar')->after('status')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('lesson_preparations', function (Blueprint $table) {
            if (Schema::hasColumn('lesson_preparations', 'language')) {
                $table->dropIndex(['language']);
                $table->dropColumn('language');
            }
        });
    }
};
