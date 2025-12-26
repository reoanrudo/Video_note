<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Str;
use Livewire\Volt\Volt;

test('plan settings page can be rendered', function () {
    $user = User::factory()->create(['plan' => 'free']);

    $this->actingAs($user)
        ->get(route('plan.edit'))
        ->assertOk()
        ->assertSee('プラン')
        ->assertSee('Free プラン')
        ->assertSee('Pro プラン');
});

test('user can update their plan', function () {
    $user = User::factory()->create(['plan' => 'free']);

    expect($user->plan)->toBe('free');

    $this->actingAs($user);

    Volt::test('settings.plan')
        ->set('plan', 'pro')
        ->call('updatePlan');

    $user->refresh();
    expect($user->plan)->toBe('pro');
});

test('user can switch plan from pro to free', function () {
    $user = User::factory()->create(['plan' => 'pro']);

    expect($user->plan)->toBe('pro');

    $this->actingAs($user);

    Volt::test('settings.plan')
        ->set('plan', 'free')
        ->call('updatePlan');

    $user->refresh();
    expect($user->plan)->toBe('free');
});

test('plan defaults to free for new users', function () {
    $user = User::factory()->create();

    expect($user->plan)->toBe('free');
});

test('invalid plan is rejected', function () {
    $user = User::factory()->create(['plan' => 'free']);

    $this->actingAs($user);

    Volt::test('settings.plan')
        ->set('plan', 'invalid')
        ->call('updatePlan')
        ->assertHasErrors(['plan']);

    $user->refresh();
    expect($user->plan)->toBe('free');
});

test('plan selection changes project limit for pro users', function () {
    $user = User::factory()->create(['plan' => 'free']);

    // Free プランで10件作成
    $user->projects()->createMany(
        collect(range(1, 10))->map(function ($i) {
            return ['name' => "P{$i}", 'share_token' => Str::random(64)];
        })->toArray()
    );

    // Pro プランに変更
    $user->plan = 'pro';
    $user->save();

    // 11件目の作成は成功する（Proプランは無制限）
    $response = $this->actingAs($user)->post(route('projects.store'), [
        'name' => 'overflow',
    ]);

    $response->assertRedirect();
    expect($user->fresh()->projects()->count())->toBe(11);
});
