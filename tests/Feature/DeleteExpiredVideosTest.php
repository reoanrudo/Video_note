<?php

declare(strict_types=1);

use App\Models\Project;
use App\Models\User;
use App\Models\Video;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

test('expired videos are deleted after 7 days', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    // 8日前の動画（削除対象）
    $expiredVideo = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/expired.mp4",
        'created_at' => now()->subDays(8),
    ]);
    Storage::disk('public')->put($expiredVideo->path, 'expired video content');

    // 5日前の動画（削除対象外）
    $recentVideo = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/recent.mp4",
        'created_at' => now()->subDays(5),
    ]);
    Storage::disk('public')->put($recentVideo->path, 'recent video content');

    Artisan::call('app:delete-expired-videos');

    // 8日前の動画は削除される
    expect(Video::query()->whereKey($expiredVideo->id)->exists())->toBeFalse();
    Storage::disk('public')->assertMissing($expiredVideo->path);

    // 5日前の動画は残る
    expect(Video::query()->whereKey($recentVideo->id)->exists())->toBeTrue();
    Storage::disk('public')->assertExists($recentVideo->path);
});

test('snapshots are deleted when video is expired', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    // 8日前の動画（削除対象）
    $expiredVideo = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/expired.mp4",
        'created_at' => now()->subDays(8),
        'annotations' => [
            'drawings' => [],
            'snapshots' => [
                [
                    'time' => 1.23,
                    'url' => '/storage/projects/1/snapshots/1/snap1.png',
                    'path' => "projects/{$project->id}/snapshots/{$project->id}/snap1.png",
                ],
                [
                    'time' => 2.34,
                    'url' => '/storage/projects/1/snapshots/1/snap2.png',
                    'path' => "projects/{$project->id}/snapshots/{$project->id}/snap2.png",
                ],
            ],
            'settings' => [],
        ],
    ]);

    Storage::disk('public')->put($expiredVideo->path, 'video');
    Storage::disk('public')->put("projects/{$project->id}/snapshots/{$project->id}/snap1.png", 'snapshot1');
    Storage::disk('public')->put("projects/{$project->id}/snapshots/{$project->id}/snap2.png", 'snapshot2');

    Artisan::call('app:delete-expired-videos');

    // 動画ファイルが削除される
    Storage::disk('public')->assertMissing($expiredVideo->path);

    // スナップショットが削除される
    Storage::disk('public')->assertMissing("projects/{$project->id}/snapshots/{$project->id}/snap1.png");
    Storage::disk('public')->assertMissing("projects/{$project->id}/snapshots/{$project->id}/snap2.png");

    // DBレコードが削除される
    expect(Video::query()->whereKey($expiredVideo->id)->exists())->toBeFalse();
});

test('snapshots without path are skipped during deletion', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    // 8日前の動画（削除対象）
    $expiredVideo = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/expired.mp4",
        'created_at' => now()->subDays(8),
        'annotations' => [
            'drawings' => [],
            'snapshots' => [
                [
                    'time' => 1.23,
                    'url' => '/storage/projects/1/snapshots/1/snap1.png',
                    // path が存在しない（古いデータ形式）
                ],
            ],
            'settings' => [],
        ],
    ]);

    Storage::disk('public')->put($expiredVideo->path, 'video');

    // コマンドがエラーなく実行される
    Artisan::call('app:delete-expired-videos');

    // 動画ファイルとDBレコードは削除される
    Storage::disk('public')->assertMissing($expiredVideo->path);
    expect(Video::query()->whereKey($expiredVideo->id)->exists())->toBeFalse();
});

test('multiple videos from different projects can be deleted', function () {
    Storage::fake('public');

    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $project1 = Project::factory()->for($user1)->create();
    $project2 = Project::factory()->for($user2)->create();

    // プロジェクト1の8日前の動画
    $video1 = Video::factory()->for($project1)->create([
        'path' => "projects/{$project1->id}/videos/v1.mp4",
        'created_at' => now()->subDays(8),
    ]);
    Storage::disk('public')->put($video1->path, 'video1');

    // プロジェクト2の8日前の動画
    $video2 = Video::factory()->for($project2)->create([
        'path' => "projects/{$project2->id}/videos/v2.mp4",
        'created_at' => now()->subDays(8),
    ]);
    Storage::disk('public')->put($video2->path, 'video2');

    Artisan::call('app:delete-expired-videos');

    // 両方とも削除される
    expect(Video::query()->whereKey($video1->id)->exists())->toBeFalse();
    expect(Video::query()->whereKey($video2->id)->exists())->toBeFalse();

    Storage::disk('public')->assertMissing($video1->path);
    Storage::disk('public')->assertMissing($video2->path);
});
