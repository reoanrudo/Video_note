<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 毎日深夜に無料ユーザー向けの通知と削除を実行
Schedule::command('app:notify-expiring-videos')->dailyAt('00:10');
Schedule::command('app:delete-expired-videos')->dailyAt('01:10');
