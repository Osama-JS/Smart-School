<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // 1. ربط الطلاب بالنظام المالي خارجي (Mapping)
        Schema::create('financial_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('sxpro_account_no')->unique(); // رقم الحساب في SXpro
            $table->decimal('balance', 12, 2)->default(0);
            $table->boolean('auto_block_status')->default(false);
            $table->timestamps();
        });

        // 2. سجلات المزامنة (Sync Logs)
        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('sync_type'); // (students, grades, financial)
            $table->enum('status', ['success', 'failed']);
            $table->text('error_details')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('sync_logs');
        Schema::dropIfExists('financial_mappings');
    }
};
