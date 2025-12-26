<?php

namespace App\Services;

use App\Models\Video;
use Illuminate\Support\Str;

class ComparisonService
{
    /**
     * Before/After比較ペアを作成
     */
    public function createComparison(
        Video $video,
        string $beforeSnapshotId,
        string $afterSnapshotId,
        string $title = '',
        string $description = ''
    ): array {
        $annotations = $video->annotations ?? [];
        $comparisons = $annotations['comparisons'] ?? [];

        // スナップショットの存在を確認
        $snapshots = $annotations['snapshots'] ?? [];
        $beforeExists = collect($snapshots)->contains(fn ($s) => ($s['id'] ?? null) === $beforeSnapshotId);
        $afterExists = collect($snapshots)->contains(fn ($s) => ($s['id'] ?? null) === $afterSnapshotId);

        if (! $beforeExists || ! $afterExists) {
            throw new \InvalidArgumentException('Specified snapshots do not exist');
        }

        // 新しい比較を作成
        $comparison = [
            'id' => Str::uuid()->toString(),
            'before_snapshot_id' => $beforeSnapshotId,
            'after_snapshot_id' => $afterSnapshotId,
            'title' => $title ?: '改善前後の比較',
            'description' => $description,
            'created_at' => now()->toIso8601String(),
        ];

        $comparisons[] = $comparison;
        $annotations['comparisons'] = $comparisons;

        $video->update(['annotations' => $annotations]);

        return $comparison;
    }

    /**
     * 比較を削除
     */
    public function deleteComparison(Video $video, string $comparisonId): bool
    {
        $annotations = $video->annotations ?? [];
        $comparisons = $annotations['comparisons'] ?? [];

        $filteredComparisons = collect($comparisons)
            ->filter(fn ($c) => ($c['id'] ?? null) !== $comparisonId)
            ->values()
            ->toArray();

        if (count($filteredComparisons) === count($comparisons)) {
            return false; // 削除対象が見つからなかった
        }

        $annotations['comparisons'] = $filteredComparisons;
        $video->update(['annotations' => $annotations]);

        return true;
    }

    /**
     * 比較リストを取得
     */
    public function getComparisons(Video $video): array
    {
        $annotations = $video->annotations ?? [];
        $comparisons = $annotations['comparisons'] ?? [];
        $snapshots = $annotations['snapshots'] ?? [];

        // スナップショット情報を付加
        return collect($comparisons)->map(function ($comparison) use ($snapshots) {
            $beforeSnapshot = collect($snapshots)->firstWhere('id', $comparison['before_snapshot_id']);
            $afterSnapshot = collect($snapshots)->firstWhere('id', $comparison['after_snapshot_id']);

            return array_merge($comparison, [
                'before_snapshot' => $beforeSnapshot,
                'after_snapshot' => $afterSnapshot,
            ]);
        })->toArray();
    }

    /**
     * 比較を更新
     */
    public function updateComparison(
        Video $video,
        string $comparisonId,
        array $updates
    ): ?array {
        $annotations = $video->annotations ?? [];
        $comparisons = $annotations['comparisons'] ?? [];

        $updatedComparisons = collect($comparisons)->map(function ($comparison) use ($comparisonId, $updates) {
            if (($comparison['id'] ?? null) === $comparisonId) {
                return array_merge($comparison, array_filter($updates, fn ($key) => in_array($key, [
                    'title',
                    'description',
                ]), ARRAY_FILTER_USE_KEY));
            }

            return $comparison;
        })->toArray();

        $annotations['comparisons'] = $updatedComparisons;
        $video->update(['annotations' => $annotations]);

        return collect($updatedComparisons)->firstWhere('id', $comparisonId);
    }
}
