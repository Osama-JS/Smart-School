<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use App\Services\DatabaseBackupService;

class BackupController extends Controller
{
    public function index()
    {
        $directory = storage_path('app/backups');
        
        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $files = File::files($directory);
        
        $backups = array_map(function ($file) {
            return [
                'name' => $file->getFilename(),
                'size' => $this->formatSizeUnits($file->getSize()),
                'date' => date('Y-m-d H:i:s', $file->getMTime()),
                'timestamp' => $file->getMTime(),
            ];
        }, $files);

        // Sort backups by date descending
        usort($backups, function ($a, $b) {
            return $b['timestamp'] <=> $a['timestamp'];
        });

        return Inertia::render('Admin/Backups/Index', [
            'backups' => $backups
        ]);
    }

    public function store(DatabaseBackupService $backupService)
    {
        try {
            $filename = $backupService->createBackup('backups');
            return back()->with('success', "تم إنشاء النسخة الاحتياطية بنجاح: {$filename}");
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function download($filename)
    {
        $path = storage_path("app/backups/{$filename}");
        
        if (!File::exists($path)) {
            abort(404, "الملف غير موجود.");
        }

        return response()->download($path);
    }

    public function destroy($filename)
    {
        $path = storage_path("app/backups/{$filename}");
        
        if (File::exists($path)) {
            File::delete($path);
            return back()->with('success', 'تم حذف النسخة الاحتياطية بنجاح.');
        }

        return back()->with('error', 'الملف غير موجود.');
    }

    private function formatSizeUnits($bytes)
    {
        if ($bytes >= 1073741824) {
            $bytes = number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            $bytes = number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            $bytes = number_format($bytes / 1024, 2) . ' KB';
        } elseif ($bytes > 1) {
            $bytes = $bytes . ' bytes';
        } elseif ($bytes == 1) {
            $bytes = $bytes . ' byte';
        } else {
            $bytes = '0 bytes';
        }

        return $bytes;
    }
}
