<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use Illuminate\Contracts\View\View;

class PlaylistShareController extends Controller
{
    public function show(string $token): View
    {
        $playlist = Playlist::query()
            ->where('share_token', $token)
            ->firstOrFail();

        $playlist->load(['items.video.project', 'user']);

        return view('playlists.show', [
            'playlist' => $playlist,
            'readOnly' => true,
        ]);
    }
}
