<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class DatabaseBackupService
{
    /**
     * Create a new database backup.
     *
     * @param string $directory
     * @return string The generated filename
     * @throws \Exception
     */
    public function createBackup($directory = 'backups')
    {
        $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
        $path = storage_path('app/' . $directory);

        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }

        $filePath = $path . '/' . $filename;
        
        $host = env('DB_HOST', '127.0.0.1');
        $username = env('DB_USERNAME', 'root');
        $password = env('DB_PASSWORD', '');
        $database = env('DB_DATABASE', '');
        $port = env('DB_PORT', '3306');

        if (empty($database)) {
            throw new \Exception("اسم قاعدة البيانات غير موجود في الإعدادات.");
        }

        // Detect mysqldump path (support for Windows XAMPP and standard Linux environments)
        $mysqldumpPath = 'mysqldump';
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            if (file_exists('C:\xampp\mysql\bin\mysqldump.exe')) {
                $mysqldumpPath = '"C:\xampp\mysql\bin\mysqldump.exe"';
            }
        }

        $passwordParam = empty($password) ? '' : "-p\"{$password}\"";
        
        // Command to execute
        $command = "{$mysqldumpPath} -h {$host} -P {$port} -u {$username} {$passwordParam} {$database} > \"{$filePath}\" 2>&1";

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            // If backup fails, clean up the empty/corrupt file
            if (File::exists($filePath)) {
                File::delete($filePath);
            }
            throw new \Exception("فشلت عملية أخذ النسخة الاحتياطية. رمز الخطأ: {$returnVar}. التفاصيل: " . implode(" ", $output));
        }

        return $filename;
    }
}
