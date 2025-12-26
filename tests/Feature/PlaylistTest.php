<?php

use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\Project;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can create a playlist', function () {
    $user = User::factory()->create();

    $payload = [
        'name' => 'My Practice Playlist',
        'description' => 'Best plays from practice',
    ];

    $this->actingAs($user)
        ->post(route('playlists.store'), $payload)
        ->assertRedirect(route('playlists.show', Playlist::first()));

    $playlist = Playlist::where('user_id', $user->id)->first();
    expect($playlist)->not->toBeNull()
        ->and($playlist->name)->toBe('My Practice Playlist')
        ->and($playlist->description)->toBe('Best plays from practice')
        ->and($playlist->share_token)->not->toBeNull();
});

test('user can view their own playlists', function () {
    $user = User::factory()->create();
    $playlist = Playlist::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('playlists.index'))
        ->assertOk()
        ->assertSee($playlist->name);
});

test('user can view a single playlist', function () {
    $user = User::factory()->create();
    $playlist = Playlist::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('playlists.show', $playlist))
        ->assertOk()
        ->assertSee($playlist->name);
});

test('user can update their own playlist', function () {
    $user = User::factory()->create();
    $playlist = Playlist::factory()->for($user)->create([
        'name' => 'Old Name',
    ]);

    $payload = [
        'name' => 'Updated Name',
        'description' => 'Updated description',
    ];

    $this->actingAs($user)
        ->put(route('playlists.update', $playlist), $payload)
        ->assertRedirect(route('playlists.show', $playlist));

    $playlist->refresh();
    expect($playlist->name)->toBe('Updated Name')
        ->and($playlist->description)->toBe('Updated description');
});

test('user can delete their own playlist', function () {
    $user = User::factory()->create();
    $playlist = Playlist::factory()->for($user)->create();

    $this->actingAs($user)
        ->delete(route('playlists.destroy', $playlist))
        ->assertRedirect(route('playlists.index'));

    expect(Playlist::find($playlist->id))->toBeNull();
});

test('user can add video to playlist', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create();
    $playlist = Playlist::factory()->for($user)->create();

    $payload = [
        'video_id' => $video->id,
        'start_time' => 10.5,
        'end_time' => 30.0,
    ];

    $response = $this->actingAs($user)
        ->postJson(route('playlists.items.store', $playlist), $payload)
        ->assertOk()
        ->assertJson(['ok' => true]);

    $playlist->refresh();
    expect($playlist->items)->toHaveCount(1);

    $item = $playlist->items->first();
    expect($item->video_id)->toBe($video->id)
        ->and((string) $item->start_time)->toBe('10.50')
        ->and((string) $item->end_time)->toBe('30.00')
        ->and($item->position)->toBe(1);
});

test('playlist items are ordered by position', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video1 = Video::factory()->for($project)->create();
    $video2 = Video::factory()->for($project)->create();
    $video3 = Video::factory()->for($project)->create();
    $playlist = Playlist::factory()->for($user)->create();

    // Add videos in non-sequential order
    $this->actingAs($user)
        ->postJson(route('playlists.items.store', $playlist), ['video_id' => $video2->id]);
    $this->actingAs($user)
        ->postJson(route('playlists.items.store', $playlist), ['video_id' => $video1->id]);
    $this->actingAs($user)
        ->postJson(route('playlists.items.store', $playlist), ['video_id' => $video3->id]);

    $playlist->refresh();
    $items = $playlist->items->sortBy('position')->values();

    expect($items[0]->video_id)->toBe($video2->id)
        ->and($items[1]->video_id)->toBe($video1->id)
        ->and($items[2]->video_id)->toBe($video3->id);
});

test('user can reorder playlist items', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video1 = Video::factory()->for($project)->create();
    $video2 = Video::factory()->for($project)->create();
    $playlist = Playlist::factory()->for($user)->create();

    $item1 = PlaylistItem::factory()->for($playlist)->for($video1)->create(['position' => 1]);
    $item2 = PlaylistItem::factory()->for($playlist)->for($video2)->create(['position' => 2]);

    $orders = [
        ['id' => $item2->id, 'position' => 1],
        ['id' => $item1->id, 'position' => 2],
    ];

    $this->actingAs($user)
        ->postJson(route('playlists.reorder', $playlist), ['orders' => $orders])
        ->assertOk()
        ->assertJson(['ok' => true]);

    $item1->refresh();
    $item2->refresh();

    expect($item1->position)->toBe(2)
        ->and($item2->position)->toBe(1);
});

