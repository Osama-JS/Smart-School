<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'image_path',
        'category',
        'is_published',
        'published_at',
        'is_notified',
        'author_id',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_notified' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        if ($this->relationLoaded('attachments') && $this->attachments->isNotEmpty()) {
            return $this->attachments->first()->file_url;
        }
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    public function attachments()
    {
        return $this->hasMany(NewsAttachment::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function likes()
    {
        return $this->hasMany(NewsLike::class);
    }

    public function comments()
    {
        return $this->hasMany(NewsComment::class);
    }
}
