<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parent_visits', function (Blueprint $table) {
            if (!Schema::hasColumn('parent_visits', 'follow_up_officer_id')) {
                $table->foreignId('follow_up_officer_id')
                    ->nullable()
                    ->after('employee_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('parent_visits', 'execution_officer_id')) {
                $table->foreignId('execution_officer_id')
                    ->nullable()
                    ->after('follow_up_officer_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('parent_visits', function (Blueprint $table) {
            if (Schema::hasColumn('parent_visits', 'execution_officer_id')) {
                $table->dropForeign(['execution_officer_id']);
                $table->dropColumn('execution_officer_id');
            }

            if (Schema::hasColumn('parent_visits', 'follow_up_officer_id')) {
                $table->dropForeign(['follow_up_officer_id']);
                $table->dropColumn('follow_up_officer_id');
            }
        });
    }
};
