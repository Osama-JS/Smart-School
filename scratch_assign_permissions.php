<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Role;
use App\Models\Permission;

$permissions = Permission::whereIn('name', ['عرض دفاتر التحضير', 'إدارة دفاتر التحضير', 'إضافة دفتر تحضير', 'تعديل دفتر تحضير', 'حذف دفتر تحضير'])->get();

$role = Role::where('name', 'admin')->first();
if ($role) {
    $role->permissions()->syncWithoutDetaching($permissions->pluck('id'));
    echo "Permissions given to admin.\n";
}

$role2 = Role::where('name', 'مدير النظام')->first();
if ($role2) {
    $role2->permissions()->syncWithoutDetaching($permissions->pluck('id'));
    echo "Permissions given to مدير النظام.\n";
}

echo "Done.\n";
