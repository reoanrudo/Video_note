<?php

use App\Models\Project;
use App\Models\User;
use App\Models\Video;
use App\Services\ComparisonService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('comparison can be created for a video with snapshots', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
            ],
        ],
    ]);

    $service = app(ComparisonService::class);
    $comparison = $service->createComparison(
        $video,
        'snap-1',
        'snap-2',
        'フォーム改善',
        '肘の角度が改善されました'
    );

    expect($comparison)->toHaveKey('id')
        ->and($comparison['before_snapshot_id'])->toBe('snap-1')
        ->and($comparison['after_snapshot_id'])->toBe('snap-2')
        ->and($comparison['title'])->toBe('フォーム改善')
        ->and($comparison['description'])->toBe('肘の角度が改善されました');

    $video->refresh();
    expect($video->annotations['comparisons'])->toHaveCount(1);
});

test('comparison creation throws error for non-existent snapshots', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
            ],
        ],
    ]);

    $service = app(ComparisonService::class);

    expect(fn() => $service->createComparison($video, 'snap-1', 'nonexistent', 'Test', ''))
        ->toThrow(\InvalidArgumentException::class);
});

test('comparison can be deleted', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
            ],
        ],
    ]);

    $service = app(ComparisonService::class);
    $comparison = $service->createComparison($video, 'snap-1', 'snap-2', 'Test', '');

    $deleted = $service->deleteComparison($video, $comparison['id']);

    expect($deleted)->toBeTrue();

    $video->refresh();
    expect($video->annotations['comparisons'] ?? [])->toHaveCount(0);
});

test('deleting non-existent comparison returns false', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => ['snapshots' => []],
    ]);

    $service = app(ComparisonService::class);
    $deleted = $service->deleteComparison($video, 'nonexistent-id');

    expect($deleted)->toBeFalse();
});

test('user can create comparison via api', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['url' => '/snap1.png', 'time' => 10],
                ['url' => '/snap2.png', 'time' => 20],
            ],
        ],
    ]);

    $response = $this->actingAs($user)->postJson(
        route('projects.videos.comparisons.store', [$project, $video]),
        [
            'before_snapshot_index' => 0,
            'after_snapshot_index' => 1,
            'title' => 'テスト比較',
            'description' => 'これは説明です',
        ]
    );

    $response->assertOk()
        ->assertJson([
            'ok' => true,
        ]);

    $video->refresh();
    expect($video->annotations['comparisons'])->toHaveCount(1)
        ->and($video->annotations['comparisons'][0]['title'])->toBe('テスト比較');
});

test('snapshot ids are auto-generated when creating comparison', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['url' => '/snap1.png', 'time' => 10], // No ID
                ['url' => '/snap2.png', 'time' => 20], // No ID
            ],
        ],
    ]);

    $response = $this->actingAs($user)->postJson(
        route('projects.videos.comparisons.store', [$project, $video]),
        [
            'before_snapshot_index' => 0,
            'after_snapshot_index' => 1,
            'title' => 'Auto ID test',
        ]
    );

    $response->assertOk();

    $video->refresh();
    expect($video->annotations['snapshots'][0])->toHaveKey('id')
        ->and($video->annotations['snapshots'][1])->toHaveKey('id')
        ->and($video->annotations['comparisons'])->toHaveCount(1);
});

test('user can delete comparison via api', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
            ],
        ],
    ]);

    $service = app(ComparisonService::class);
    $comparison = $service->createComparison($video, 'snap-1', 'snap-2', 'Test', '');

    $response = $this->actingAs($user)->deleteJson(
        route('projects.videos.comparisons.destroy', [$project, $video, $comparison['id']])
    );

    $response->assertOk();

    $video->refresh();
    expect($video->annotations['comparisons'] ?? [])->toHaveCount(0);
});

test('get comparisons includes snapshot details', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10, 'memo' => 'Before'],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20, 'memo' => 'After'],
            ],
        ],
    ]);

    $service = app(ComparisonService::class);
    $service->createComparison($video, 'snap-1', 'snap-2', 'Test', 'Description');

    $comparisons = $service->getComparisons($video);

    expect($comparisons)->toHaveCount(1)
        ->and($comparisons[0])->toHaveKey('before_snapshot')
        ->and($comparisons[0])->toHaveKey('after_snapshot')
        ->and($comparisons[0]['before_snapshot']['memo'])->toBe('Before')
        ->and($comparisons[0]['after_snapshot']['memo'])->toBe('After');
});

test('comparison can be updated', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
            ],
        ],
    ]);

    $service = app(ComparisonService::class);
    $comparison = $service->createComparison($video, 'snap-1', 'snap-2', 'Original', 'Original desc');

    $updated = $service->updateComparison($video, $comparison['id'], [
        'title' => 'Updated Title',
        'description' => 'Updated description',
    ]);

    expect($updated['title'])->toBe('Updated Title')
        ->and($updated['description'])->toBe('Updated description');

    $video->refresh();
    expect($video->annotations['comparisons'][0]['title'])->toBe('Updated Title');
});
