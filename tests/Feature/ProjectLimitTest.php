<?php

declare(strict_types=1);

use App\Models\User;

test('user cannot create more than 10 projects on free tier', function () {
    $user = User::factory()->create();
    $user->projects()->createMany(
        collect(range(1, 10))->map(function ($i) {
            return ['name' => "P{$i}", 'share_token' => Str::random(64)];
        })->toArray()
    );

    $response = $this->actingAs($user)->post(route('projects.store'), [
        'name' => 'overflow',
    ]);

    $response->assertSessionHasErrors(['name']);
});
