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
            $table->string('external_url', 1000)->nullable()->after('file_path');
            $table->string('file_path')->nullable()->change(); // Make file_path nullable since an item can have an external URL instead
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('library_items', function (Blueprint $table) {
            $table->dropColumn('external_url');
            // Assuming it was non-nullable before. We might run into issues if we try to change it back to non-nullable while some records have null file_path.
            // Leaving out the down change for file_path to be safe.
        });
    }
};
