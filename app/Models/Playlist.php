<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Playlist extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'share_token',
    ];

    protected static function booted(): void
    {
        static::creating(function ($playlist) {
            if (empty($playlist->share_token)) {
                $playlist->share_token = Str::random(64);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PlaylistItem::class)->orderBy('position');
    }

    public function videos()
    {
        return $this->belongsToMany(Video::class, 'playlist_items')
            ->withPivot('position', 'start_time', 'end_time')
            ->orderBy('playlist_items.position');
    }
}
