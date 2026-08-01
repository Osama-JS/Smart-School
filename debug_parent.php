<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::create('/parent/dashboard', 'GET')
);
// Force login as parent
$parent = App\Models\User::whereHas('role', function($q){$q->where('name', 'ولي أمر');})->first();
Auth::login($parent);
$controller = new App\Http\Controllers\Student\StudentDashboardController();
$res = $controller->index($request);
echo json_encode($res->toResponse($request)->getData(true));
