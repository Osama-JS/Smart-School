<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Simulate request validation
$data = [
    'status' => 'present',
    'check_in' => '',
    'check_out' => '',
    'late_minutes' => 0
];

$validator = Validator::make($data, [
    'check_in'    => 'nullable|date_format:H:i',
    'check_out'   => 'nullable|date_format:H:i',
    'status'      => 'required|in:present,absent,late,excused',
    'late_minutes'=> 'nullable|integer|min:0',
]);

if ($validator->fails()) {
    echo "Validation failed:\n";
    print_r($validator->errors()->toArray());
} else {
    echo "Validation passed!\n";
    print_r($validator->validated());
}
