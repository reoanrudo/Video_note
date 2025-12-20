<?php

namespace App\Console\Commands;

use App\Models\Video;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ResizeVideoSnapshots extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:resize-video-snapshots';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '既存のスナップショット画像を150x100pxにリサイズする';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Resizing existing video snapshots to 150x100px...');

        $videos = Video::query()
            ->whereJsonLength('annotations->snapshots', '>', 0)
            ->cursor();

        $count = 0;

        foreach ($videos as $video) {
            $snapshots = $video->annotations['snapshots'] ?? [];

            foreach ($snapshots as $snapshot) {
                $url = $snapshot['url'] ?? null;

                if (! is_string($url) || $url === '') {
                    continue;
                }

                $path = $this->storagePathFromUrl($url);

                if ($path === null) {
                    $this->warn("Could not determine storage path from URL: {$url}");

                    continue;
                }

                if (! Storage::disk('public')->exists($path)) {
                    $this->warn("Snapshot file not found: {$path}");

                    continue;
                }

                $contents = Storage::disk('public')->get($path);

                $resized = $this->resizeTo150x100($contents);

                if ($resized === null) {
                    $this->warn("Failed to resize snapshot: {$path}");

                    continue;
                }

                Storage::disk('public')->put($path, $resized);
                $count++;
            }
        }

        $this->info("Resized {$count} snapshot images.");

        return Command::SUCCESS;
    }

    private function storagePathFromUrl(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);

        if (! is_string($path)) {
            return null;
        }

        $prefix = '/storage/';

        if (! str_starts_with($path, $prefix)) {
            return null;
        }

        return substr($path, strlen($prefix));
    }

    private function resizeTo150x100(string $contents): ?string
    {
        if (! function_exists('imagecreatefromstring')) {
            return null;
        }

        $imageResource = @imagecreatefromstring($contents);

        if ($imageResource === false) {
            return null;
        }

        $targetWidth = 150;
        $targetHeight = 100;

        $resized = imagecreatetruecolor($targetWidth, $targetHeight);

        imagealphablending($resized, false);
        imagesavealpha($resized, true);

        $sourceWidth = imagesx($imageResource);
        $sourceHeight = imagesy($imageResource);

        imagecopyresampled(
            $resized,
            $imageResource,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $sourceWidth,
            $sourceHeight
        );

        ob_start();
        imagepng($resized);
        $output = ob_get_clean();

        imagedestroy($imageResource);
        imagedestroy($resized);

        if (! is_string($output)) {
            return null;
        }

        return $output;
    }
}
