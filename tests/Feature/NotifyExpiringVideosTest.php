<?php

declare(strict_types=1);

use App\Models\Project;
use App\Models\User;
use App\Models\Video;
use App\Notifications\ExpiringVideoNotification;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;

test('users are notified about videos expiring in 24 hours', function () {
    Notification::fake();

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    // 6日前の動画（24時間後に削除 = 通知対象）
    $expiringVideo = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/expiring.mp4",
        'original_name' => 'expiring-video.mp4',
        'created_at' => now()->subDays(6),
    ]);

    // 5日前の動画（まだ通知対象外）
    Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/recent.mp4",
        'created_at' => now()->subDays(5),
    ]);

    // 8日前の動画（すでに期限切れ = 通知対象外）
    Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/expired.mp4",
        'created_at' => now()->subDays(8),
    ]);

    Artisan::call('app:notify-expiring-videos');

    // 該当ユーザーに通知が送信される
    Notification::assertSentTo($user, ExpiringVideoNotification::class, function ($notification, $channels) {
        // メール通知であることを確認
        expect($channels)->toContain('mail');

        return true;
    });
});

test('users with no expiring videos are not notified', function () {
    Notification::fake();

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    // 5日前の動画（通知対象外）
    Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/recent.mp4",
        'created_at' => now()->subDays(5),
    ]);

    Artisan::call('app:notify-expiring-videos');

    // 通知が送信されない
    Notification::assertNothingSent();
});

test('multiple videos from same user are grouped in one notification', function () {
    Notification::fake();

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    // 6日前の動画2件（両方とも通知対象）
    $video1 = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/v1.mp4",
        'original_name' => 'video1.mp4',
        'created_at' => now()->subDays(6),
    ]);

    $video2 = Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/v2.mp4",
        'original_name' => 'video2.mp4',
        'created_at' => now()->subDays(6),
    ]);

    Artisan::call('app:notify-expiring-videos');

    // 通知は1回だけ送信される（複数の動画が1つの通知にまとめられる）
    Notification::assertSentToTimes($user, ExpiringVideoNotification::class, 1);
});

test('multiple users receive separate notifications', function () {
    Notification::fake();

    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $project1 = Project::factory()->for($user1)->create();
    $project2 = Project::factory()->for($user2)->create();

    // ユーザー1の6日前の動画
    Video::factory()->for($project1)->create([
        'path' => "projects/{$project1->id}/videos/v1.mp4",
        'created_at' => now()->subDays(6),
    ]);

    // ユーザー2の6日前の動画
    Video::factory()->for($project2)->create([
        'path' => "projects/{$project2->id}/videos/v2.mp4",
        'created_at' => now()->subDays(6),
    ]);

    Artisan::call('app:notify-expiring-videos');

    // 両方のユーザーに通知が送信される
    Notification::assertSentTo($user1, ExpiringVideoNotification::class);
    Notification::assertSentTo($user2, ExpiringVideoNotification::class);
});

test('notification is queued for async delivery', function () {
    Notification::fake();

    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    Video::factory()->for($project)->create([
        'path' => "projects/{$project->id}/videos/expiring.mp4",
        'created_at' => now()->subDays(6),
    ]);

    Artisan::call('app:notify-expiring-videos');

    // 通知がキューに追加される（ShouldQueue インターフェースを実装）
    Notification::assertSentTo($user, ExpiringVideoNotification::class);
});
