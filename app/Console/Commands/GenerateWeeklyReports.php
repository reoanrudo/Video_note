<?php

namespace App\Console\Commands;

use App\Services\ParentReportGenerator;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateWeeklyReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:generate-weekly {--week-start= : 週の開始日 (Y-m-d形式、デフォルトは先週月曜日)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '週次保護者レポートを一括生成';

    /**
     * Execute the console command.
     */
    public function handle(ParentReportGenerator $generator): int
    {
        $this->info('週次保護者レポート生成を開始します...');

        // 週の開始日を決定（デフォルト: 先週の月曜日）
        $weekStart = $this->option('week-start')
            ? Carbon::parse($this->option('week-start'))->startOfWeek()
            : Carbon::now()->subWeek()->startOfWeek();

        $this->info("対象週: {$weekStart->format('Y/m/d')} - {$weekStart->copy()->endOfWeek()->format('Y/m/d')}");

        $startTime = now();

        // バッチ生成を実行
        $generatedCount = $generator->generateBatchReports($weekStart);

        $executionTime = $startTime->diffInSeconds(now());

        if ($generatedCount === 0) {
            $this->warn('生成されたレポートはありませんでした（アクティブなプロジェクトが見つかりません）');

            return self::SUCCESS;
        }

        $this->info("✓ {$generatedCount}件のレポートを生成しました");
        $this->info("実行時間: {$executionTime}秒");

        // 次のステップの案内
        $this->newLine();
        $this->comment('次のステップ:');
        $this->comment('1. 生成されたレポートを確認: php artisan tinker');
        $this->comment('   > ParentReport::latest()->first()');
        $this->comment('2. メール送信（実装予定）: php artisan reports:send-weekly');

        return self::SUCCESS;
    }
}
