<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permExists = DB::table('permissions')->where('name', 'عرض أرصدة الإجازات')->first();
        if (!$permExists) {
            $permId = DB::table('permissions')->insertGetId([
                'name' => 'عرض أرصدة الإجازات',
                'module' => 'hr',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            foreach ([1, 2, 3, 7, 9, 10] as $rId) {
                DB::table('permission_role')->insertOrIgnore([
                    'permission_id' => $permId,
                    'role_id' => $rId
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $perm = DB::table('permissions')->where('name', 'عرض أرصدة الإجازات')->first();
        if ($perm) {
            DB::table('permission_role')->where('permission_id', $perm->id)->delete();
            DB::table('permissions')->where('id', $perm->id)->delete();
        }
    }
};

