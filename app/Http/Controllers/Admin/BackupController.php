<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use App\Services\DatabaseBackupService;
use Carbon\Carbon;

class BackupController extends Controller
{
    private string $backupDirectory;

    public function __construct()
    {
        $this->backupDirectory = storage_path('app/backups');
    }

    public function index()
    {
        if (!File::exists($this->backupDirectory)) {
            File::makeDirectory($this->backupDirectory, 0755, true);
        }

        $files = File::files($this->backupDirectory);

        $backups = array_map(function ($file) {
            $sizeBytes = $file->getSize();
            $mtime = $file->getMTime();
            return [
                'name'        => $file->getFilename(),
                'size'        => $this->formatSizeUnits($sizeBytes),
                'size_bytes'  => $sizeBytes,
                'date'        => Carbon::createFromTimestamp($mtime)->format('Y-m-d H:i:s'),
                'timestamp'   => $mtime,
                'age'         => Carbon::createFromTimestamp($mtime)->diffForHumans(),
            ];
        }, $files);

        // Sort newest first
        usort($backups, fn($a, $b) => $b['timestamp'] <=> $a['timestamp']);

        // Stats
        $totalSize  = array_sum(array_column($backups, 'size_bytes'));
        $latestDate = count($backups) > 0
            ? Carbon::createFromTimestamp($backups[0]['timestamp'])->diffForHumans()
            : null;

        return Inertia::render('Admin/Backups/Index', [
            'backups'   => $backups,
            'stats'     => [
                'total_count'      => count($backups),
                'total_size'       => $this->formatSizeUnits($totalSize),
                'latest_backup_age'=> $latestDate,
                'backup_directory' => $this->backupDirectory,
            ],
        ]);
    }

    public function store(DatabaseBackupService $backupService)
    {
        try {
            $filename = $backupService->createBackup('backups');
            $path = storage_path("app/backups/{$filename}");
            $size = File::exists($path) ? $this->formatSizeUnits(File::size($path)) : 'N/A';

            return back()->with('success', "✅ تم إنشاء النسخة الاحتياطية بنجاح: {$filename} ({$size})");
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function download($filename)
    {
        // Security: strip directory traversal
        $filename = basename($filename);
        $path = $this->backupDirectory . '/' . $filename;

        if (!File::exists($path)) {
            abort(404, 'الملف غير موجود.');
        }

        return response()->download($path);
    }

    public function destroy($filename)
    {
        // Security: strip directory traversal
        $filename = basename($filename);
        $path = $this->backupDirectory . '/' . $filename;

        if (File::exists($path)) {
            File::delete($path);
            return back()->with('success', "تم حذف النسخة الاحتياطية ({$filename}) بنجاح.");
        }

        return back()->with('error', 'الملف غير موجود.');
    }

    public function destroyAll()
    {
        if (!File::exists($this->backupDirectory)) {
            return back()->with('error', 'مجلد النسخ الاحتياطية غير موجود.');
        }

        $files = File::files($this->backupDirectory);
        $count = count($files);

        foreach ($files as $file) {
            File::delete($file->getPathname());
        }

        return back()->with('success', "تم حذف جميع النسخ الاحتياطية ({$count} نسخة) بنجاح.");
    }

    private function formatSizeUnits(int $bytes): string
    {
        if ($bytes >= 1073741824) return number_format($bytes / 1073741824, 2) . ' GB';
        if ($bytes >= 1048576)    return number_format($bytes / 1048576, 2) . ' MB';
        if ($bytes >= 1024)       return number_format($bytes / 1024, 2) . ' KB';
        if ($bytes > 1)           return $bytes . ' bytes';
        if ($bytes === 1)         return '1 byte';
        return '0 bytes';
    }
}
