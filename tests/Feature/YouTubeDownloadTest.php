<?php

declare(strict_types=1);

use App\Models\Project;
use App\Models\User;
use App\Services\YouTubeDownloadService;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

test('youtube service can detect valid youtube urls', function () {
    $service = app(YouTubeDownloadService::class);

    expect($service->isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))->toBeTrue();
    expect($service->isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'))->toBeTrue();
    expect($service->isYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ'))->toBeTrue();
    expect($service->isYouTubeUrl('https://vimeo.com/123456'))->toBeFalse();
    expect($service->isYouTubeUrl('https://example.com'))->toBeFalse();
});

test('youtube service can extract video id from url', function () {
    $service = app(YouTubeDownloadService::class);

    expect($service->extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))->toBe('dQw4w9WgXcQ');
    expect($service->extractVideoId('https://youtu.be/dQw4w9WgXcQ'))->toBe('dQw4w9WgXcQ');
    expect($service->extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share'))->toBe('dQw4w9WgXcQ');
});

test('youtube service checks if yt-dlp is installed', function () {
    $service = app(YouTubeDownloadService::class);

    // This will be true in the Docker container, false in local testing without yt-dlp
    $isInstalled = $service->isYtDlpInstalled();

    // Just verify the method runs without error
    expect(is_bool($isInstalled))->toBeTrue();
});

test('user cannot download video with invalid youtube url', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    $this->actingAs($user)
        ->postJson(route('projects.videos.from-youtube', $project), [
            'url' => 'https://example.com/not-youtube',
        ])
        ->assertStatus(422)
        ->assertJson([
            'ok' => false,
            'error' => '有効なYouTube URLを入力してください。',
        ]);
});

test('user cannot download video with malformed url', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    $this->actingAs($user)
        ->postJson(route('projects.videos.from-youtube', $project), [
            'url' => 'not-a-url',
        ])
        ->assertStatus(422);
});

test('guest cannot download youtube video', function () {
    $project = Project::factory()->create();

    $this->postJson(route('projects.videos.from-youtube', $project), [
        'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ])
        ->assertStatus(401);
});

test('user cannot download video to another users project', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $project = Project::factory()->for($otherUser)->create();

    $this->actingAs($user)
        ->postJson(route('projects.videos.from-youtube', $project), [
            'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ])
        ->assertStatus(403);
});
