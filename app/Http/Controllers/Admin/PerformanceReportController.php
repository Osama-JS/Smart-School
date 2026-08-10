<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use App\Models\SlowQuery;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PerformanceReportController extends Controller
{
    public function index()
    {
        // 1. Calculate Average Response Time for Today
        $date = now()->format('Y-m-d');
        $totalTime = Cache::get("perf_req_time_{$date}", 0);
        $totalReqs = Cache::get("perf_req_count_{$date}", 0);
        $avgResponseTime = $totalReqs > 0 ? round($totalTime / $totalReqs) : 0;

        // 2. Fetch Slow Queries
        $slowQueries = SlowQuery::latest('execution_time_ms')->take(50)->get();

        // 3. Fetch Background Jobs Stats
        $pendingJobs = DB::table('jobs')->count();
        $failedJobsCount = DB::table('failed_jobs')->count();
        $failedJobs = DB::table('failed_jobs')->latest('failed_at')->take(10)->get();

        // 4. Fetch Database Health & Size
        $databaseName = DB::connection()->getDatabaseName();
        
        $dbTables = DB::select("
            SELECT table_name,
                   ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
            FROM information_schema.TABLES
            WHERE table_schema = ?
            ORDER BY (data_length + index_length) DESC
            LIMIT 100
        ", [$databaseName]);
        
        $totalSizeResult = DB::select("
            SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_size_mb
            FROM information_schema.TABLES
            WHERE table_schema = ?
        ", [$databaseName]);
        
        $totalDatabaseSize = $totalSizeResult[0]->total_size_mb ?? 0;

        // 5. Fetch Disk Space & Uploads size
        $diskPath = base_path();
        $totalDiskSpace = disk_total_space($diskPath) ?: 1;
        $freeDiskSpace = disk_free_space($diskPath) ?: 0;
        $usedDiskSpace = $totalDiskSpace - $freeDiskSpace;
        
        $diskHealth = [
            'total_gb' => round($totalDiskSpace / 1024 / 1024 / 1024, 2),
            'used_gb' => round($usedDiskSpace / 1024 / 1024 / 1024, 2),
            'free_gb' => round($freeDiskSpace / 1024 / 1024 / 1024, 2),
            'usage_percent' => round(($usedDiskSpace / $totalDiskSpace) * 100, 1),
        ];

        $storageSize = cache()->remember('storage_folder_size', 300, function() {
            $size = 0;
            $path = storage_path('app/public');
            if (is_dir($path)) {
                $files = \Illuminate\Support\Facades\File::allFiles($path);
                foreach ($files as $file) {
                    $size += $file->getSize();
                }
            }
            return round($size / 1024 / 1024, 2); // in MB
        });
        
        $diskHealth['uploads_mb'] = $storageSize;

        return Inertia::render('Admin/Performance/Index', [
            'avgResponseTime' => $avgResponseTime,
            'totalRequests' => $totalReqs,
            'slowQueries' => $slowQueries,
            'queueStats' => [
                'pending' => $pendingJobs,
                'failed_count' => $failedJobsCount,
                'recent_failed' => $failedJobs
            ],
            'dbHealth' => [
                'total_size_mb' => $totalDatabaseSize,
                'top_tables' => $dbTables
            ],
            'diskHealth' => $diskHealth
        ]);
    }

    public function optimizeSystem(Request $request)
    {
        $type = $request->input('type');

        try {
            switch ($type) {
                case 'clear_cache':
                    Artisan::call('cache:clear');
                    $message = 'تم تنظيف الذاكرة المؤقتة (Cache) بنجاح.';
                    break;
                case 'clear_views':
                    Artisan::call('view:clear');
                    $message = 'تم تنظيف ذاكرة الواجهات (Views) بنجاح.';
                    break;
                case 'optimize_routes':
                    Artisan::call('route:cache');
                    $message = 'تم بناء الذاكرة المؤقتة للمسارات وتسريعها بنجاح.';
                    break;
                case 'clear_all':
                    Artisan::call('optimize:clear');
                    $message = 'تم تنظيف النظام بالكامل بنجاح.';
                    break;
                case 'optimize_all':
                    Artisan::call('optimize');
                    $message = 'تم تحسين وتسريع النظام بالكامل بنجاح.';
                    break;
                default:
                    return back()->with('error', 'نوع التحسين غير معروف.');
            }
            
            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', 'حدث خطأ أثناء تنفيذ الأمر: ' . $e->getMessage());
        }
    }

    public function clearSlowQueries()
    {
        SlowQuery::truncate();
        return redirect()->back()->with('success', 'تم مسح سجل الاستعلامات البطيئة بنجاح.');
    }

    public function retryFailedJobs()
    {
        Artisan::call('queue:retry', ['id' => 'all']);
        return redirect()->back()->with('success', 'تمت إعادة جدولة جميع المهام الفاشلة للمحاولة مرة أخرى.');
    }

    public function flushFailedJobs()
    {
        Artisan::call('queue:flush');
        return redirect()->back()->with('success', 'تم حذف جميع المهام الفاشلة بشكل نهائي.');
    }

    public function archiveRecords(Request $request)
    {
        $request->validate([
            'table' => 'required|string|in:notifications,activity_logs,traffic_analytics,slow_queries',
            'duration' => 'required|string|in:1_month,3_months,6_months,1_year'
        ]);

        $table = $request->table;
        $duration = $request->duration;

        $months = [
            '1_month' => 1,
            '3_months' => 3,
            '6_months' => 6,
            '1_year' => 12
        ][$duration];

        $cutoffDate = Carbon::now()->subMonths($months);

        // Check if there are records
        $query = DB::table($table)->where('created_at', '<', $cutoffDate);
        $count = $query->count();

        if ($count === 0) {
            return back()->with('error', 'لا توجد سجلات قديمة تطابق هذه المدة لأرشفتها.');
        }

        // Generate CSV
        $filename = "archive_{$table}_" . date('Y_m_d_His') . ".csv";
        $directory = 'archives';
        if (!Storage::disk('local')->exists($directory)) {
            Storage::disk('local')->makeDirectory($directory);
        }
        $filePath = storage_path("app/{$directory}/{$filename}");

        $file = fopen($filePath, 'w');
        // Add BOM for Excel UTF-8 compatibility
        fputs($file, $bom =( chr(0xEF) . chr(0xBB) . chr(0xBF) ));

        $firstRow = true;
        
        // Chunking to avoid memory limits
        $query->orderBy('id')->chunk(1000, function ($records) use ($file, &$firstRow) {
            foreach ($records as $record) {
                $recordArray = (array) $record;
                if ($firstRow) {
                    fputcsv($file, array_keys($recordArray));
                    $firstRow = false;
                }
                fputcsv($file, array_values($recordArray));
            }
        });

        fclose($file);

        // Delete the archived records
        $query->delete();

        return back()->with('success', "تمت أرشفة وحذف {$count} سجل من جدول {$table} بنجاح.")
                     ->with('archive_url', route('admin.performance.archive.download', ['filename' => $filename]));
    }

    public function downloadArchive($filename)
    {
        $path = storage_path("app/archives/{$filename}");
        if (!file_exists($path)) {
            abort(404, 'ملف الأرشيف غير موجود.');
        }
        return response()->download($path);
    }
}
