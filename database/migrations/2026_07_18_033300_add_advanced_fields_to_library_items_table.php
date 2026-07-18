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
        Schema::table('library_items', function (Blueprint $table) {
            $table->string('item_type')->default('pdf')->after('file_path')->comment('pdf, video, presentation, interactive, audio');
            $table->string('category')->nullable()->after('item_type')->comment('review, worksheet, explanation, enrichment');
            $table->string('target_audience')->default('students')->after('category')->comment('students, teachers, parents');
            $table->string('thumbnail_path')->nullable()->after('target_audience');
            $table->integer('views_count')->default(0)->after('thumbnail_path');
            $table->integer('downloads_count')->default(0)->after('views_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('library_items', function (Blueprint $table) {
            $table->dropColumn([
                'item_type',
                'category',
                'target_audience',
                'thumbnail_path',
                'views_count',
                'downloads_count'
            ]);
        });
    }
};
