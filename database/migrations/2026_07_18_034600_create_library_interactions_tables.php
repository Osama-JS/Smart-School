<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('library_item_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'library_item_id']);
        });

        Schema::create('library_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('library_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating')->default(0); // 1 to 5
            $table->timestamps();

            $table->unique(['user_id', 'library_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('library_ratings');
        Schema::dropIfExists('library_bookmarks');
    }
};
