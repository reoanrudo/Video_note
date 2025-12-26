<?php

use App\Models\Project;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can save tags with annotations', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create();

    $payload = [
        'annotations' => [
            'drawings' => [],
            'snapshots' => [],
            'tags' => [
                [
                    'id' => 'tag-1',
                    'time' => 12.5,
                    'name' => '重要プレイ',
                    'color' => '#ef4444',
                ],
                [
                    'id' => 'tag-2',
                    'time' => 45.2,
                    'name' => 'ゴールシーン',
                    'color' => '#22c55e',
                ],
            ],
        ],
    ];

    $this->actingAs($user)
        ->postJson(route('projects.videos.annotations.update', [$project, $video]), $payload)
        ->assertOk()
        ->assertJson(['ok' => true]);

    $video->refresh();
    expect($video->annotations['tags'])->toHaveCount(2)
        ->and($video->annotations['tags'][0]['name'])->toBe('重要プレイ')
        ->and($video->annotations['tags'][1]['time'])->toBe(45.2);
});

test('tags persist across video reload', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create([
        'annotations' => [
            'tags' => [
                ['id' => 'tag-1', 'time' => 10.0, 'name' => 'Test Tag', 'color' => '#ff0000'],
            ],
        ],
    ]);

    $response = $this->actingAs($user)
        ->get(route('projects.show', [$project, 'video' => $video->id]));

    $response->assertOk();
    // Verify the initial annotations include tags
    $this->assertStringContainsString('"tags"', $response->content());
});

test('user can update existing tags', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create([
        'annotations' => [
            'tags' => [
                ['id' => 'tag-1', 'time' => 10.0, 'name' => 'Old Name', 'color' => '#ff0000'],
            ],
        ],
    ]);

    $payload = [
        'annotations' => [
            'drawings' => [],
            'snapshots' => [],
            'tags' => [
                ['id' => 'tag-1', 'time' => 15.0, 'name' => 'New Name', 'color' => '#00ff00'],
            ],
        ],
    ];

    $this->actingAs($user)
        ->postJson(route('projects.videos.annotations.update', [$project, $video]), $payload)
        ->assertOk();

    $video->refresh();
    expect($video->annotations['tags'][0]['name'])->toBe('New Name')
        ->and($video->annotations['tags'][0]['time'])->toBe(15);
});

test('user can delete tags', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create([
        'annotations' => [
            'tags' => [
                ['id' => 'tag-1', 'time' => 10.0, 'name' => 'Tag 1', 'color' => '#ff0000'],
                ['id' => 'tag-2', 'time' => 20.0, 'name' => 'Tag 2', 'color' => '#00ff00'],
            ],
        ],
    ]);

    $payload = [
        'annotations' => [
            'drawings' => [],
            'snapshots' => [],
            'tags' => [
                ['id' => 'tag-1', 'time' => 10.0, 'name' => 'Tag 1', 'color' => '#ff0000'],
            ],
        ],
    ];

    $this->actingAs($user)
        ->postJson(route('projects.videos.annotations.update', [$project, $video]), $payload)
        ->assertOk();

    $video->refresh();
    expect($video->annotations['tags'])->toHaveCount(1)
        ->and($video->annotations['tags'][0]['id'])->toBe('tag-1');
});

test('tags array defaults to empty when not provided', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create();

    $payload = [
        'annotations' => [
            'drawings' => [],
            'snapshots' => [],
        ],
    ];

    $this->actingAs($user)
        ->postJson(route('projects.videos.annotations.update', [$project, $video]), $payload)
        ->assertOk();

    $video->refresh();
    expect($video->annotations['tags'] ?? [])->toBe([]);
});

test('user cannot update annotations of another users video', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $project = Project::factory()->for($user1)->create();
    $video = Video::factory()->for($project)->create();

    $payload = [
        'annotations' => [
            'drawings' => [],
            'snapshots' => [],
            'tags' => [
                ['id' => 'tag-1', 'time' => 10.0, 'name' => 'Unauthorized Tag', 'color' => '#ff0000'],
            ],
        ],
    ];

    $this->actingAs($user2)
        ->postJson(route('projects.videos.annotations.update', [$project, $video]), $payload)
        ->assertForbidden();
});
