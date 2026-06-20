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
        // Truncate the table before altering, as existing records might cause integrity issues
        DB::table('notifications')->truncate();

        Schema::table('notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            
            // إضافة الحقول الجديدة الخاصة بالبث
            $table->string('target_type')->default('all')->after('type'); // all, role, users
            $table->string('target_role')->nullable()->after('target_type');
            $table->json('target_users')->nullable()->after('target_role');
            
            // إضافة الفرع إن كان موجوداً
            $table->unsignedBigInteger('branch_id')->nullable()->after('sender_id');
            // $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade'); // إذا كان جدول الفروع موجوداً
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->dropColumn(['target_type', 'target_role', 'target_users', 'branch_id']);
        });
    }
};
