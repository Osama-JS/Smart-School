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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'email')) {
                $table->string('email')->nullable()->unique()->after('username');
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable()->after('phone');
            }
        });

        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'national_id')) {
                $table->string('national_id')->nullable()->after('manager_id');
            }
            if (!Schema::hasColumn('employees', 'specialization')) {
                $table->string('specialization')->nullable()->after('national_id');
            }
            if (!Schema::hasColumn('employees', 'job_title')) {
                $table->string('job_title')->nullable()->after('specialization');
            }
            if (!Schema::hasColumn('employees', 'address')) {
                $table->text('address')->nullable()->after('job_title');
            }
            if (!Schema::hasColumn('employees', 'attachments')) {
                $table->json('attachments')->nullable()->after('address');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['email', 'phone', 'avatar']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['national_id', 'specialization', 'job_title', 'address', 'attachments']);
        });
    }
};
