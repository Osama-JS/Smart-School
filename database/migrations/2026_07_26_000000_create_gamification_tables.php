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
        // جدول المستويات
        Schema::create('gamification_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // مثال: ألماسي
            $table->integer('min_points'); // مثال: 500
            $table->string('icon')->default('Award'); // Lucide Icon Name
            $table->string('color_class')->default('bg-slate-100 text-slate-700 border-slate-300'); // CSS classes
            $table->timestamps();
        });

        // جدول الشارات
        Schema::create('gamification_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // مثال: العبقري
            $table->text('description')->nullable();
            $table->string('category_target'); // الفئة المستهدفة: أكاديمي، رياضي، الخ
            $table->integer('required_count'); // العدد المطلوب من الإنجازات في هذه الفئة
            $table->string('icon')->default('Star'); // Lucide Icon Name
            $table->string('color_class')->default('bg-blue-50 text-blue-500'); // CSS classes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gamification_badges');
        Schema::dropIfExists('gamification_tiers');
    }
};
