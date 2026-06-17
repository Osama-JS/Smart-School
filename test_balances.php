<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $user = \App\Models\User::first();
    auth()->login($user);
    $req = \Illuminate\Http\Request::create('/hr/leave-balances', 'GET');
    $res = app(\Illuminate\Contracts\Http\Kernel::class)->handle($req);
    echo "STATUS: " . $res->status() . "\n";
    if ($res->status() !== 200) {
        echo "CONTENT: " . $res->getContent() . "\n";
    } else {
        echo "OK\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
