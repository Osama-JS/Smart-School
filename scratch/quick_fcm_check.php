<?php
echo "=== QUICK FILE & DB CHECK ===\n";

$paths = [
    'storage/firebase-service-account.json' => __DIR__ . '/../storage/firebase-service-account.json',
    'storage/app/firebase/service_account.json' => __DIR__ . '/../storage/app/firebase/service_account.json',
    'storage/app/firebase/serviceAccountKey.json' => __DIR__ . '/../storage/app/firebase/serviceAccountKey.json',
    'firebase-service-account.json' => __DIR__ . '/../firebase-service-account.json',
];

foreach ($paths as $name => $path) {
    if (file_exists($path)) {
        echo "[EXISTS] $name\n";
        $data = json_decode(file_get_contents($path), true);
        echo "  - Project ID: " . ($data['project_id'] ?? 'null') . "\n";
        echo "  - Client Email: " . ($data['client_email'] ?? 'null') . "\n";
    } else {
        echo "[MISSING] $name\n";
    }
}

// Check database directly
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=smart_school;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $stmt = $pdo->query("SELECT id, name, phone, fcm_token, fcm_token_updated_at FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ''");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "\nTotal users with fcm_token in DB: " . count($users) . "\n";
    foreach ($users as $u) {
        echo "ID: {$u['id']} | Name: {$u['name']} | Token: " . substr($u['fcm_token'], 0, 25) . "...\n";
    }
} catch (Exception $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}
