<?php

namespace App\Notifications;

use App\Models\Video;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class ExpiringVideoNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  Collection<int, Video>  $videos
     */
    public function __construct(
        private readonly Collection $videos,
        private readonly string $expireDate
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('動画がまもなく削除されます')
            ->greeting($notifiable->name.' さん')
            ->line('無料プランの保持期間7日を過ぎる動画があります。以下の動画は '.$this->expireDate.' に削除されます。');

        foreach ($this->videos as $video) {
            $message->line('- '.$video->original_name.' (作成: '.$video->created_at?->toDateString().')');
        }

        $message->line('必要であればバックアップや有料プランへの移行をご検討ください。');

        return $message;
    }
}
