<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_plan_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('study_plan_id')->constrained()->cascadeOnDelete();
            $table->json('data');
            $table->timestamps();
        });

        // Data migration
        $studyPlans = DB::table('study_plans')->whereNotNull('content')->get();
        foreach ($studyPlans as $plan) {
            $content = json_decode($plan->content, true);
            if (is_array($content)) {
                $rows = isset($content['rows']) ? $content['rows'] : (isset($content[0]) ? $content : []);
                foreach ($rows as $row) {
                    if (is_array($row) && !empty($row)) {
                        DB::table('study_plan_rows')->insert([
                            'study_plan_id' => $plan->id,
                            'data' => json_encode($row),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }

        // Drop the content column
        Schema::table('study_plans', function (Blueprint $table) {
            $table->dropColumn('content');
        });
    }

    public function down(): void
    {
        Schema::table('study_plans', function (Blueprint $table) {
            $table->json('content')->nullable();
        });

        // Reverse migration (rudimentary)
        $plans = DB::table('study_plans')->get();
        foreach ($plans as $plan) {
            $rows = DB::table('study_plan_rows')->where('study_plan_id', $plan->id)->get();
            if ($rows->count() > 0) {
                $contentRows = [];
                foreach ($rows as $row) {
                    $contentRows[] = json_decode($row->data, true);
                }
                DB::table('study_plans')
                    ->where('id', $plan->id)
                    ->update(['content' => json_encode(['rows' => $contentRows])]);
            }
        }

        Schema::dropIfExists('study_plan_rows');
    }
};
