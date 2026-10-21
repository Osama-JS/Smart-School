<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\Division;
use App\Models\Role;
use App\Services\NotificationService;

class ImportStudentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes timeout in queue worker

    protected string $filePath;
    protected int $userId;
    protected ?int $branchId;
    protected int $activeYearId;
    protected string $batchId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $filePath, int $userId, ?int $branchId, int $activeYearId, string $batchId)
    {
        $this->filePath = $filePath;
        $this->userId = $userId;
        $this->branchId = $branchId;
        $this->activeYearId = $activeYearId;
        $this->batchId = $batchId;
    }

    /**
     * Execute the job.
     */
    public function handle(NotificationService $notificationService): void
    {
        @set_time_limit(600);

        Cache::put("import_status_{$this->batchId}", [
            'status'   => 'processing',
            'progress' => 0,
            'total'    => 0,
            'success'  => 0,
            'errors'   => [],
        ], now()->addHours(24));

        $fullPath = Storage::disk('local')->path($this->filePath);
        if (!file_exists($fullPath)) {
            $this->failStatus('لم يتم العثور على ملف الاستيراد.');
            return;
        }

        $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        $rows = [];

        try {
            if (in_array($extension, ['csv', 'txt'])) {
                if (($handle = fopen($fullPath, 'r')) !== false) {
                    $firstLine = fgets($handle);
                    $bom = "\xef\xbb\xbf";
                    if (strncmp($firstLine, $bom, 3) === 0) {
                        $firstLine = substr($firstLine, 3);
                    }
                    $rows[] = str_getcsv($firstLine);
                    while (($data = fgetcsv($handle, 1000, ",")) !== false) {
                        $rows[] = $data;
                    }
                    fclose($handle);
                }
            } else {
                $content = file_get_contents($fullPath);
                if (stripos($content, '<html') !== false && stripos($content, '<table') !== false) {
                    $dom = new \DOMDocument();
                    @$dom->loadHTML('<?xml encoding="UTF-8">' . $content);
                    $tables = $dom->getElementsByTagName('table');
                    if ($tables->length > 0) {
                        $table = $tables->item(0);
                        $trs = $table->getElementsByTagName('tr');
                        foreach ($trs as $tr) {
                            $rowData = [];
                            $tds = $tr->childNodes;
                            foreach ($tds as $td) {
                                if ($td->nodeName === 'td' || $td->nodeName === 'th') {
                                    $rowData[] = trim($td->textContent);
                                }
                            }
                            if (!empty($rowData)) {
                                $rows[] = $rowData;
                            }
                        }
                    }
                } elseif (class_exists(\Shuchkin\SimpleXLSX::class)) {
                    if ($xlsx = \Shuchkin\SimpleXLSX::parse($fullPath)) {
                        $rows = $xlsx->rows();
                    }
                }
            }
        } catch (\Exception $e) {
            $this->failStatus('فشل في قراءة ملف الإكسل: ' . $e->getMessage());
            return;
        }

        if (empty($rows)) {
            $this->failStatus('الملف فارغ أو تعذر قراءة بياناته.');
            return;
        }

        $headerIndex = -1;
        foreach ($rows as $index => $row) {
            if (isset($row[0]) && str_contains($row[0], 'الاسم الرباعي')) {
                $headerIndex = $index;
                break;
            }
        }

        if ($headerIndex === -1) {
            $this->failStatus('لم يتم العثور على ترويسة الأعمدة الصحيحة في الملف.');
            return;
        }

        $dataRows = array_slice($rows, $headerIndex + 1);
        $totalRows = count(array_filter($dataRows, fn($r) => !empty(array_filter($r))));

        $divisions = Division::with(['grade.section'])
            ->where('branch_id', $this->branchId)
            ->where(function ($q) {
                $q->where('academic_year_id', $this->activeYearId)
                  ->orWhereNull('academic_year_id');
            })
            ->get();

        $normalize = function ($str) {
            $str = trim(mb_strtolower($str));
            $str = preg_replace('/^(المرحلة|مرحلة|الصف|صف|الشعبة|شعبة)\s+/u', '', $str);
            return trim($str);
        };

        $divisionMap = [];
        foreach ($divisions as $div) {
            $secName = trim($div->grade->section->name ?? '');
            $grdName = trim($div->grade->name ?? '');
            $dvnName = trim($div->name ?? '');

            $exactKey = mb_strtolower($secName . '|' . $grdName . '|' . $dvnName);
            $divisionMap[$exactKey] = $div->id;

            $normKey = $normalize($secName) . '|' . $normalize($grdName) . '|' . $normalize($dvnName);
            if (!isset($divisionMap[$normKey])) {
                $divisionMap[$normKey] = $div->id;
            }
        }

        $studentRole = Role::where('name', 'طالب')->first();
        if (!$studentRole) {
            $this->failStatus('صلاحية (طالب) غير معرفة في النظام.');
            return;
        }

        // تشفير كلمة المرور الافتراضية مرة واحدة فقط مسبقاً لمنع استنزاف المعالج وتفادي Timeout
        $defaultPassword = '12345678';
        $hashedDefaultPassword = Hash::make($defaultPassword);

        $existingUsernames = User::where('username', 'LIKE', date('Y') . '%')->pluck('username')->flip()->toArray();

        $successCount = 0;
        $errors = [];
        $importedCredentials = [];
        $processedCount = 0;

        foreach ($dataRows as $index => $row) {
            if (empty(array_filter($row))) continue;
            
            $processedCount++;
            $name = trim($row[0] ?? '');
            $nationalId = trim($row[1] ?? '');
            $phone = trim($row[2] ?? '');
            $email = trim($row[3] ?? '');
            $sectionName = trim($row[4] ?? '');
            $gradeName = trim($row[5] ?? '');
            $divisionName = trim($row[6] ?? '');

            $rowNumber = $headerIndex + 2 + $index;

            if (empty($name) || empty($sectionName) || empty($gradeName) || empty($divisionName)) {
                $errors[] = "الصف رقم $rowNumber: الاسم، المرحلة، الصف، والشعبة بيانات مطلوبة.";
                continue;
            }

            $divKey = mb_strtolower($sectionName . '|' . $gradeName . '|' . $divisionName);
            $divNormKey = $normalize($sectionName) . '|' . $normalize($gradeName) . '|' . $normalize($divisionName);
            $divisionId = $divisionMap[$divKey] ?? $divisionMap[$divNormKey] ?? null;

            if (!$divisionId) {
                $errors[] = "الصف رقم $rowNumber: الشعبة ($divisionName) في ($gradeName - $sectionName) غير موجودة.";
                continue;
            }

            try {
                DB::beginTransaction();

                do {
                    $username = date('Y') . mt_rand(10000, 99999);
                } while (isset($existingUsernames[$username]));
                $existingUsernames[$username] = true;

                $user = User::create([
                    'name'                 => $name,
                    'username'             => $username,
                    'password'             => $hashedDefaultPassword,
                    'must_change_password' => true, // إجبار الطالب على تغييرها عند أول تسجيل دخول
                    'email'                => !empty($email) ? $email : null,
                    'phone'                => !empty($phone) ? $phone : null,
                    'national_id'          => !empty($nationalId) ? $nationalId : null,
                    'role_id'              => $studentRole->id,
                    'branch_id'            => $this->branchId,
                    'is_active'            => true,
                ]);

                $student = Student::create([
                    'user_id'                => $user->id,
                    'transport_subscription' => 0,
                ]);

                Enrollment::create([
                    'student_id'       => $student->id,
                    'division_id'      => $divisionId,
                    'academic_year_id' => $this->activeYearId,
                    'status'           => 'active',
                ]);

                DB::commit();
                $successCount++;

                $importedCredentials[] = [
                    'name'     => $name,
                    'username' => $username,
                    'password' => $defaultPassword,
                    'section'  => $sectionName,
                    'grade'    => $gradeName,
                    'division' => $divisionName,
                ];

            } catch (\Exception $e) {
                DB::rollBack();
                $errors[] = "الصف رقم $rowNumber: خطأ (" . $e->getMessage() . ")";
            }

            // تحديث شريط التقدم كل 10 طلاب
            if ($processedCount % 10 === 0 || $processedCount === $totalRows) {
                $percent = $totalRows > 0 ? round(($processedCount / $totalRows) * 100) : 100;
                Cache::put("import_status_{$this->batchId}", [
                    'status'   => 'processing',
                    'progress' => $percent,
                    'total'    => $totalRows,
                    'success'  => $successCount,
                    'errors'   => array_slice($errors, -10), // آخر 10 أخطاء
                ], now()->addHours(24));
            }
        }

        // حفظ بيانات بطاقات الدخول لتكون متاحة للتحميل والطباعة
        if (!empty($importedCredentials)) {
            Storage::disk('local')->put("imports/credentials_{$this->batchId}.json", json_encode($importedCredentials, JSON_UNESCAPED_UNICODE));
        }

        // حفظ الحالة النهائية
        Cache::put("import_status_{$this->batchId}", [
            'status'         => 'completed',
            'progress'       => 100,
            'total'          => $totalRows,
            'success'        => $successCount,
            'errors'         => $errors,
            'has_credentials'=> !empty($importedCredentials),
        ], now()->addHours(24));

        // إرسال إشعار للمسؤول الذي طلب الاستيراد
        $notificationService->sendInternalNotification(
            $this->userId,
            'اكتمل استيراد الطلاب بنجاح',
            "تم استيراد $successCount طالب بنجاح من أصل $totalRows طالب. يمكنك الآن طباعة بطاقات الدخول.",
            'academic'
        );

        // حذف الملف المؤقت
        @Storage::disk('local')->delete($this->filePath);
    }

    protected function failStatus(string $errorMessage): void
    {
        Cache::put("import_status_{$this->batchId}", [
            'status'   => 'failed',
            'progress' => 0,
            'total'    => 0,
            'success'  => 0,
            'errors'   => [$errorMessage],
        ], now()->addHours(24));

        @Storage::disk('local')->delete($this->filePath);
    }
}
