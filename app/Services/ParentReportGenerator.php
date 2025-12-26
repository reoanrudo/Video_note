<?php

namespace App\Services;

use App\Models\ParentReport;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ParentReportGenerator
{
    /**
     * 指定プロジェクトの週次レポートを生成
     */
    public function generateWeeklyReport(Project $project, Carbon $weekStart): ParentReport
    {
        $weekEnd = $weekStart->copy()->endOfWeek();

        // 既存レポートがあれば上書きせずに返す
        $existingReport = ParentReport::forWeek($project->user_id, $project->id, $weekStart->toDateString());
        if ($existingReport) {
            Log::info('Using existing weekly report', [
                'project_id' => $project->id,
                'week_start' => $weekStart->toDateString(),
            ]);

            return $existingReport;
        }

        // 週間活動データを分析
        $activityData = $this->analyzeWeeklyActivity($project, $weekStart, $weekEnd);

        // レポートデータ構造を作成
        $reportData = [
            'summary' => [
                'project_name' => $project->name,
                'week_range' => "{$weekStart->format('Y/m/d')} - {$weekEnd->format('Y/m/d')}",
                'total_videos' => $activityData['video_count'],
                'total_annotations' => $activityData['annotation_count'],
                'practice_days' => $activityData['practice_days'],
            ],
            'achievements' => $this->identifyAchievements($activityData),
            'improvements' => $this->identifyImprovements($activityData),
            'next_week_goals' => $this->suggestNextWeekGoals($activityData),
            'coach_comment' => '', // コーチが後で追加可能
        ];

        // ParentReportレコードを作成
        $report = ParentReport::create([
            'user_id' => $project->user_id,
            'project_id' => $project->id,
            'week_start' => $weekStart->toDateString(),
            'week_end' => $weekEnd->toDateString(),
            'parent_email' => null, // 後で設定
            'data' => $reportData,
        ]);

        Log::info('Generated weekly parent report', [
            'report_id' => $report->id,
            'project_id' => $project->id,
            'week_start' => $weekStart->toDateString(),
        ]);

        return $report;
    }

    /**
     * 週間活動を分析
     */
    protected function analyzeWeeklyActivity(Project $project, Carbon $weekStart, Carbon $weekEnd): array
    {
        $videos = $project->videos()
            ->whereBetween('created_at', [$weekStart, $weekEnd])
            ->get();

        $videoCount = $videos->count();
        $annotationCount = 0;
        $snapshotCount = 0;
        $practiceDays = [];

        foreach ($videos as $video) {
            $annotations = $video->annotations ?? [];

            // アノテーション数をカウント
            if (isset($annotations['annotations'])) {
                $annotationCount += count($annotations['annotations']);
            }

            // スナップショット数をカウント
            if (isset($annotations['snapshots'])) {
                $snapshotCount += count($annotations['snapshots']);
            }

            // 練習日を記録
            $practiceDay = $video->created_at->format('Y-m-d');
            if (! in_array($practiceDay, $practiceDays)) {
                $practiceDays[] = $practiceDay;
            }
        }

        return [
            'video_count' => $videoCount,
            'annotation_count' => $annotationCount,
            'snapshot_count' => $snapshotCount,
            'practice_days' => count($practiceDays),
            'avg_annotations_per_video' => $videoCount > 0 ? round($annotationCount / $videoCount, 1) : 0,
        ];
    }

    /**
     * 達成事項を特定
     */
    protected function identifyAchievements(array $activityData): array
    {
        $achievements = [];

        // 練習頻度の評価
        if ($activityData['practice_days'] >= 5) {
            $achievements[] = '週5日以上の継続的な練習を達成しました！';
        } elseif ($activityData['practice_days'] >= 3) {
            $achievements[] = '週3日以上の定期的な練習を継続しています';
        }

        // 動画撮影数の評価
        if ($activityData['video_count'] >= 10) {
            $achievements[] = "今週は{$activityData['video_count']}本の動画で熱心に取り組みました";
        }

        // 詳細な分析の評価
        if ($activityData['annotation_count'] >= 20) {
            $achievements[] = '細かい分析と改善点の記録を積極的に行っています';
        }

        // デフォルトメッセージ
        if (empty($achievements)) {
            $achievements[] = '今週も練習に取り組みました';
        }

        return $achievements;
    }

    /**
     * 改善点を特定
     */
    protected function identifyImprovements(array $activityData): array
    {
        $improvements = [];

        // 練習頻度の改善提案
        if ($activityData['practice_days'] < 3) {
            $improvements[] = [
                'area' => '練習頻度',
                'suggestion' => '週3日以上の定期的な練習を目標にしましょう',
            ];
        }

        // 分析の深さの改善提案
        if ($activityData['avg_annotations_per_video'] < 2) {
            $improvements[] = [
                'area' => '動画分析',
                'suggestion' => '各動画で2-3箇所以上のポイントを記録すると効果的です',
            ];
        }

        return $improvements;
    }

    /**
     * 来週の目標を提案
     */
    protected function suggestNextWeekGoals(array $activityData): array
    {
        $goals = [];

        // 練習頻度の目標
        $nextWeekPracticeDays = min($activityData['practice_days'] + 1, 7);
        $goals[] = "週{$nextWeekPracticeDays}日の練習を目指しましょう";

        // 分析の質の向上目標
        if ($activityData['avg_annotations_per_video'] < 3) {
            $goals[] = '各練習で重点的に改善したいポイントを3つ記録しましょう';
        }

        return $goals;
    }

    /**
     * 複数プロジェクトの一括レポート生成
     */
    public function generateBatchReports(Carbon $weekStart): int
    {
        $generatedCount = 0;

        // アクティブなプロジェクトを取得（過去30日以内に動画がある）
        $activeProjects = Project::whereHas('videos', function ($query) {
            $query->where('created_at', '>=', now()->subDays(30));
        })->with('user')->get();

        foreach ($activeProjects as $project) {
            try {
                $this->generateWeeklyReport($project, $weekStart);
                $generatedCount++;
            } catch (\Exception $e) {
                Log::error('Failed to generate weekly report', [
                    'project_id' => $project->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Batch report generation completed', [
            'generated_count' => $generatedCount,
            'week_start' => $weekStart->toDateString(),
        ]);

        return $generatedCount;
    }
}
