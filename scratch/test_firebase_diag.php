<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== FIREBASE DIAGNOSTICS ===\n";

// 1. Check Service Account Files
$paths = [
    'storage/firebase-service-account.json' => storage_path('firebase-service-account.json'),
    'storage/app/firebase/service_account.json' => storage_path('app/firebase/service_account.json'),
    'storage/app/firebase/serviceAccountKey.json' => storage_path('app/firebase/serviceAccountKey.json'),
    'base_path/firebase-service-account.json' => base_path('firebase-service-account.json'),
];

$foundKey = null;
foreach ($paths as $name => $path) {
    if (file_exists($path)) {
        echo "[FOUND] Key file at: $name ($path)\n";
        $foundKey = $path;
    } else {
        echo "[NOT FOUND] $name\n";
    }
}

if ($foundKey) {
    $content = json_decode(file_get_contents($foundKey), true);
    echo "Project ID in file: " . ($content['project_id'] ?? 'MISSING') . "\n";
    echo "Client Email: " . ($content['client_email'] ?? 'MISSING') . "\n";
} else {
    echo "\n>>> CRITICAL: No firebase-service-account.json found in storage/!\n";
}

// 2. Check Users with FCM Tokens
$usersWithTokens = \App\Models\User::whereNotNull('fcm_token')->where('fcm_token', '!=', '')->get(['id', 'name', 'phone', 'fcm_token', 'fcm_token_updated_at']);
echo "\nTotal users in DB: " . \App\Models\User::count() . "\n";
echo "Users with non-empty fcm_token: " . $usersWithTokens->count() . "\n";

foreach ($usersWithTokens as $u) {
    echo "User ID: {$u->id} | Name: {$u->name} | Token Prefix: " . substr($u->fcm_token, 0, 20) . "... | Updated: {$u->fcm_token_updated_at}\n";
}

if ($usersWithTokens->isEmpty()) {
    echo ">>> NOTICE: No users have registered their fcm_token in the database yet!\n";
}

// 3. Test sending directly if both exist
if ($foundKey && $usersWithTokens->isNotEmpty()) {
    echo "\n--- Testing sendFirebaseNotification to first user ---\n";
    $service = new \App\Services\NotificationService();
    $targetUser = $usersWithTokens->first();
    $result = $service->sendFirebaseNotification($targetUser, 'تجربة إشعار فحص', 'هذا إشعار فحص تجريبي من سكريبت التشخيص');
    echo "Send result: " . ($result ? "SUCCESS ✅" : "FAILED ❌") . "\n";
}
