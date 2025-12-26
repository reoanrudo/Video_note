<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddVideoToPlaylistRequest;
use App\Http\Requests\ReorderPlaylistItemsRequest;
use App\Http\Requests\StorePlaylistRequest;
use App\Http\Requests\UpdatePlaylistRequest;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\Video;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;

class PlaylistController extends Controller
{
    public function index(): View
    {
        $this->authorize('viewAny', Playlist::class);

        $playlists = auth()->user()
            ->playlists()
            ->withCount('items')
            ->latest()
            ->get();

        return view('playlists.index', [
            'playlists' => $playlists,
        ]);
    }

    public function store(StorePlaylistRequest $request): RedirectResponse
    {
        $this->authorize('create', Playlist::class);

        $playlist = auth()->user()->playlists()->create([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'share_token' => Str::random(64),
        ]);

        return Redirect::route('playlists.show', $playlist)
            ->with('status', 'playlist-created');
    }

    public function show(Playlist $playlist): View
    {
        $this->authorize('view', $playlist);

        $playlist->load(['items.video.project', 'user']);

        return view('playlists.show', [
            'playlist' => $playlist,
        ]);
    }

    public function edit(Playlist $playlist): View
    {
        $this->authorize('update', $playlist);

        $playlist->load(['items.video.project']);

        return view('playlists.edit', [
            'playlist' => $playlist,
        ]);
    }

    public function update(UpdatePlaylistRequest $request, Playlist $playlist): RedirectResponse
    {
        $this->authorize('update', $playlist);

        $playlist->update($request->validated());

        return Redirect::route('playlists.show', $playlist)
            ->with('status', 'playlist-updated');
    }

    public function destroy(Playlist $playlist): RedirectResponse
    {
        $this->authorize('delete', $playlist);

        $playlist->delete();

        return Redirect::route('playlists.index')
            ->with('status', 'playlist-deleted');
    }

    public function regenerateShareToken(Playlist $playlist): RedirectResponse
    {
        $this->authorize('update', $playlist);

        $playlist->update(['share_token' => Str::random(64)]);

        return Redirect::route('playlists.show', $playlist)
            ->with('status', 'share-token-regenerated');
    }

    public function addVideo(
        AddVideoToPlaylistRequest $request,
        Playlist $playlist
    ): JsonResponse {
        $this->authorize('update', $playlist);

        $video = Video::findOrFail($request->validated('video_id'));

        // Verify user owns the video's project
        $this->authorize('view', $video->project);

        // Get next position
        $maxPosition = $playlist->items()->max('position') ?? 0;

        $item = $playlist->items()->create([
            'video_id' => $video->id,
            'position' => $maxPosition + 1,
            'start_time' => $request->validated('start_time'),
            'end_time' => $request->validated('end_time'),
        ]);

        return response()->json([
            'ok' => true,
            'item' => $item->load('video.project'),
        ]);
    }

    public function removeItem(Playlist $playlist, PlaylistItem $item): JsonResponse
    {
        $this->authorize('update', $playlist);

        abort_unless($item->playlist_id === $playlist->id, 404);

        $item->delete();

        // Reorder remaining items
        $playlist->items()->orderBy('position')->get()->each(function ($item, $index) {
            $item->update(['position' => $index + 1]);
        });

        return response()->json(['ok' => true]);
    }

    public function reorder(
        ReorderPlaylistItemsRequest $request,
        Playlist $playlist
    ): JsonResponse {
        $this->authorize('update', $playlist);

        $orders = $request->validated('orders'); // [['id' => 1, 'position' => 3], ...]

        foreach ($orders as $order) {
            $playlist->items()
                ->where('id', $order['id'])
                ->update(['position' => $order['position']]);
        }

        return response()->json(['ok' => true]);
    }

    public function updateItem(
        AddVideoToPlaylistRequest $request,
        Playlist $playlist,
        PlaylistItem $item
    ): JsonResponse {
        $this->authorize('update', $playlist);

        abort_unless($item->playlist_id === $playlist->id, 404);

        $item->update($request->validated());

        return response()->json([
            'ok' => true,
            'item' => $item->load('video.project'),
        ]);
    }
}