test('user can remove item from playlist', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create();
    $playlist = Playlist::factory()->for($user)->create();
    $item = PlaylistItem::factory()->for($playlist)->for($video)->create(['position' => 1]);

    $this->actingAs($user)
        ->deleteJson(route('playlists.items.destroy', [$playlist, $item]))
        ->assertOk()
        ->assertJson(['ok' => true]);

    $playlist->refresh();
    expect($playlist->items)->toHaveCount(0);
});

test('user cannot view another users playlist', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $playlist = Playlist::factory()->for($user1)->create();

    $this->actingAs($user2)
        ->get(route('playlists.show', $playlist))
        ->assertForbidden();
});

test('user cannot update another users playlist', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $playlist = Playlist::factory()->for($user1)->create();

    $payload = ['name' => 'Hacked Name'];

    $this->actingAs($user2)
        ->put(route('playlists.update', $playlist), $payload)
        ->assertForbidden();

    $playlist->refresh();
    expect($playlist->name)->not->toBe('Hacked Name');
});

test('user cannot delete another users playlist', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $playlist = Playlist::factory()->for($user1)->create();

    $this->actingAs($user2)
        ->delete(route('playlists.destroy', $playlist))
        ->assertForbidden();

    expect(Playlist::find($playlist->id))->not->toBeNull();
});

test('playlist items are deleted when playlist is deleted', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create();
    $playlist = Playlist::factory()->for($user)->create();
    $item = PlaylistItem::factory()->for($playlist)->for($video)->create();

    $itemId = $item->id;

    $this->actingAs($user)
        ->delete(route('playlists.destroy', $playlist))
        ->assertRedirect();

    expect(PlaylistItem::find($itemId))->toBeNull();
});

test('user can regenerate share token', function () {
    $user = User::factory()->create();
    $playlist = Playlist::factory()->for($user)->create();
    $oldToken = $playlist->share_token;

    $this->actingAs($user)
        ->post(route('playlists.share-token', $playlist))
        ->assertRedirect();

    $playlist->refresh();
    expect($playlist->share_token)->not->toBe($oldToken);
});

test('public can view playlist via share token', function () {
    $user = User::factory()->create();
    $playlist = Playlist::factory()->for($user)->create(['name' => 'Shared Playlist']);

    $this->get(route('playlists.share', $playlist->share_token))
        ->assertOk()
        ->assertSee('Shared Playlist');
});

test('share token returns 404 for invalid token', function () {
    $this->get(route('playlists.share', 'invalid-token-123'))
        ->assertNotFound();
});

test('user can add video without time range', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create();
    $playlist = Playlist::factory()->for($user)->create();

    $payload = [
        'video_id' => $video->id,
    ];

    $this->actingAs($user)
        ->postJson(route('playlists.items.store', $playlist), $payload)
        ->assertOk();

    $item = $playlist->items->first();
    expect($item->start_time)->toBeNull()
        ->and($item->end_time)->toBeNull();
});

test('user can update playlist item time range', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create();
    $playlist = Playlist::factory()->for($user)->create();
    $item = PlaylistItem::factory()->for($playlist)->for($video)->create([
        'start_time' => 0,
        'end_time' => null,
    ]);

    $payload = [
        'video_id' => $video->id,
        'start_time' => 15.0,
        'end_time' => 45.5,
    ];

    $this->actingAs($user)
        ->putJson(route('playlists.items.update', [$playlist, $item]), $payload)
        ->assertOk();

    $item->refresh();
    expect((string) $item->start_time)->toBe('15.00')
        ->and((string) $item->end_time)->toBe('45.50');
});

test('validation requires end time after start time', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();
    $video = Video::factory()->for($project)->create();
    $playlist = Playlist::factory()->for($user)->create();

    $payload = [
        'video_id' => $video->id,
        'start_time' => 50.0,
        'end_time' => 30.0,
    ];

    $this->actingAs($user)
        ->postJson(route('playlists.items.store', $playlist), $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['end_time']);
});
