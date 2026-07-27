<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_grades', function (Blueprint $table) {
            // درجات الأسابيع المنفصلة — قابلة للتعديل قبل الرفع
            // البنية: { "week_1": {"oral": 5, "homework": 4}, ... }
            $table->json('weekly_scores')
                  ->nullable()
                  ->after('scores')
                  ->comment('درجات الأسابيع المنفصلة');

            // آلية الرفع النهائي — بعده لا يمكن تعديل الأسابيع
            $table->boolean('is_submitted')
                  ->default(false)
                  ->after('weekly_scores');

            $table->timestamp('submitted_at')
                  ->nullable()
                  ->after('is_submitted');

            $table->foreignId('submitted_by')
                  ->nullable()
                  ->after('submitted_at')
                  ->constrained('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('monthly_grades', function (Blueprint $table) {
            $table->dropConstrainedForeignId('submitted_by');
            $table->dropColumn(['weekly_scores', 'is_submitted', 'submitted_at']);
        });
    }
};
