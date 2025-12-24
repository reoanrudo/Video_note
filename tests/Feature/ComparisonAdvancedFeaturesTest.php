<?php

use App\Models\Project;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can add favorite to comparison via local state', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
            ],
            'comparisons' => [
                [
                    'id' => 'comp-1',
                    'before_snapshot_id' => 'snap-1',
                    'after_snapshot_id' => 'snap-2',
                    'title' => 'Test Comparison',
                    'favorite' => true,
                ],
            ],
        ],
    ]);

    expect($video->annotations['comparisons'][0]['favorite'])->toBeTrue();
});

test('user can add tags to comparison via local state', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
            ],
            'comparisons' => [
                [
                    'id' => 'comp-1',
                    'before_snapshot_id' => 'snap-1',
                    'after_snapshot_id' => 'snap-2',
                    'title' => 'Test Comparison',
                    'tags' => ['フォーム', '改善'],
                ],
            ],
        ],
    ]);

    expect($video->annotations['comparisons'][0]['tags'])
        ->toBeArray()
        ->toHaveCount(2)
        ->toContain('フォーム')
        ->toContain('改善');
});

test('comparison can have both favorite and tags', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
            ],
            'comparisons' => [
                [
                    'id' => 'comp-1',
                    'before_snapshot_id' => 'snap-1',
                    'after_snapshot_id' => 'snap-2',
                    'title' => 'Complete Comparison',
                    'description' => 'With all features',
                    'favorite' => true,
                    'tags' => ['重要', 'レビュー必要'],
                ],
            ],
        ],
    ]);

    $comparison = $video->annotations['comparisons'][0];
    expect($comparison['favorite'])->toBeTrue()
        ->and($comparison['tags'])->toHaveCount(2);
});

test('user can save comparisons with favorites and tags', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
            ],
            'comparisons' => [],
        ],
    ]);

    $response = $this->actingAs($user)->postJson(
        route('projects.videos.annotations.update', [$project, $video]),
        [
            'annotations' => [
                'snapshots' => [
                    ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                    ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
                ],
                'comparisons' => [
                    [
                        'id' => 'comp-1',
                        'before_snapshot_id' => 'snap-1',
                        'after_snapshot_id' => 'snap-2',
                        'title' => 'Favorited Comparison',
                        'favorite' => true,
                        'tags' => ['タグ1', 'タグ2'],
                    ],
                ],
            ],
        ]
    );

    $response->assertOk();

    $video->refresh();
    $comparison = $video->annotations['comparisons'][0];

    expect($comparison['favorite'])->toBeTrue()
        ->and($comparison['tags'])->toHaveCount(2)
        ->and($comparison['tags'][0])->toBe('タグ1')
        ->and($comparison['tags'][1])->toBe('タグ2');
});

test('multiple comparisons can have different favorite and tag states', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
                ['id' => 'snap-3', 'url' => '/snap3.png', 'time' => 30],
            ],
            'comparisons' => [
                [
                    'id' => 'comp-1',
                    'before_snapshot_id' => 'snap-1',
                    'after_snapshot_id' => 'snap-2',
                    'title' => 'First Comparison',
                    'favorite' => true,
                    'tags' => ['重要'],
                ],
                [
                    'id' => 'comp-2',
                    'before_snapshot_id' => 'snap-2',
                    'after_snapshot_id' => 'snap-3',
                    'title' => 'Second Comparison',
                    'favorite' => false,
                    'tags' => [],
                ],
                [
                    'id' => 'comp-3',
                    'before_snapshot_id' => 'snap-1',
                    'after_snapshot_id' => 'snap-3',
                    'title' => 'Third Comparison',
                    'favorite' => false,
                    'tags' => ['参考', 'テスト'],
                ],
            ],
        ],
    ]);

    $comparisons = $video->annotations['comparisons'];

    expect($comparisons[0]['favorite'])->toBeTrue()
        ->and($comparisons[1]['favorite'])->toBeFalse()
        ->and($comparisons[2]['favorite'])->toBeFalse()
        ->and($comparisons[0]['tags'])->toHaveCount(1)
        ->and($comparisons[1]['tags'])->toHaveCount(0)
        ->and($comparisons[2]['tags'])->toHaveCount(2);
});

test('comparison update preserves favorite and tags', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $video = Video::factory()->create([
        'project_id' => $project->id,
        'annotations' => [
            'snapshots' => [
                ['id' => 'snap-1', 'url' => '/snap1.png', 'time' => 10],
                ['id' => 'snap-2', 'url' => '/snap2.png', 'time' => 20],
            ],
            'comparisons' => [
                [
                    'id' => 'comp-1',
                    'before_snapshot_id' => 'snap-1',
                    'after_snapshot_id' => 'snap-2',
                    'title' => 'Original Title',
                    'description' => 'Original Description',
                    'favorite' => true,
                    'tags' => ['元のタグ'],
                ],
            ],
        ],
    ]);

    // ComparisonService を使って更新
    $service = app(\App\Services\ComparisonService::class);
    $updated = $service->updateComparison($video, 'comp-1', [
        'title' => 'Updated Title',
        'description' => 'Updated Description',
    ]);

    expect($updated['title'])->toBe('Updated Title')
        ->and($updated['description'])->toBe('Updated Description')
        ->and($updated['favorite'])->toBeTrue()
        ->and($updated['tags'])->toContain('元のタグ');
});
