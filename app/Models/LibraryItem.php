<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LibraryItem extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'grade_id', 'subject_id', 'uploader_id', 'title', 'file_path', 'external_url',
        'item_type', 'category', 'target_audience', 'thumbnail_path', 'views_count', 'downloads_count'
    ];
    protected $appends = ['file_url', 'thumbnail_url', 'is_bookmarked_by_user', 'average_rating', 'user_rating'];

    public function getFileUrlAttribute()
    {
        if ($this->external_url) {
            return $this->external_url;
        }
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }

    public function getThumbnailUrlAttribute()
    {
        return $this->thumbnail_path ? asset('storage/' . $this->thumbnail_path) : null;
    }

    public function grade(): BelongsTo { return $this->belongsTo(Grade::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function uploader(): BelongsTo { return $this->belongsTo(User::class, 'uploader_id'); }

    public function bookmarks()
    {
        return $this->belongsToMany(User::class, 'library_bookmarks')->withTimestamps();
    }

    public function ratings()
    {
        return $this->belongsToMany(User::class, 'library_ratings')->withPivot('rating')->withTimestamps();
    }

    public function getIsBookmarkedByUserAttribute()
    {
        if (!auth()->check()) return false;
        
        // If the relation is loaded, use it to prevent extra queries
        if ($this->relationLoaded('bookmarks')) {
            return $this->bookmarks->contains(auth()->id());
        }
        
        return \Illuminate\Support\Facades\DB::table('library_bookmarks')
            ->where('library_item_id', $this->id)
            ->where('user_id', auth()->id())
            ->exists();
    }

    public function getAverageRatingAttribute()
    {
        if ($this->relationLoaded('ratings')) {
            return round($this->ratings->avg('pivot.rating') ?? 0, 1);
        }

        return round(\Illuminate\Support\Facades\DB::table('library_ratings')
            ->where('library_item_id', $this->id)
            ->avg('rating') ?? 0, 1);
    }

    public function getUserRatingAttribute()
    {
        if (!auth()->check()) return 0;
        
        if ($this->relationLoaded('ratings')) {
            $rating = $this->ratings->where('id', auth()->id())->first();
            return $rating ? $rating->pivot->rating : 0;
        }

        return \Illuminate\Support\Facades\DB::table('library_ratings')
            ->where('library_item_id', $this->id)
            ->where('user_id', auth()->id())
            ->value('rating') ?? 0;
    }
}
