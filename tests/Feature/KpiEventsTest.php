<?php

declare(strict_types=1);

use App\Models\KpiEvent;
use App\Models\User;

test('project creation is recorded as a kpi event', function () {
    $user = User::factory()->create();

    expect(KpiEvent::count())->toBe(0);

    $this->actingAs($user)->post(route('projects.store'), [
        'name' => 'Test Project',
    ]);

    expect(KpiEvent::count())->toBe(1);

    $event = KpiEvent::first();

    expect($event->event)->toBe('project_created');
    expect($event->user_id)->toBe($user->id);
    expect($event->project_id)->toBeInt();
    expect($event->occurred_at)->not()->toBeNull();
});

test('kpi events can be queried by date range for weekly aggregation', function () {
    $user = User::factory()->create();

    // 今週のプロジェクト作成
    $this->actingAs($user)->post(route('projects.store'), ['name' => 'P1']);
    $this->actingAs($user)->post(route('projects.store'), ['name' => 'P2']);

    // 先週のプロジェクト作成（シミュレーション）
    $project = $user->projects()->create(['name' => 'P3', 'share_token' => Str::random(64)]);
    KpiEvent::create([
        'event' => 'project_created',
        'user_id' => $user->id,
        'project_id' => $project->id,
        'occurred_at' => now()->subWeek(),
        'meta' => null,
    ]);

    // 今週のイベントを集計
    $startOfWeek = now()->startOfWeek();
    $endOfWeek = now()->endOfWeek();

    $thisWeekCount = KpiEvent::query()
        ->where('event', 'project_created')
        ->whereBetween('occurred_at', [$startOfWeek, $endOfWeek])
        ->count();

    expect($thisWeekCount)->toBe(2);

    // 全期間のイベント数
    $totalCount = KpiEvent::query()
        ->where('event', 'project_created')
        ->count();

    expect($totalCount)->toBe(3);
});
