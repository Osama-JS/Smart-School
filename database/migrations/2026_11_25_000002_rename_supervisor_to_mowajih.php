<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('roles')) {
            DB::table('roles')->where('name', 'مشرف تربوي')->update(['name' => 'موجه']);
        }

        if (Schema::hasTable('job_grades')) {
            DB::table('job_grades')->where('name', 'مشرف تربوي')->update(['name' => 'موجه']);
        }

        if (Schema::hasTable('permission_modules')) {
            DB::table('permission_modules')
                ->where('key', 'supervision')
                ->orWhere('label', 'الإشراف التربوي')
                ->update(['label' => 'التوجيه']);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('roles')) {
            DB::table('roles')->where('name', 'موجه')->update(['name' => 'مشرف تربوي']);
        }

        if (Schema::hasTable('job_grades')) {
            DB::table('job_grades')->where('name', 'موجه')->update(['name' => 'مشرف تربوي']);
        }

        if (Schema::hasTable('permission_modules')) {
            DB::table('permission_modules')
                ->where('key', 'supervision')
                ->update(['label' => 'الإشراف التربوي']);
        }
    }
};
