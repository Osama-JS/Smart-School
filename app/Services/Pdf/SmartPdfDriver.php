<?php

namespace App\Services\Pdf;

use Illuminate\Support\Facades\Log;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;
use Spatie\Browsershot\Browsershot;
use Spatie\LaravelPdf\Drivers\BrowsershotDriver;
use Spatie\LaravelPdf\Enums\Orientation;
use Spatie\LaravelPdf\PdfOptions;

class SmartPdfDriver extends BrowsershotDriver
{
    protected static ?bool $nodeAvailableCache = null;

    public function __construct(array $config = [])
    {
        if (class_exists(Browsershot::class)) {
            parent::__construct($config);
        } else {
            $this->config = $config;
        }
    }

    public function generatePdf(string $html, ?string $headerHtml, ?string $footerHtml, PdfOptions $options): string
    {
        if ($this->shouldUseMpdf()) {
            return $this->generateWithMpdf($html, $headerHtml, $footerHtml, $options);
        }

        try {
            return parent::generatePdf($html, $headerHtml, $footerHtml, $options);
        } catch (\Throwable $e) {
            Log::warning('Browsershot PDF failed, falling back to mPDF: ' . $e->getMessage());

            return $this->generateWithMpdf($html, $headerHtml, $footerHtml, $options);
        }
    }

    public function savePdf(string $html, ?string $headerHtml, ?string $footerHtml, PdfOptions $options, string $path): void
    {
        if ($this->shouldUseMpdf()) {
            $this->saveWithMpdf($html, $headerHtml, $footerHtml, $options, $path);

            return;
        }

        try {
            parent::savePdf($html, $headerHtml, $footerHtml, $options, $path);
        } catch (\Throwable $e) {
            Log::warning('Browsershot PDF save failed, falling back to mPDF: ' . $e->getMessage());

            $this->saveWithMpdf($html, $headerHtml, $footerHtml, $options, $path);
        }
    }

    protected function shouldUseMpdf(): bool
    {
        if (strtolower((string) config('laravel-pdf.driver', 'browsershot')) === 'mpdf') {
            return true;
        }

        if (strtolower((string) env('LARAVEL_PDF_DRIVER', '')) === 'mpdf') {
            return true;
        }

        if (! class_exists(Browsershot::class) || ! $this->isNodeAvailable()) {
            return true;
        }

        if (PHP_OS_FAMILY !== 'Windows') {
            $chromeCandidates = array_filter([
                $this->config['chrome_path'] ?? null,
                env('LARAVEL_PDF_CHROME_PATH'),
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/chromium',
                '/usr/bin/chromium-browser',
                '/snap/bin/chromium',
            ]);

            $hasLinuxChrome = false;
            foreach ($chromeCandidates as $candidate) {
                if (is_string($candidate) && $candidate !== '' && @is_file($candidate)) {
                    $hasLinuxChrome = true;
                    break;
                }
            }

            if (! $hasLinuxChrome) {
                return true;
            }
        }

        return false;
    }

    protected function isNodeAvailable(): bool
    {
        if (self::$nodeAvailableCache !== null) {
            return self::$nodeAvailableCache;
        }

        $configuredNode = $this->config['node_binary'] ?? env('LARAVEL_PDF_NODE_BINARY');
        if (is_string($configuredNode) && $configuredNode !== '' && @is_file($configuredNode)) {
            return self::$nodeAvailableCache = true;
        }

        if (PHP_OS_FAMILY !== 'Windows') {
            foreach (['/usr/bin/node', '/usr/local/bin/node', '/opt/homebrew/bin/node'] as $path) {
                if (@is_file($path) && @is_executable($path)) {
                    return self::$nodeAvailableCache = true;
                }
            }
        }

        if (function_exists('exec')) {
            $cmd = PHP_OS_FAMILY === 'Windows' ? 'where node 2>NUL' : 'command -v node 2>/dev/null';
            $output = [];
            $exitCode = 1;
            @exec($cmd, $output, $exitCode);
            if ($exitCode === 0 && ! empty($output)) {
                return self::$nodeAvailableCache = true;
            }
        }

        return self::$nodeAvailableCache = false;
    }

    protected function generateWithMpdf(string $html, ?string $headerHtml, ?string $footerHtml, PdfOptions $options): string
    {
        $mpdf = $this->buildMpdf($html, $headerHtml, $footerHtml, $options);

        return $mpdf->Output('', Destination::STRING_RETURN);
    }

