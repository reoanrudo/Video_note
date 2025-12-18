<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProjectVideoFileController extends Controller
{
    public function video(Request $request, Project $project, Video $video): BinaryFileResponse
    {
        abort_unless($video->project_id === $project->id, 404);

        $this->authorizeAccess($request, $project);

        $absolutePath = Storage::disk('public')->path($video->path);
        abort_unless(is_file($absolutePath), 404);

        return response()->file($absolutePath, [
            'Content-Type' => $video->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="'.addslashes($video->original_name).'"',
        ]);
    }

    public function snapshot(Request $request, Project $project, Video $video, string $filename): BinaryFileResponse
    {
        abort_unless($video->project_id === $project->id, 404);

        $this->authorizeAccess($request, $project);

        abort_unless($filename !== '' && ! str_contains($filename, '/'), 404);

        $relativePath = "projects/{$project->id}/snapshots/{$video->id}/{$filename}";
        $absolutePath = Storage::disk('public')->path($relativePath);
        abort_unless(is_file($absolutePath), 404);

        return response()->file($absolutePath, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'inline; filename="'.addslashes($filename).'"',
        ]);
    }

    private function authorizeAccess(Request $request, Project $project): void
    {
        $share = $request->query('share');
        if (is_string($share) && $share !== '' && hash_equals((string) $project->share_token, $share)) {
            return;
        }

        $user = $request->user();
        abort_unless($user !== null && $user->can('view', $project), Response::HTTP_FORBIDDEN);
    }
}
