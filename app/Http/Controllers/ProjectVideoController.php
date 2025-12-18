<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectVideoRequest;
use App\Http\Requests\StoreVideoSnapshotRequest;
use App\Http\Requests\UpdateVideoAnnotationsRequest;
use App\Models\Project;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
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

        Storage::disk('public')->put($path, $decoded);

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
}
