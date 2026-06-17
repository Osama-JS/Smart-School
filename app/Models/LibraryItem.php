<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LibraryItem extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = ['grade_id', 'subject_id', 'uploader_id', 'title', 'file_path'];

    public function grade(): BelongsTo { return $this->belongsTo(Grade::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function uploader(): BelongsTo { return $this->belongsTo(User::class, 'uploader_id'); }
}
