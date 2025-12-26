<?php

namespace App\Services;

use App\Models\Video;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DataIntegrityService
{
    /**
     * スナップショット削除契約の拡張版
     * Critical Contract: すべてのスナップショットはpathを保持しなければならない
     */
    public function ensureSnapshotIntegrity(Video $video): IntegrityReport
    {
        $snapshots = $video->annotations['snapshots'] ?? [];
        $report = new IntegrityReport;

        foreach ($snapshots as $index => $snapshot) {
            // Contract 1: path必須
            if (! isset($snapshot['path'])) {
                $report->addViolation('missing_path', $snapshot, [
                    'video_id' => $video->id,
                    'snapshot_index' => $index,
                    'snapshot_name' => $snapshot['name'] ?? 'unknown',
                ]);

                Log::warning('Snapshot missing path', [
                    'video_id' => $video->id,
                    'snapshot_index' => $index,
                    'snapshot' => $snapshot,
                ]);

                continue; // path無しは以降のチェックをスキップ
            }

            // Contract 2: ファイル実在性
            if (! Storage::disk('public')->exists($snapshot['path'])) {
                $report->addViolation('file_not_found', $snapshot, [
                    'video_id' => $video->id,
                    'path' => $snapshot['path'],
                ]);

                Log::error('Snapshot file not found', [
                    'video_id' => $video->id,
                    'path' => $snapshot['path'],
                ]);
            }

            // Contract 3: ファイルサイズチェック（異常な大きさ・ゼロバイト検知）
            $filePath = Storage::disk('public')->path($snapshot['path']);
            if (file_exists($filePath)) {
                $fileSize = filesize($filePath);

                if ($fileSize === 0) {
                    $report->addViolation('zero_byte_file', $snapshot, [
                        'video_id' => $video->id,
                        'path' => $snapshot['path'],
                    ]);
                } elseif ($fileSize > 10 * 1024 * 1024) { // 10MB超は異常
                    $report->addViolation('oversized_file', $snapshot, [
                        'video_id' => $video->id,
                        'path' => $snapshot['path'],
                        'size_mb' => round($fileSize / 1024 / 1024, 2),
                    ]);
                }
            }
        }

        return $report;
    }

    /**
     * 動画ファイルの整合性チェック
     */
    public function ensureVideoIntegrity(Video $video): IntegrityReport
    {
        $report = new IntegrityReport;

        // 動画ファイルの実在性
        if (! Storage::disk('public')->exists($video->path)) {
            $report->addViolation('video_file_not_found', null, [
                'video_id' => $video->id,
                'path' => $video->path,
            ]);

            Log::error('Video file not found', [
                'video_id' => $video->id,
                'path' => $video->path,
            ]);
        }

        // 動画ファイルサイズチェック
        $filePath = Storage::disk('public')->path($video->path);
        if (file_exists($filePath)) {
            $fileSize = filesize($filePath);

            if ($fileSize === 0) {
                $report->addViolation('video_zero_byte', null, [
                    'video_id' => $video->id,
                    'path' => $video->path,
                ]);
            } elseif ($fileSize > 500 * 1024 * 1024) { // 500MB超
                $report->addViolation('video_oversized', null, [
                    'video_id' => $video->id,
                    'path' => $video->path,
                    'size_mb' => round($fileSize / 1024 / 1024, 2),
                ]);
            }
        }

        return $report;
    }

    /**
     * 日次で全データ検証（スケジューラーから呼び出し）
     */
    public function dailyIntegrityCheck(): Collection
    {
        $allReports = collect();
        $violationCount = 0;

        Video::with('project')->chunk(100, function ($videos) use (&$allReports, &$violationCount) {
            foreach ($videos as $video) {
                // スナップショット整合性チェック
                $snapshotReport = $this->ensureSnapshotIntegrity($video);

                // 動画ファイル整合性チェック
                $videoReport = $this->ensureVideoIntegrity($video);

                if ($snapshotReport->hasViolations() || $videoReport->hasViolations()) {
                    $allReports->push([
                        'video_id' => $video->id,
                        'project_id' => $video->project_id,
                        'snapshot_report' => $snapshotReport,
                        'video_report' => $videoReport,
                    ]);

                    $violationCount += $snapshotReport->violationCount() + $videoReport->violationCount();
                }
            }
        });

        // サマリーログ
        Log::info('Daily integrity check completed', [
            'total_violations' => $violationCount,
            'affected_videos' => $allReports->count(),
        ]);

        // 重大な違反があればアラート（将来的にSlack通知等）
        if ($violationCount > 10) {
            Log::critical('High number of integrity violations detected', [
                'violation_count' => $violationCount,
            ]);
        }

        return $allReports;
    }
}

/**
 * 整合性レポートクラス
 */
class IntegrityReport
{
    private array $violations = [];

    public function addViolation(string $type, ?array $snapshot, array $context): void
    {
        $this->violations[] = [
            'type' => $type,
            'snapshot' => $snapshot,
            'context' => $context,
            'detected_at' => now(),
        ];
    }

    public function hasViolations(): bool
    {
        return count($this->violations) > 0;
    }

    public function violationCount(): int
    {
        return count($this->violations);
    }

    public function getViolations(): array
    {
        return $this->violations;
    }

    public function getViolationsByType(string $type): array
    {
        return array_filter($this->violations, fn ($v) => $v['type'] === $type);
    }
}
