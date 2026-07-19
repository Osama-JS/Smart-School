<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_schedule_items', function (Blueprint $table) {
            $table->string('room')->nullable()->after('end_time');
        });

        Schema::create('exam_schedule_item_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_schedule_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // The proctor/teacher
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_schedule_item_user');
        
        Schema::table('exam_schedule_items', function (Blueprint $table) {
            $table->dropColumn('room');
        });
    }
};
