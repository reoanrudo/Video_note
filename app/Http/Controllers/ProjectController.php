<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Models\KpiEvent;
use App\Models\Project;
use App\Models\Video;
use App\Services\PlanService;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function __construct(
        private PlanService $planService
    ) {}

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $this->planService->canCreateProject($user)) {
            return back()
                ->withInput()
                ->withErrors([
                    'name' => $this->planService->getProjectLimitMessage($user),
                ]);
        }

        $project = $user->projects()->create([
            'name' => $request->validated('name'),
            'share_token' => Str::random(64),
            'share_expires_at' => now()->addDays(7),
        ]);

        // KPI計測用のイベントをDBへ記録
        KpiEvent::create([
            'event' => 'project_created',
            'user_id' => $user->id,
            'project_id' => $project->id,
            'occurred_at' => now(),
            'meta' => null,
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
            'share_expires_at' => now()->addDays(7),
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
