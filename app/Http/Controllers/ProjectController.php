<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Models\Project;
use App\Models\Video;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->projects()->count() >= 10) {
            return back()
                ->withInput()
                ->withErrors([
                    'name' => '無料ユーザーはプロジェクトを10件まで作成できます。',
                ]);
        }

        $project = $user->projects()->create([
            'name' => $request->validated('name'),
            'share_token' => Str::random(64),
        ]);

        return redirect()->route('projects.show', [$project, 'work' => 1]);
    }

    public function show(Project $project): View
    {
        $this->authorize('view', $project);

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
            'workingView' => request()->boolean('work'),
            'readOnly' => false,
        ]);
    }

    public function regenerateShareToken(Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $project->forceFill([
            'share_token' => Str::random(64),
        ])->save();

        return redirect()->route('projects.show', $project);
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->authorize('delete', $project);

        Storage::disk('public')->deleteDirectory("projects/{$project->id}");

        $project->delete();

        return redirect()->route('dashboard');
    }
}
