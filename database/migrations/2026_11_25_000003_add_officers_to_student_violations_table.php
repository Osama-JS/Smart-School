<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_violations', function (Blueprint $table) {
            if (!Schema::hasColumn('student_violations', 'follow_up_officer_id')) {
                $table->foreignId('follow_up_officer_id')
                    ->nullable()
                    ->after('supervisor_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('student_violations', 'execution_officer_id')) {
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
        Schema::table('student_violations', function (Blueprint $table) {
            if (Schema::hasColumn('student_violations', 'execution_officer_id')) {
                $table->dropForeign(['execution_officer_id']);
                $table->dropColumn('execution_officer_id');
            }

            if (Schema::hasColumn('student_violations', 'follow_up_officer_id')) {
                $table->dropForeign(['follow_up_officer_id']);
                $table->dropColumn('follow_up_officer_id');
            }
        });
    }
};