    protected function saveWithMpdf(string $html, ?string $headerHtml, ?string $footerHtml, PdfOptions $options, string $path): void
    {
        $dir = dirname($path);
        if (! is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $mpdf = $this->buildMpdf($html, $headerHtml, $footerHtml, $options);
        $mpdf->Output($path, Destination::FILE);
    }

    protected function buildMpdf(string $html, ?string $headerHtml, ?string $footerHtml, PdfOptions $options): Mpdf
    {
        $tempDir = storage_path('app/mpdf');
        if (! is_dir($tempDir)) {
            @mkdir($tempDir, 0775, true);
        }

        $isLandscape = $options->orientation === Orientation::Landscape->value;

        if ($options->paperSize && isset($options->paperSize['width'], $options->paperSize['height'])) {
            $mpdfFormat = [(float) $options->paperSize['width'], (float) $options->paperSize['height']];
        } else {
            $baseFormat = strtoupper((string) ($options->format ?: 'A4'));
            $mpdfFormat = $isLandscape ? ($baseFormat . '-L') : $baseFormat;
        }

        $margins = $options->margins ?? [];
        $marginTop = isset($margins['top']) ? (float) $margins['top'] : 10.0;
        $marginRight = isset($margins['right']) ? (float) $margins['right'] : 10.0;
        $marginBottom = isset($margins['bottom']) ? (float) $margins['bottom'] : 16.0;
        $marginLeft = isset($margins['left']) ? (float) $margins['left'] : 10.0;

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => $mpdfFormat,
            'orientation' => $isLandscape ? 'L' : 'P',
            'margin_top' => $marginTop,
            'margin_right' => $marginRight,
            'margin_bottom' => $marginBottom,
            'margin_left' => $marginLeft,
            'margin_header' => 4,
            'margin_footer' => 5,
            'tempDir' => $tempDir,
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            'default_font' => 'xbriyaz',
        ]);

        if (str_contains($html, 'dir="rtl"') || str_contains($html, "dir='rtl'") || preg_match('/\p{Arabic}/u', $html)) {
            $mpdf->SetDirectionality('rtl');
        }

        if ($headerHtml !== null && trim($headerHtml) !== '') {
            $mpdf->SetHTMLHeader($this->prepareHtmlForMpdf($headerHtml, true));
        }

        if ($footerHtml !== null && trim($footerHtml) !== '') {
            $mpdf->SetHTMLFooter($this->prepareHtmlForMpdf($footerHtml, true));
        }

        $cleanHtml = $this->prepareHtmlForMpdf($html, false);
        $mpdf->WriteHTML($cleanHtml);

        return $mpdf;
    }

    protected function prepareHtmlForMpdf(string $html, bool $isHeaderOrFooter): string
    {
        $html = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $html) ?? $html;
        $html = preg_replace('/<link\b[^>]*href=["\']https?:\/\/fonts\.googleapis\.com[^"\']*["\'][^>]*>/is', '', $html) ?? $html;
        $html = preg_replace('/@import\s+url\([^)]+\)\s*;?/is', '', $html) ?? $html;

        if ($isHeaderOrFooter) {
            $html = preg_replace('/<span\b[^>]*class=["\'][^"\']*pageNumber[^"\']*["\'][^>]*>.*?<\/span>/is', '{PAGENO}', $html) ?? $html;
            $html = preg_replace('/<span\b[^>]*class=["\'][^"\']*totalPages[^"\']*["\'][^>]*>.*?<\/span>/is', '{nbpg}', $html) ?? $html;
        }

        $html = preg_replace_callback(
            '/(<img\b[^>]*\bsrc=["\'])([^"\']+)(["\'])/is',
            function (array $matches): string {
                $prefix = $matches[1];
                $src = $matches[2];
                $suffix = $matches[3];

                if (str_starts_with($src, 'data:')) {
                    return $matches[0];
                }

                $localPath = $this->resolveLocalAssetPath($src);
                if ($localPath !== null) {
                    return $prefix . $localPath . $suffix;
                }

                return $matches[0];
            },
            $html
        ) ?? $html;

        return $html;
    }

    protected function resolveLocalAssetPath(string $src): ?string
    {
        $path = parse_url($src, PHP_URL_PATH) ?: $src;
        $path = rawurldecode($path);

        if (preg_match('#/storage/(.+)$#i', $path, $m)) {
            $candidate = storage_path('app/public/' . ltrim($m[1], '/'));
            if (@is_file($candidate)) {
                return $candidate;
            }
            $publicCandidate = public_path('storage/' . ltrim($m[1], '/'));
            if (@is_file($publicCandidate)) {
                return $publicCandidate;
            }
        }

        if (preg_match('#/images/(.+)$#i', $path, $m)) {
            $candidate = public_path('images/' . ltrim($m[1], '/'));
            if (@is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }
}
