<?php

namespace App\Http\Controllers;

use App\Models\Video;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        $user = auth()->user();
        if (! $user instanceof Authenticatable) {
            abort(403);
        }

        $search = $request->string('q')->trim()->value();
        $sort = $request->string('sort')->trim()->value();

        $projectsQuery = $user->projects()
            ->withCount('videos')
            ->with([
                'videos' => fn ($query) => $query->latest()->limit(1),
            ]);

        if ($search !== '') {
            $projectsQuery->where('name', 'like', "%{$search}%");
        }

        $projectsQuery->when(
            $sort === 'name',
            fn ($query) => $query->orderBy('name'),
            fn ($query) => $query->latest(),
        );

        $projects = $projectsQuery->get();

        $totalProjects = $projects->count();
        $totalVideos = (int) $projects->sum('videos_count');

        $projectIds = $projects->pluck('id')->all();
        $totalVideoBytes = $projectIds === []
            ? 0
            : (int) Video::query()->whereIn('project_id', $projectIds)->sum('size');

        $projectLimit = 10;
        $remainingProjects = max(0, $projectLimit - $totalProjects);
        $totalVideoBytesFormatted = self::formatBytes($totalVideoBytes);

        return view('dashboard', [
            'projects' => $projects,
            'search' => $search,
            'sort' => $sort,
            'totalProjects' => $totalProjects,
            'totalVideos' => $totalVideos,
            'totalVideoBytes' => $totalVideoBytes,
            'totalVideoBytesFormatted' => $totalVideoBytesFormatted,
            'projectLimit' => $projectLimit,
            'remainingProjects' => $remainingProjects,
        ]);
    }

    public static function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return "{$bytes} B";
        }

        $kb = $bytes / 1024;
        if ($kb < 1024) {
            return number_format($kb, 1).' KB';
        }

        $mb = $kb / 1024;
        if ($mb < 1024) {
            return number_format($mb, 1).' MB';
        }

        $gb = $mb / 1024;

        return number_format($gb, 1).' GB';
    }
}
