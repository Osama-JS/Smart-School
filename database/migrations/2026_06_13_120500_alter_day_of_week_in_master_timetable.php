<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // For SQLite or MySQL, changing enum to string might require doctrine/dbal or native altering.
        // In modern Laravel (10+), we can use `string` to redefine it if it's MySQL.
        Schema::table('master_timetable', function (Blueprint $table) {
            $table->string('day_of_week', 20)->change();
        });
    }

    public function down(): void
    {
        // Revert not strictly necessary for this usecase, but leaving as is.
    }
};
