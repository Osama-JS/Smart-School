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
        Schema::create('report_template_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_template_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('type'); // text, number, select, checkbox, image
            $table->json('options')->nullable(); // for select type choices
            $table->boolean('is_required')->default(false);
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_template_fields');
    }
};
