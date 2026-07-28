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
        Schema::create('traffic_analytics', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('day_of_week')->comment('0 for Sunday to 6 for Saturday');
            $table->tinyInteger('hour')->comment('0 to 23');
            $table->unsignedBigInteger('request_count')->default(0);
            
            $table->unique(['day_of_week', 'hour']);
            $table->timestamps();
        });

        // Initialize 168 rows (7 days * 24 hours)
        $data = [];
        $now = now();
        for ($day = 0; $day <= 6; $day++) {
            for ($hour = 0; $hour <= 23; $hour++) {
                $data[] = [
                    'day_of_week' => $day,
                    'hour' => $hour,
                    'request_count' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        
        DB::table('traffic_analytics')->insert($data);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traffic_analytics');
    }
};
