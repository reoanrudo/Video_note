<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectVideoRequest;
use App\Http\Requests\StoreVideoSnapshotRequest;
use App\Http\Requests\UpdateVideoAnnotationsRequest;
use App\Models\Project;
use App\Models\Video;
use App\Services\ComparisonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectVideoController extends Controller
{
    public function store(StoreProjectVideoRequest $request, Project $project): JsonResponse|RedirectResponse
    {
        $this->authorize('update', $project);

        $file = $request->validated('video');
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid()->toString().($extension !== '' ? ".{$extension}" : '');

        $path = $file->storeAs("projects/{$project->id}/videos", $filename, [
            'disk' => 'public',
        ]);

        $video = $project->videos()->create([
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'annotations' => [
                'drawings' => [],
                'snapshots' => [],
            ],
            'meta' => [],
        ]);

        $redirectUrl = route('projects.show', [$project, 'video' => $video->id]);

        if ($request->expectsJson()) {
            return response()->json([
                'ok' => true,
                'video_id' => $video->id,
                'video_url' => route('projects.videos.file', [
                    'project' => $project,
                    'video' => $video,
                ]),
                'save_url' => route('projects.videos.annotations.update', [$project, $video]),
                'snapshot_url' => route('projects.videos.snapshots.store', [$project, $video]),
                'annotations' => $video->annotations ?? [
                    'drawings' => [],
                    'snapshots' => [],
                ],
                'redirect_url' => $redirectUrl,
            ]);
        }

        return redirect()->to($redirectUrl);
    }

    public function updateAnnotations(
        UpdateVideoAnnotationsRequest $request,
        Project $project,
        Video $video
    ): JsonResponse {
        $this->authorize('update', $project);

        abort_unless($video->project_id === $project->id, 404);

        $video->forceFill([
            'annotations' => $request->validated('annotations'),
        ])->save();

        return response()->json([
            'ok' => true,
            'updated_at' => $video->updated_at?->toISOString(),
        ]);
    }

    public function storeSnapshot(
        StoreVideoSnapshotRequest $request,
        Project $project,
        Video $video
    ): JsonResponse {
        $this->authorize('update', $project);

        abort_unless($video->project_id === $project->id, 404);

        $image = $request->validated('image');

        $prefix = 'data:image/png;base64,';
        abort_unless(str_starts_with($image, $prefix), 422);

        $decoded = base64_decode(substr($image, strlen($prefix)), true);
        abort_if($decoded === false, 422);

        $filename = Str::uuid()->toString().'.png';
        $path = "projects/{$project->id}/snapshots/{$video->id}/{$filename}";

        $contents = $decoded;

        if (function_exists('imagecreatefromstring')) {
            $imageResource = @imagecreatefromstring($decoded);

            if ($imageResource !== false) {
                $targetWidth = 150;
                $targetHeight = 100;

                $resized = imagecreatetruecolor($targetWidth, $targetHeight);

                imagealphablending($resized, false);
                imagesavealpha($resized, true);

                $sourceWidth = imagesx($imageResource);
                $sourceHeight = imagesy($imageResource);

                imagecopyresampled(
                    $resized,
                    $imageResource,
                    0,
                    0,
                    0,
                    0,
                    $targetWidth,
                    $targetHeight,
                    $sourceWidth,
                    $sourceHeight
                );

                ob_start();
                imagepng($resized);
                $contents = (string) ob_get_clean();

                imagedestroy($imageResource);
                imagedestroy($resized);
            }
        }

        Storage::disk('public')->put($path, $contents);

        return response()->json([
            'ok' => true,
            'url' => route('projects.videos.snapshots.file', [
                'project' => $project,
                'video' => $video,
                'filename' => $filename,
            ]),
            'filename' => $filename,
            'path' => $path,
            'time' => $request->validated('time'),
        ]);
    }

    public function createComparison(
        Request $request,
        Project $project,
        Video $video,
        ComparisonService $comparisonService
    ): JsonResponse {
        $this->authorize('update', $project);

        abort_unless($video->project_id === $project->id, 404);

        $validated = $request->validate([
            'before_snapshot_index' => 'required|integer|min:0',
            'after_snapshot_index' => 'required|integer|min:0',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        // スナップショットインデックスからIDを生成（まだIDがない場合）
        $annotations = $video->annotations ?? [];
        $snapshots = $annotations['snapshots'] ?? [];

        // スナップショットにIDがない場合は追加
        $snapshots = collect($snapshots)->map(function ($snapshot, $index) {
            if (!isset($snapshot['id'])) {
                $snapshot['id'] = Str::uuid()->toString();
            }

            return $snapshot;
        })->toArray();

        // 更新されたsnapshotsを保存
        $annotations['snapshots'] = $snapshots;
        $video->update(['annotations' => $annotations]);

        // インデックスからIDを取得
        $beforeId = $snapshots[$validated['before_snapshot_index']]['id'] ?? null;
        $afterId = $snapshots[$validated['after_snapshot_index']]['id'] ?? null;

        if (!$beforeId || !$afterId) {
            return response()->json([
                'ok' => false,
                'error' => 'Invalid snapshot index',
            ], 422);
        }

        try {
            $comparison = $comparisonService->createComparison(
                $video,
                $beforeId,
                $afterId,
                $validated['title'] ?? '',
                $validated['description'] ?? ''
            );

            return response()->json([
                'ok' => true,
                'comparison' => $comparison,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'ok' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function updateComparison(
        Request $request,
        Project $project,
        Video $video,
        string $comparisonId,
        ComparisonService $comparisonService
    ): JsonResponse {
        $this->authorize('update', $project);

        abort_unless($video->project_id === $project->id, 404);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $updated = $comparisonService->updateComparison($video, $comparisonId, $validated);

        if (!$updated) {
            return response()->json([
                'ok' => false,
                'error' => 'Comparison not found',
            ], 404);
        }

        return response()->json([
            'ok' => true,
            'comparison' => $updated,
        ]);
    }

    public function deleteComparison(
        Project $project,
        Video $video,
        string $comparisonId,
        ComparisonService $comparisonService
    ): JsonResponse {
        $this->authorize('update', $project);

        abort_unless($video->project_id === $project->id, 404);

        $deleted = $comparisonService->deleteComparison($video, $comparisonId);

        if (!$deleted) {
            return response()->json([
                'ok' => false,
                'error' => 'Comparison not found',
            ], 404);
        }

        return response()->json([
            'ok' => true,
        ]);
    }
}
