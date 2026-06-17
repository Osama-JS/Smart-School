<?php
$dir = __DIR__ . '/../app/Models';
$files = scandir($dir);

foreach ($files as $file) {
    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        if ($file === 'ActivityLog.php') continue;
        
        $path = $dir . '/' . $file;
        $content = file_get_contents($path);
        
        if (strpos($content, 'use \App\Traits\LogsActivity;') === false && strpos($content, 'use App\Traits\LogsActivity;') === false) {
            // Find the opening brace of the class
            $pattern = '/(class\s+[a-zA-Z0-9_]+\s*(?:extends\s+[a-zA-Z0-9_\\\\]+)?\s*(?:implements\s+[a-zA-Z0-9_\\\\,\s]+)?\s*\{)/';
            
            if (preg_match($pattern, $content, $matches)) {
                $replacement = $matches[1] . "\n    use \\App\\Traits\\LogsActivity;\n";
                $newContent = str_replace($matches[1], $replacement, $content);
                file_put_contents($path, $newContent);
                echo "Added LogsActivity to $file\n";
            }
        }
    }
}
echo "Done.\n";
