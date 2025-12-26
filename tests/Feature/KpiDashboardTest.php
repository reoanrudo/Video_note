<?php

use App\Models\User;
use App\Services\KpiService;

use function Pest\Laravel\actingAs;

test('kpi dashboard is accessible to authenticated users', function () {
    $user = User::factory()->create();

    $response = actingAs($user)
        ->get(route('admin.kpi'))
        ->assertOk();
});

test('kpi dashboard redirects unauthenticated users', function () {
    $response = $this->get(route('admin.kpi'))
        ->assertRedirect(route('login'));
});

test('kpi service returns correct summary', function () {
    // Create some test users
    $freeUser = User::factory()->create(['plan' => 'free']);
    $proUser = User::factory()->create(['plan' => 'pro']);

    $service = app(KpiService::class);

    $summary = $service->getDashboardSummary();

    expect($summary)->toHaveKeys([
        'total_projects',
        'total_users',
        'active_users',
        'this_week_projects',
        'last_week_projects',
        'growth_rate',
        'users_by_plan',
        'weekly_project_creations',
    ]);

    // Verify user count
    expect($summary['total_users'])->toBeGreaterThanOrEqual(2);
    expect($summary['users_by_plan'])->toHaveKey('free');
    expect($summary['users_by_plan'])->toHaveKey('pro');
});

test('kpi service records events correctly', function () {
    $user = User::factory()->create();
    $service = app(KpiService::class);

    $event = $service->recordEvent(
        'test_event',
        $user->id,
        null,
        ['test_meta' => 'test_value']
    );

    expect($event->event)->toBe('test_event');
    expect($event->user_id)->toBe($user->id);
    expect($event->meta)->toBe(['test_meta' => 'test_value']);
});

test('weekly project creations returns correct format', function () {
    $service = app(KpiService::class);

    $weeklyData = $service->getWeeklyProjectCreations(12);

    expect($weeklyData)->toBeArray();
    foreach ($weeklyData as $week) {
        expect($week)->toHaveKeys(['week', 'count']);
    }
});
