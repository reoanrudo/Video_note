<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParentReport extends Model
{
    protected $fillable = [
        'user_id',
        'project_id',
        'week_start',
        'week_end',
        'parent_email',
        'data',
        'pdf_path',
        'sent_at',
    ];

    protected $casts = [
        'week_start' => 'date',
        'week_end' => 'date',
        'data' => 'array',
        'sent_at' => 'datetime',
    ];

    /**
     * コーチ（ユーザー）とのリレーション
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * プロジェクト（生徒）とのリレーション
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * レポートが送信済みかチェック
     */
    public function isSent(): bool
    {
        return $this->sent_at !== null;
    }

    /**
     * レポートを送信済みにマーク
     */
    public function markAsSent(): void
    {
        $this->update(['sent_at' => now()]);
    }

    /**
     * 特定の週のレポートを取得
     */
    public static function forWeek(int $userId, int $projectId, string $weekStart)
    {
        return static::where('user_id', $userId)
            ->where('project_id', $projectId)
            ->whereDate('week_start', $weekStart)
            ->first();
    }
}
