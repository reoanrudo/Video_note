<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Video;
use Illuminate\Contracts\View\View;

class ProjectShareController extends Controller
{
    public function show(string $token): View
    {
        $project = Project::query()
            ->where('share_token', $token)
            ->firstOrFail();

        // 共有リンクの有効期限チェック
        if ($project->share_expires_at && $project->share_expires_at->isPast()) {
            abort(404, '共有リンクの期限が切れています。');
        }

        $project->load(['videos' => fn ($query) => $query->latest()]);

        $selectedVideoId = request()->integer('video');
        $selectedVideo = null;

        if ($selectedVideoId !== 0) {
            $selectedVideo = $project->videos->firstWhere('id', $selectedVideoId);
        }

        if (! $selectedVideo instanceof Video) {
            $selectedVideo = $project->videos->first();
        }

        return view('projects.show', [
            'project' => $project,
            'videos' => $project->videos,
            'selectedVideo' => $selectedVideo,
            'readOnly' => true,
        ]);
    }
}
