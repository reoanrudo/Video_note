<?php

namespace App\Console\Commands;

use App\Models\Video;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DeleteExpiredVideos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:delete-expired-videos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '無料ユーザーの7日経過動画と付随データを削除する';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $expireAt = CarbonImmutable::now()->subDays(7);

        $videos = Video::query()
            ->where('created_at', '<=', $expireAt)
            ->with('project.user')
            ->get();

        $deletedFiles = 0;
        foreach ($videos as $video) {
            // delete snapshots if paths exist in annotations.snapshots
            $annotations = $video->annotations ?? [];
            $snapshots = $annotations['snapshots'] ?? [];
            foreach ($snapshots as $snapshot) {
                if (! isset($snapshot['path'])) {
                    continue;
                }
                if (Storage::disk('public')->exists($snapshot['path'])) {
                    Storage::disk('public')->delete($snapshot['path']);
                    $deletedFiles++;
                }
            }

            if (Storage::disk('public')->exists($video->path)) {
                Storage::disk('public')->delete($video->path);
                $deletedFiles++;
            }

            $video->delete();
        }

        $this->info('Deleted '.$videos->count().' videos and '.$deletedFiles.' files.');

        return Command::SUCCESS;
    }
}
