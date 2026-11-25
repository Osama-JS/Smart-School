<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FollowupBook extends Model
{
    use HasFactory;
    use \App\Traits\LogsActivity;

    public const DAY_ALIASES = [
        'saturday'  => ['saturday', 'السبت', '6'],
        'sunday'    => ['sunday', 'الأحد', 'الاحد', '0'],
        'monday'    => ['monday', 'الاثنين', 'الإثنين', '1'],
        'tuesday'   => ['tuesday', 'الثلاثاء', '2'],
        'wednesday' => ['wednesday', 'الأربعاء', 'الاربعاء', '3'],
        'thursday'  => ['thursday', 'الخميس', '4'],
        'friday'    => ['friday', 'الجمعة', '5'],
    ];

    public const ARABIC_DAYS = [
        'Saturday'  => 'السبت',
        'Sunday'    => 'الأحد',
        'Monday'    => 'الاثنين',
        'Tuesday'   => 'الثلاثاء',
        'Wednesday' => 'الأربعاء',
        'Thursday'  => 'الخميس',
        'Friday'    => 'الجمعة',
    ];

    protected $fillable = [
        'teacher_id',
        'subject_id',
        'division_id',
        'period_id',
        'branch_id',
        'academic_year_id',
        'date',
        'lesson_title',
        'notes',
        'page_number',
        'homework',
        'homework_page',
        'attachments',
        'upload_source',
        'uploaded_at',
        'supervisor_rating',
        'supervisor_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'attachments' => 'array',
        'uploaded_at' => 'datetime',
        'supervisor_rating' => 'integer',
        'reviewed_at' => 'datetime',
    ];

    /**
     * Check whether a timetable day_of_week string matches the given English weekday name.
     */
    public static function matchesDayOfWeek(?string $timetableDay, string $englishDayName): bool
    {
        $normalized = mb_strtolower(trim((string) $timetableDay));
        $lowerEnglish = strtolower($englishDayName);
        $aliases = self::DAY_ALIASES[$lowerEnglish] ?? [$lowerEnglish];

        return in_array($normalized, $aliases, true);
    }

    /**
     * Get the Arabic name for an English weekday name.
     */
    public static function arabicDayName(string $englishDayName): string
    {
        return self::ARABIC_DAYS[$englishDayName] ?? $englishDayName;
    }

    /**
     * Determine upload compliance status ('uploaded', 'late', 'pending') against the daily cutoff.
     */
    public function resolveStatus(string $timeLimit = '14:00'): string
    {
        if (!$this->uploaded_at) {
            return 'pending';
        }

        $dateStr = $this->date instanceof Carbon
            ? $this->date->format('Y-m-d')
            : substr((string) $this->date, 0, 10);

        $limitTime = Carbon::parse($dateStr . ' ' . $timeLimit);

        return $this->uploaded_at->gt($limitTime) ? 'late' : 'uploaded';
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function period()
    {
        return $this->belongsTo(DailyPeriod::class, 'period_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Handle keeping existing attachments, deleting removed ones, and storing newly uploaded files.
     */
    public function syncAttachmentsFromRequest(Request $request, bool $isUpdate = false): array
    {
        $disk = Storage::disk('public');
        $current = is_array($this->attachments) ? $this->attachments : [];

        if ($isUpdate) {
            if ($request->boolean('attachments_synced') || $request->has('existing_attachments')) {
                $keptItems = $request->input('existing_attachments', []);
                $keptPaths = collect(is_array($keptItems) ? $keptItems : [])
                    ->map(fn ($item) => is_array($item) ? ($item['path'] ?? null) : $item)
                    ->filter()
                    ->values()
                    ->all();

                $remaining = [];
                foreach ($current as $att) {
                    $path = $att['path'] ?? null;
                    if ($path && in_array($path, $keptPaths, true)) {
                        $remaining[] = $att;
                    } elseif ($path && $disk->exists($path)) {
                        $disk->delete($path);
                    }
                }
                $current = $remaining;
            }
        } else {
            $current = [];
        }

        $uploadedFiles = [];
        foreach (['new_attachments', 'attachments'] as $key) {
            if ($request->hasFile($key)) {
                $files = $request->file($key);
                foreach (is_array($files) ? $files : [$files] as $file) {
                    if ($file instanceof UploadedFile && $file->isValid()) {
                        $uploadedFiles[] = $file;
                    }
                }
            }
        }

        foreach ($uploadedFiles as $file) {
            $storedPath = $file->store('followup_books', 'public');
            $current[] = [
                'name' => $file->getClientOriginalName(),
                'path' => $storedPath,
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ];
        }

        return array_values($current);
    }

    /**
     * Remove all stored attachment files for this follow-up record from public disk.
     */
    public function deleteStoredAttachments(): void
    {
        if (!is_array($this->attachments)) {
            return;
        }

        $disk = Storage::disk('public');
        foreach ($this->attachments as $att) {
            $path = $att['path'] ?? null;
            if ($path && $disk->exists($path)) {
                $disk->delete($path);
            }
        }
    }

    /**
     * Format stored attachments with public URLs for web/API display.
     */
    public function formattedAttachments(): array
    {
        if (!is_array($this->attachments)) {
            return [];
        }

        return array_values(array_filter(array_map(function ($att) {
            if (!is_array($att) || empty($att['path'])) {
                return null;
            }

            return [
                'name' => $att['name'] ?? basename($att['path']),
                'path' => $att['path'],
                'mime' => $att['mime'] ?? null,
                'size' => $att['size'] ?? null,
                'url' => asset('storage/' . $att['path']),
            ];
        }, $this->attachments)));
    }

    /**
     * Fetch uploaded follow-up book homework records for a division and normalize to the mobile homework format.
     */
    public static function formattedHomeworkForDivision(int $divisionId, Request $request): \Illuminate\Support\Collection
    {
        $query = self::with(['subject', 'teacher', 'period'])
            ->where('division_id', $divisionId)
            ->whereNotNull('uploaded_at');

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        } elseif ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        } else {
            $query->whereDate('date', '>=', now()->subDays(30));
        }

        return $query->orderByDesc('date')->orderByDesc('id')->get()->map(function (self $item) {
            $dateStr = $item->date instanceof Carbon ? $item->date->format('Y-m-d') : substr((string) $item->date, 0, 10);

            return [
                'id' => $item->id,
                'subject_id' => $item->subject_id,
                'teacher_id' => $item->teacher_id,
                'division_id' => $item->division_id,
                'period_id' => $item->period_id,
                'period_name' => $item->period?->period_name,
                'lesson_title' => $item->lesson_title,
                'page_numbers' => $item->page_number,
                'homework' => $item->homework,
                'homework_page' => $item->homework_page,
                'notes' => $item->notes,
                'attachments' => $item->formattedAttachments(),
                'preparation_date' => $dateStr,
                'source' => 'followup_book',
                'subject' => $item->subject,
                'teacher' => $item->teacher,
            ];
        });
    }

    /**
     * Merge uploaded follow-up book homework with published lesson preparation homework for student/parent portals.
     */
    public static function getCombinedDivisionHomework(int $divisionId, Request $request): \Illuminate\Support\Collection
    {
        $followupItems = self::formattedHomeworkForDivision($divisionId, $request);

        $prepQuery = LessonPreparation::with(['subject', 'teacher', 'period'])
            ->where('division_id', $divisionId)
            ->where('status', 'published');

        if ($request->filled('date')) {
            $prepQuery->whereDate('preparation_date', $request->date);
        } elseif ($request->filled('start_date') && $request->filled('end_date')) {
            $prepQuery->whereBetween('preparation_date', [$request->start_date, $request->end_date]);
        } else {
            $prepQuery->whereDate('preparation_date', '>=', now()->subDays(30));
        }

        $prepItems = $prepQuery->orderByDesc('preparation_date')->orderByDesc('id')->get()->map(function (LessonPreparation $prep) {
            $dateStr = $prep->preparation_date instanceof Carbon
                ? $prep->preparation_date->format('Y-m-d')
                : substr((string) $prep->preparation_date, 0, 10);

            return [
                'id' => $prep->id,
                'subject_id' => $prep->subject_id,
                'teacher_id' => $prep->teacher_id,
                'division_id' => $prep->division_id,
                'period_id' => $prep->period_id,
                'period_name' => $prep->period?->period_name,
                'lesson_title' => $prep->lesson_title,
                'page_numbers' => $prep->page_numbers,
                'homework' => $prep->homework,
                'homework_page' => $prep->page_numbers,
                'notes' => $prep->notes,
                'attachments' => $prep->formattedAttachments(),
                'preparation_date' => $dateStr,
                'source' => 'lesson_preparation',
                'subject' => $prep->subject,
                'teacher' => $prep->teacher,
            ];
        });

        return $followupItems
            ->concat($prepItems)
            ->sortByDesc('preparation_date')
            ->values();
    }

    /**
     * Match a follow-up book record from a collection for a timetable lesson, prioritizing period_id.
     */
    public static function findMatchingForLesson(
        \Illuminate\Support\Collection $candidates,
        int $subjectId,
        int $divisionId,
        string $dateStr,
        ?int $periodId = null,
        array $matchedIds = []
    ): ?self {
        $dayCandidates = $candidates->filter(function (self $item) use ($subjectId, $divisionId, $dateStr, $matchedIds) {
            if (isset($matchedIds[$item->id])) {
                return false;
            }
            $itemDate = $item->date instanceof Carbon ? $item->date->format('Y-m-d') : substr((string) $item->date, 0, 10);
            return (int) $item->subject_id === $subjectId
                && (int) $item->division_id === $divisionId
                && $itemDate === $dateStr;
        });

        if ($periodId) {
            $exact = $dayCandidates->first(fn (self $item) => (int) $item->period_id === $periodId);
            if ($exact) {
                return $exact;
            }
        }

        $legacy = $dayCandidates->first(fn (self $item) => empty($item->period_id));
        if ($legacy) {
            return $legacy;
        }

        return $dayCandidates->first();
    }
}
