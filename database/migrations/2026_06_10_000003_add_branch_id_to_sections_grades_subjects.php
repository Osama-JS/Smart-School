<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * هذا الملف يضيف branch_id لجداول المراحل والصفوف والمواد
 * ليتم عزل هذه البيانات بين الفروع المختلفة.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── إضافة branch_id لجدول المراحل (sections) ──
        Schema::table('sections', function (Blueprint $table) {
            $table->foreignId('branch_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->nullOnDelete();
        });

        // ── إضافة branch_id لجدول الصفوف (grades) ──
        Schema::table('grades', function (Blueprint $table) {
            $table->foreignId('branch_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->nullOnDelete();
        });

        // ── إضافة branch_id لجدول المواد الدراسية (subjects) ──
        // المواد قد تكون مشتركة (nullable) أو خاصة بفرع
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('branch_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });

        Schema::table('grades', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
