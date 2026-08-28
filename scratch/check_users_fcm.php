<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = \App\Models\User::all();
echo "Total Users: " . $users->count() . "\n";
$withTokens = $users->filter(fn($u) => !empty($u->fcm_token));
echo "Users with fcm_token: " . $withTokens->count() . "\n";

foreach ($users as $u) {
    $hasToken = !empty($u->fcm_token);
    echo "ID: {$u->id} | Name: {$u->name} | Phone: {$u->phone} | Role: " . ($u->role->name ?? 'None') . " | Has Token: " . ($hasToken ? "YES (" . substr($u->fcm_token, 0, 15) . "...)" : "NO") . "\n";
}
