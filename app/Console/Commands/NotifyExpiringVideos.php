<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Video;
use App\Notifications\ExpiringVideoNotification;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class NotifyExpiringVideos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:notify-expiring-videos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '無料ユーザー向けに7日で削除される動画を事前通知する';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = CarbonImmutable::now();
        // 7日保持 → 期限24時間前に通知する
        $notifyThreshold = $now->subDays(6);
        $expireAt = $now->subDays(7);

        $videos = Video::query()
            ->where('created_at', '<=', $notifyThreshold)
            ->where('created_at', '>', $expireAt)
            ->with('project.user')
            ->get();

        $byUser = [];
        foreach ($videos as $video) {
            $owner = $video->project?->user;
            if (! $owner instanceof User) {
                continue;
            }

            $byUser[$owner->id]['user'] = $owner;
            $byUser[$owner->id]['videos'][] = $video;
        }

        foreach ($byUser as $data) {
            /** @var User $user */
            $user = $data['user'];
            $user->notify(new ExpiringVideoNotification(
                collect($data['videos']),
                $expireAt->toDateString()
            ));
        }

        $this->info('Notified '.count($byUser).' users about expiring videos.');

        return Command::SUCCESS;
    }
}
