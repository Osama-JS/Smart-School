<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LessonPreparation extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'teacher_id', 'branch_id', 'academic_year_id', 'semester_id', 'subject_id', 'grade_id', 'division_id', 'period_id',
        'unit_title', 'lesson_title', 'page_numbers', 'curriculum_progress', 'preparation_date', 'content',
        'learning_objectives', 'warm_up', 'teaching_strategies', 'educational_aids',
        'educational_activities', 'behavioral_value', 'acquired_skills',
        'topics_covered', 'assessment_methods', 'reinforcements', 'notes', 'homework', 'attachments', 'status',
        'supervisor_rating', 'supervisor_notes', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'preparation_date' => 'date:Y-m-d',
        'teaching_strategies' => 'array',
        'educational_aids' => 'array',
        'attachments' => 'array',
        'supervisor_rating' => 'integer',
        'reviewed_at' => 'datetime',
    ];

    public function teacher(): BelongsTo  { return $this->belongsTo(User::class, 'teacher_id'); }
    public function branch(): BelongsTo   { return $this->belongsTo(Branch::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function semester(): BelongsTo { return $this->belongsTo(Semester::class); }
    public function subject(): BelongsTo  { return $this->belongsTo(Subject::class); }
    public function grade(): BelongsTo    { return $this->belongsTo(Grade::class); }
    public function division(): BelongsTo { return $this->belongsTo(Division::class); }
    public function period(): BelongsTo   { return $this->belongsTo(DailyPeriod::class, 'period_id'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by'); }

    public function scopeForSemester($query, $semesterId)
    {
        return $query->where('semester_id', $semesterId);
    }

    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
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
            $storedPath = $file->store('lesson_preparations', 'public');
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
     * Remove all stored attachment files for this preparation from public disk.
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
     * Format stored attachments with full public download URLs for API responses.
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
}
