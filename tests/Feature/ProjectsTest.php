<?php

declare(strict_types=1);

use App\Models\Project;
use App\Models\User;
use App\Models\Video;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('a user can create a project', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('projects.store'), [
        'name' => 'Test Project',
    ]);

    $project = Project::query()->where('name', 'Test Project')->firstOrFail();

    $response->assertRedirect(route('projects.show', [$project, 'work' => 1]));
    expect($project->user_id)->toBe($user->id);
    expect($project->share_token)->not()->toBeNull();

    $this->actingAs($user)
        ->get(route('projects.show', [$project, 'work' => 1]))
        ->assertOk()
        ->assertSee('id="video-analysis"', false)
        ->assertSee('data-default-zoom="1"', false)
        ->assertSee('data-zoom-base="2"', false);
});

test('a user cannot view another users project', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    $project = Project::factory()->for($owner)->create();

    $this->actingAs($other)
        ->get(route('projects.show', $project))
        ->assertForbidden();
});

test('a user can delete a project and its files', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    $video = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/test.mp4",
        'mime_type' => 'video/mp4',
        'original_name' => 'test.mp4',
    ]);

    Storage::disk('public')->put($video->path, 'video');
    Storage::disk('public')->put("projects/{$project->id}/snapshots/{$video->id}/frame.png", 'png');

    $this->actingAs($user)
        ->delete(route('projects.destroy', $project))
        ->assertRedirect(route('dashboard'));

    expect(Project::query()->whereKey($project->id)->exists())->toBeFalse();
    expect(Video::query()->whereKey($video->id)->exists())->toBeFalse();

    Storage::disk('public')->assertMissing($video->path);
    Storage::disk('public')->assertMissing("projects/{$project->id}/snapshots/{$video->id}/frame.png");
});

test('a user cannot delete another users project', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    $project = Project::factory()->for($owner)->create();

    $this->actingAs($other)
        ->delete(route('projects.destroy', $project))
        ->assertForbidden();
});

test('a share link shows the project page without authentication', function () {
    $project = Project::factory()->create([
        'name' => 'Shared Project',
    ]);

    $this->get(route('projects.share', $project->share_token))
        ->assertOk()
        ->assertSee('Shared Project');
});

test('a user can upload a video to a project', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    $file = UploadedFile::fake()->create('video.mp4', 100, 'video/mp4');

    $response = $this->actingAs($user)->post(route('projects.videos.store', $project), [
        'video' => $file,
    ]);

    $video = Video::query()->where('project_id', $project->id)->firstOrFail();

    $response->assertRedirect(route('projects.show', [$project, 'video' => $video->id]));
    Storage::disk('public')->assertExists($video->path);
});

test('a user can upload a video to a project via json', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    $file = UploadedFile::fake()->create('video.mp4', 100, 'video/mp4');

    $response = $this->actingAs($user)
        ->withHeaders(['Accept' => 'application/json'])
        ->post(route('projects.videos.store', $project), [
            'video' => $file,
        ]);

    $response
        ->assertOk()
        ->assertJson([
            'ok' => true,
        ]);

    $videoId = $response->json('video_id');
    $redirectUrl = $response->json('redirect_url');
    $videoUrl = $response->json('video_url');
    $saveUrl = $response->json('save_url');
    $snapshotUrl = $response->json('snapshot_url');

    expect($videoId)->toBeInt();
    expect($redirectUrl)->toBeString();
    expect($videoUrl)->toBeString();
    expect($saveUrl)->toBeString();
    expect($snapshotUrl)->toBeString();
});

test('a user can view a video file through the app route', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/test.mp4",
        'mime_type' => 'video/mp4',
        'original_name' => 'test.mp4',
    ]);

    Storage::disk('public')->put($video->path, 'video');

    $this->actingAs($user)
        ->get(route('projects.videos.file', [$project, $video]))
        ->assertOk();
});

test('a share link can view a video file through the app route', function () {
    Storage::fake('public');

    $project = Project::factory()->create();
    $video = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/test.mp4",
        'mime_type' => 'video/mp4',
        'original_name' => 'test.mp4',
    ]);

    Storage::disk('public')->put($video->path, 'video');

    $this->get(route('projects.videos.file', ['project' => $project, 'video' => $video, 'share' => $project->share_token]))
        ->assertOk();

    $this->get(route('projects.videos.file', [$project, $video]))
        ->assertForbidden();
});

test('a user can save annotations as json', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create([
        'annotations' => [
            'drawings' => [],
            'snapshots' => [],
            'settings' => [],
        ],
    ]);

    $payload = [
        'annotations' => [
            'drawings' => [
                [
                    'tool' => 'text',
                    'time' => 1.23,
                    'color' => '#ff0000',
                    'lineWidth' => 3,
                    'x' => 120,
                    'y' => 240,
                    'text' => 'Hello',
                ],
                [
                    'tool' => 'note',
                    'time' => 2.22,
                    'x' => 24,
                    'y' => 640,
                    'text' => '吹き出しノート',
                    'color' => '#ffffff',
                    'backgroundColor' => 'rgba(20,20,20,0.78)',
                    'borderColor' => 'rgba(255,255,255,0.38)',
                    'lineWidth' => 2,
                    'maxWidth' => 300,
                ],
            ],
            'snapshots' => [
                [
                    'time' => 2.34,
                    'url' => 'https://example.test/snapshot.png',
                    'memo' => 'メモ',
                ],
            ],
            'notes' => [
                [
                    'id' => 'note-1',
                    'time' => 2.22,
                    'x' => 0.12,
                    'y' => 0.34,
                    'text' => 'コートの外にメモを置く',
                    'maxWidth' => 320,
                ],
            ],
            'settings' => ['color' => '#ff0000', 'width' => 3, 'autoNumber' => 1],
        ],
    ];

    $this->actingAs($user)
        ->postJson(route('projects.videos.annotations.update', [$project, $video]), $payload)
        ->assertOk()
        ->assertJson(['ok' => true]);

    $video->refresh();
    expect($video->annotations['drawings'][0]['text'])->toBe('Hello');
    expect($video->annotations['drawings'][0]['tool'])->toBe('text');
    expect($video->annotations['notes'][0]['text'])->toBe('コートの外にメモを置く');
});

test('a user can store a video snapshot image', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create();

    $image = 'data:image/png;base64,'.base64_encode('snapshot');

    $response = $this->actingAs($user)->postJson(route('projects.videos.snapshots.store', [$project, $video]), [
        'image' => $image,
        'time' => 1.23,
    ]);

    $response->assertOk()->assertJson(['ok' => true]);

    $path = $response->json('path');
    expect($path)->toBeString();

    Storage::disk('public')->assertExists($path);
});
