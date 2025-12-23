<?php

declare(strict_types=1);

use App\Models\Project;
use App\Models\User;
use App\Models\Video;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

test('snapshot path is preserved through save and delete lifecycle', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/test.mp4",
        'annotations' => [
            'drawings' => [],
            'snapshots' => [],
            'settings' => [],
        ],
        'created_at' => now()->subDays(8), // 削除対象
    ]);

    Storage::disk('public')->put($video->path, 'video');

    // Step 1: スナップショットを保存
    $image = 'data:image/png;base64,'.base64_encode('snapshot');

    $response = $this->actingAs($user)->postJson(
        route('projects.videos.snapshots.store', [$project, $video]),
        [
            'image' => $image,
            'time' => 1.23,
        ]
    );

    $response->assertOk();
    $snapshotPath = $response->json('path');
    $snapshotUrl = $response->json('url');

    expect($snapshotPath)->toBeString();
    expect($snapshotUrl)->toBeString();

    Storage::disk('public')->assertExists($snapshotPath);

    // Step 2: 注釈を保存（スナップショットのpathを含める）
    $annotations = [
        'drawings' => [],
        'snapshots' => [
            [
                'time' => 1.23,
                'url' => $snapshotUrl,
                'path' => $snapshotPath, // 重要: path を保存
            ],
        ],
        'settings' => [],
    ];

    $saveResponse = $this->actingAs($user)->postJson(
        route('projects.videos.annotations.update', [$project, $video]),
        ['annotations' => $annotations]
    );

    $saveResponse->assertOk();

    // Step 3: DBに保存されたことを確認
    $video->refresh();
    expect($video->annotations['snapshots'][0]['path'])->toBe($snapshotPath);

    // Step 4: 削除コマンドを実行
    Artisan::call('app:delete-expired-videos');

    // Step 5: スナップショットファイルが削除されることを確認
    Storage::disk('public')->assertMissing($snapshotPath);

    // Step 6: 動画ファイルとDBレコードも削除される
    Storage::disk('public')->assertMissing($video->path);
    expect(Video::query()->whereKey($video->id)->exists())->toBeFalse();
});

test('multiple snapshots are all deleted when video expires', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/test.mp4",
        'annotations' => [
            'drawings' => [],
            'snapshots' => [],
            'settings' => [],
        ],
        'created_at' => now()->subDays(8), // 削除対象
    ]);

    Storage::disk('public')->put($video->path, 'video');

    $snapshotPaths = [];

    // 3つのスナップショットを保存
    for ($i = 1; $i <= 3; $i++) {
        $image = 'data:image/png;base64,'.base64_encode("snapshot{$i}");

        $response = $this->actingAs($user)->postJson(
            route('projects.videos.snapshots.store', [$project, $video]),
            [
                'image' => $image,
                'time' => $i * 1.0,
            ]
        );

        $response->assertOk();
        $snapshotPaths[] = [
            'time' => $i * 1.0,
            'url' => $response->json('url'),
            'path' => $response->json('path'),
        ];

        Storage::disk('public')->assertExists($response->json('path'));
    }

    // 注釈を保存
    $annotations = [
        'drawings' => [],
        'snapshots' => $snapshotPaths,
        'settings' => [],
    ];

    $this->actingAs($user)->postJson(
        route('projects.videos.annotations.update', [$project, $video]),
        ['annotations' => $annotations]
    );

    // 削除コマンドを実行
    Artisan::call('app:delete-expired-videos');

    // 全てのスナップショットが削除される
    foreach ($snapshotPaths as $snapshot) {
        Storage::disk('public')->assertMissing($snapshot['path']);
    }

    // 動画とDBレコードも削除される
    Storage::disk('public')->assertMissing($video->path);
    expect(Video::query()->whereKey($video->id)->exists())->toBeFalse();
});

test('snapshots without path in annotations are not deleted but video is still removed', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    // path を保存しない古い形式の注釈
    $video = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/test.mp4",
        'annotations' => [
            'drawings' => [],
            'snapshots' => [
                [
                    'time' => 1.23,
                    'url' => '/storage/snapshot.png',
                    // path フィールドが存在しない
                ],
            ],
            'settings' => [],
        ],
        'created_at' => now()->subDays(8), // 削除対象
    ]);

    Storage::disk('public')->put($video->path, 'video');

    // 削除コマンドを実行（エラーなく実行される）
    Artisan::call('app:delete-expired-videos');

    // 動画ファイルとDBレコードは削除される
    Storage::disk('public')->assertMissing($video->path);
    expect(Video::query()->whereKey($video->id)->exists())->toBeFalse();
});
