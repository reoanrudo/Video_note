<?php

namespace App\Console\Commands;

use App\Services\DataIntegrityService;
use Illuminate\Console\Command;

class CheckDataIntegrity extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:check-integrity {--fix : 自動修復を試みる}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'データ整合性を検証し、スナップショット削除契約の遵守を確認';

    /**
     * Execute the console command.
     */
    public function handle(DataIntegrityService $integrityService): int
    {
        $this->info('データ整合性チェックを開始します...');

        $startTime = now();
        $reports = $integrityService->dailyIntegrityCheck();

        if ($reports->isEmpty()) {
            $this->info('✓ すべてのデータが整合性チェックに合格しました！');
            $this->info("実行時間: {$startTime->diffInSeconds(now())}秒");

            return self::SUCCESS;
        }

        // 違反がある場合
        $this->warn("⚠ {$reports->count()}件の動画で整合性違反が検出されました");

        $totalViolations = 0;
        $violationTypes = [];

        foreach ($reports as $report) {
            $snapshotViolations = $report['snapshot_report']->getViolations();
            $videoViolations = $report['video_report']->getViolations();

            foreach (array_merge($snapshotViolations, $videoViolations) as $violation) {
                $totalViolations++;
                $violationTypes[$violation['type']] = ($violationTypes[$violation['type']] ?? 0) + 1;
            }
        }

        // サマリー表示
        $this->newLine();
        $this->table(
            ['違反タイプ', '件数'],
            collect($violationTypes)->map(fn ($count, $type) => [$type, $count])
        );

        $this->newLine();
        $this->warn("総違反数: {$totalViolations}");
        $this->info("実行時間: {$startTime->diffInSeconds(now())}秒");

        // 詳細ログは storage/logs に記録されています
        $this->info('詳細はログファイルを確認してください: storage/logs/laravel.log');

        if ($this->option('fix')) {
            $this->warn('自動修復機能は現在実装中です');
        }

        return self::FAILURE;
    }
}
