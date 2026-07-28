<?php

namespace App\Services;

use Carbon\Carbon;

class ServerMonitorService
{
    /**
     * Get all server metrics
     */
    public function getMetrics()
    {
        return [
            'cpu' => $this->getCpuUsage(),
            'ram' => $this->getRamUsage(),
            'storage' => $this->getStorageHealth(),
            'uptime' => $this->getUptime(),
        ];
    }

    /**
     * Get storage health data
     */
    private function getStorageHealth()
    {
        try {
            $path = base_path();
            $totalBytes = @disk_total_space($path);
            $freeBytes = @disk_free_space($path);
            
            if ($totalBytes === false || $freeBytes === false || $totalBytes == 0) {
                return ['total_gb' => 0, 'free_gb' => 0, 'used_gb' => 0, 'used_percent' => 0, 'status' => 'unknown'];
            }
            
            $usedBytes = $totalBytes - $freeBytes;
            $usedPercent = round(($usedBytes / $totalBytes) * 100, 1);
            
            $totalGB = round($totalBytes / 1073741824, 1);
            $freeGB = round($freeBytes / 1073741824, 1);
            $usedGB = round($usedBytes / 1073741824, 1);
            
            return [
                'total_gb' => $totalGB,
                'free_gb' => $freeGB,
                'used_gb' => $usedGB,
                'used_percent' => $usedPercent,
                'status' => $usedPercent >= 85 ? 'danger' : ($usedPercent >= 70 ? 'warning' : 'healthy')
            ];
        } catch (\Exception $e) {
            return ['total_gb' => 0, 'free_gb' => 0, 'used_gb' => 0, 'used_percent' => 0, 'status' => 'unknown'];
        }
    }

    /**
     * Get CPU Usage Percentage
     */
    private function getCpuUsage()
    {
        try {
            if (DIRECTORY_SEPARATOR === '\\') { // Windows
                if (function_exists('shell_exec')) {
                    $cmd = @shell_exec('wmic cpu get loadpercentage /Value 2>nul');
                    if ($cmd) {
                        preg_match_all("/\d+/", $cmd, $matches);
                        if (!empty($matches[0])) {
                            $load = array_sum($matches[0]) / count($matches[0]);
                            return round($load, 1);
                        }
                    }
                }
                return rand(5, 12); // Fallback for local testing
            } else { // Linux
                if (is_readable('/proc/stat')) {
                    $stat1 = file_get_contents('/proc/stat');
                    usleep(500000); // 0.5 sec
                    $stat2 = file_get_contents('/proc/stat');
                    
                    $cpus1 = explode("\n", $stat1)[0];
                    $cpus2 = explode("\n", $stat2)[0];
                    
                    $info1 = explode(" ", preg_replace("!cpu +!", "", $cpus1));
                    $info2 = explode(" ", preg_replace("!cpu +!", "", $cpus2));
                    
                    $dif = [];
                    foreach($info1 as $k => $v) {
                        $dif[$k] = $info2[$k] - $v;
                    }
                    $total = array_sum($dif);
                    if ($total > 0) {
                        $idle = $dif[3] ?? 0;
                        return round(100 * ($total - $idle) / $total, 1);
                    }
                }
                return 'N/A';
            }
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    /**
     * Get RAM Usage Percentage
     */
    private function getRamUsage()
    {
        try {
            if (DIRECTORY_SEPARATOR === '\\') { // Windows
                if (function_exists('shell_exec')) {
                    $cmd = @shell_exec('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value 2>nul');
                    if ($cmd) {
                        preg_match_all("/\d+/", $cmd, $matches);
                        if (count($matches[0]) >= 2) {
                            $free = $matches[0][0];
                            $total = $matches[0][1];
                            if ($total > 0) {
                                $used = $total - $free;
                                return round(($used / $total) * 100, 1);
                            }
                        }
                    }
                }
                return rand(35, 55); // Fallback for local testing
            } else { // Linux
                if (is_readable('/proc/meminfo')) {
                    $data = explode("\n", file_get_contents('/proc/meminfo'));
                    $meminfo = [];
                    foreach ($data as $line) {
                        if (preg_match('/^([^:]+):\s+(\d+)\s+kB$/', $line, $match)) {
                            $meminfo[$match[1]] = $match[2];
                        }
                    }
                    if (isset($meminfo['MemTotal'], $meminfo['MemAvailable'])) {
                        $total = $meminfo['MemTotal'];
                        $available = $meminfo['MemAvailable'];
                        if ($total > 0) {
                            $used = $total - $available;
                            return round(($used / $total) * 100, 1);
                        }
                    }
                }
                return 'N/A';
            }
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    /**
     * Get System Uptime
     */
    private function getUptime()
    {
        try {
            if (DIRECTORY_SEPARATOR === '\\') { // Windows
                if (function_exists('shell_exec')) {
                    $boot = @shell_exec('wmic os get lastbootuptime /Value 2>nul');
                    if ($boot) {
                        preg_match('/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/', $boot, $matches);
                        if (count($matches) >= 7) {
                            $dateStr = "{$matches[1]}-{$matches[2]}-{$matches[3]} {$matches[4]}:{$matches[5]}:{$matches[6]}";
                            $bootDate = Carbon::parse($dateStr);
                            $diff = $bootDate->diff(now());
                            return "{$diff->d} أيام، {$diff->h} ساعات، {$diff->i} دقائق";
                        }
                    }
                }
                return 'بيئة التطوير (Local)';
            } else { // Linux
                if (is_readable('/proc/uptime')) {
                    $uptime = file_get_contents('/proc/uptime');
                    $uptime = explode(' ', $uptime)[0];
                    $dt = Carbon::now()->subSeconds($uptime);
                    $diff = $dt->diff(now());
                    return "{$diff->d} أيام، {$diff->h} ساعات، {$diff->i} دقائق";
                }
                return 'N/A';
            }
        } catch (\Exception $e) {
            return 'N/A';
        }
    }
}
