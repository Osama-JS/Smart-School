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
        $permissions = [
            ['name' => 'عرض دفاتر التحضير', 'module' => 'دفاتر التحضير'],
            ['name' => 'إضافة دفتر تحضير', 'module' => 'دفاتر التحضير'],
            ['name' => 'تعديل دفتر تحضير', 'module' => 'دفاتر التحضير'],
            ['name' => 'حذف دفتر تحضير', 'module' => 'دفاتر التحضير'],
        ];

        foreach ($permissions as $permission) {
            \App\Models\Permission::firstOrCreate(['name' => $permission['name']], ['module' => $permission['module']]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permissions = [
            'عرض دفاتر التحضير',
            'إضافة دفتر تحضير',
            'تعديل دفتر تحضير',
            'حذف دفتر تحضير',
        ];

        \App\Models\Permission::whereIn('name', $permissions)->delete();
    }
};
