<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add branch_id to appraisal_cycles
        Schema::table('appraisal_cycles', function (Blueprint $table) {
            if (!Schema::hasColumn('appraisal_cycles', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('id');
                $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            }
        });

        // 2. Add branch_id to appraisal_templates
        Schema::table('appraisal_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('appraisal_templates', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('id');
                $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            }
        });

        // Set default branch for existing records to prevent NULLs
        $mainBranch = DB::table('branches')->where('name', 'الفرع الرئيسي')->first();
        if ($mainBranch) {
            DB::table('appraisal_cycles')->whereNull('branch_id')->update(['branch_id' => $mainBranch->id]);
            DB::table('appraisal_templates')->whereNull('branch_id')->update(['branch_id' => $mainBranch->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appraisal_cycles', function (Blueprint $table) {
            if (Schema::hasColumn('appraisal_cycles', 'branch_id')) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            }
        });

        Schema::table('appraisal_templates', function (Blueprint $table) {
            if (Schema::hasColumn('appraisal_templates', 'branch_id')) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            }
        });
    }
};
