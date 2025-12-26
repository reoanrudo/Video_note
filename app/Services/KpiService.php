<?php

namespace App\Services;

use App\Models\KpiEvent;
use App\Models\User;
use Carbon\Carbon;

class KpiService
{
    /**
     * 週あたりのプロジェクト作成数を取得
     *
     * @param  int  $weeks  取得する週数
     * @return array<int, array{week: string, count: int}>
     */
    public function getWeeklyProjectCreations(int $weeks = 12): array
    {
        $startDate = now()->subWeeks($weeks)->startOfWeek();

        $events = KpiEvent::query()
            ->where('event', 'project_created')
            ->where('occurred_at', '>=', $startDate)
            ->get();

        // Group by week in PHP (database agnostic)
        $grouped = [];
        foreach ($events as $event) {
            $date = Carbon::parse($event->occurred_at);
            $weekKey = $date->format('Y-o'); // ISO 8601 week number
            if (! isset($grouped[$weekKey])) {
                $grouped[$weekKey] = 0;
            }
            $grouped[$weekKey]++;
        }

        ksort($grouped);

        $result = [];
        foreach ($grouped as $week => $count) {
            $result[] = [
                'week' => $week,
                'count' => $count,
            ];
        }

        return $result;
    }

    /**
     * 総プロジェクト数を取得
     */
    public function getTotalProjects(): int
    {
        return KpiEvent::query()
            ->where('event', 'project_created')
            ->count();
    }

    /**
     * 総ユーザー数を取得
     */
    public function getTotalUsers(): int
    {
        return User::query()->count();
    }

    /**
     * アクティブユーザー数（過去7日以内にイベントのあるユーザー）を取得
     */
    public function getActiveUsers(int $days = 7): int
    {
        return KpiEvent::query()
            ->where('occurred_at', '>=', now()->subDays($days))
            ->distinct('user_id')
            ->count('user_id');
    }

    /**
     * 今週のプロジェクト作成数を取得
     */
    public function getThisWeekProjects(): int
    {
        return KpiEvent::query()
            ->where('event', 'project_created')
            ->where('occurred_at', '>=', now()->startOfWeek())
            ->count();
    }

    /**
     * 先週のプロジェクト作成数を取得
     */
    public function getLastWeekProjects(): int
    {
        return KpiEvent::query()
            ->where('event', 'project_created')
            ->where('occurred_at', '>=', now()->subWeek()->startOfWeek())
            ->where('occurred_at', '<', now()->startOfWeek())
            ->count();
    }

    /**
     * 週次の成長率を取得
     */
    public function getWeeklyGrowthRate(): float
    {
        $thisWeek = $this->getThisWeekProjects();
        $lastWeek = $this->getLastWeekProjects();

        if ($lastWeek === 0) {
            return $thisWeek > 0 ? 100.0 : 0.0;
        }

        return (($thisWeek - $lastWeek) / $lastWeek) * 100;
    }

    /**
     * プラン別のユーザー数を取得
     *
     * @return array<string, int>
     */
    public function getUsersByPlan(): array
    {
        $users = User::query()->get();

        $grouped = [];
        foreach ($users as $user) {
            $plan = $user->plan ?? 'free';
            if (! isset($grouped[$plan])) {
                $grouped[$plan] = 0;
            }
            $grouped[$plan]++;
        }

        return $grouped;
    }

    /**
     * ダッシュボード用のサマリーデータを取得
     */
    public function getDashboardSummary(): array
    {
        $thisWeekProjects = $this->getThisWeekProjects();
        $lastWeekProjects = $this->getLastWeekProjects();
        $growthRate = $this->getWeeklyGrowthRate();

        return [
            'total_projects' => $this->getTotalProjects(),
            'total_users' => $this->getTotalUsers(),
            'active_users' => $this->getActiveUsers(),
            'this_week_projects' => $thisWeekProjects,
            'last_week_projects' => $lastWeekProjects,
            'growth_rate' => $growthRate,
            'users_by_plan' => $this->getUsersByPlan(),
            'weekly_project_creations' => $this->getWeeklyProjectCreations(),
        ];
    }

    /**
     * イベントを記録
     */
    public function recordEvent(
        string $event,
        int $userId,
        ?int $projectId = null,
        ?array $meta = null
    ): KpiEvent {
        return KpiEvent::create([
            'event' => $event,
            'user_id' => $userId,
            'project_id' => $projectId,
            'occurred_at' => now(),
            'meta' => $meta,
        ]);
    }
}
