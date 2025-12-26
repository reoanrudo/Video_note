<?php

namespace App\Services;

use App\Models\User;

class PlanService
{
    // Plan constants
    public const PLAN_FREE = 'free';
    public const PLAN_TRIAL = 'trial';
    public const PLAN_BASIC = 'basic';
    public const PLAN_STANDARD = 'standard';
    public const PLAN_PRO = 'pro';

    /**
     * Check if user can create a new project.
     */
    public function canCreateProject(User $user): bool
    {
        $maxProjects = $this->getMaxProjects($user);

        return $user->projects()->count() < $maxProjects;
    }

    /**
     * Get maximum number of projects for user's plan.
     */
    public function getMaxProjects(User $user): int
    {
        $plan = $user->getEffectivePlanAttribute();

        return match ($plan) {
            self::PLAN_PRO => PHP_INT_MAX, // Unlimited
            self::PLAN_STANDARD => 50,
            self::PLAN_BASIC => 10,
            self::PLAN_TRIAL => 5,
            default => 5, // Free also 5 now
        };
    }

    /**
     * Check if user can upload a video of given size.
     */
    public function canUploadVideo(User $user, int $sizeInKb): bool
    {
        $maxSize = $this->getMaxVideoSize($user);

        return $sizeInKb <= $maxSize;
    }

    /**
     * Get maximum video size in KB for user's plan.
     */
    public function getMaxVideoSize(User $user): int
    {
        $plan = $user->getEffectivePlanAttribute();

        // 500MB = 512000 KB, 2GB = 2097152 KB
        return match ($plan) {
            self::PLAN_STANDARD, self::PLAN_PRO => 2097152, // 2GB
            default => 512000, // 500MB
        };
    }

    /**
     * Get human-readable limit message for projects.
     */
    public function getProjectLimitMessage(User $user): string
    {
        $plan = $user->getEffectivePlanAttribute();
        $max = $this->getMaxProjects($user);

        return match ($plan) {
            self::PLAN_PRO => 'Proプランのため、プロジェクト数の上限はありません。',
            self::PLAN_STANDARD => "Standardプランのため、プロジェクトを{$max}件まで作成できます。",
            self::PLAN_BASIC => "Basicプランのため、プロジェクトを{$max}件まで作成できます。",
            self::PLAN_TRIAL => "トライアル期間中はプロジェクトを{$max}件まで作成できます。",
            default => "無料ユーザーはプロジェクトを{$max}件まで作成できます。",
        };
    }

    /**
     * Get human-readable limit message for video size.
     */
    public function getVideoSizeLimitMessage(User $user): string
    {
        $plan = $user->getEffectivePlanAttribute();
        $maxMb = $this->getMaxVideoSize($user) / 1024;

        return match ($plan) {
            self::PLAN_STANDARD, self::PLAN_PRO => "{$maxMb}MBまでの動画をアップロードできます。",
            self::PLAN_BASIC => "{$maxMb}MBまでの動画をアップロードできます。",
            self::PLAN_TRIAL => "トライアル中は{$maxMb}MBまでの動画をアップロードできます。",
            default => "{$maxMb}MBまでの動画をアップロードできます。",
        };
    }

    /**
     * Get plan display name in Japanese.
     */
    public function getPlanDisplayName(string $plan): string
    {
        return match ($plan) {
            self::PLAN_PRO => 'Pro プラン',
            self::PLAN_STANDARD => 'Standard プラン',
            self::PLAN_BASIC => 'Basic プラン',
            self::PLAN_TRIAL => '無料トライアル',
            default => 'Free プラン',
        };
    }

    /**
     * Get plan pricing information.
     */
    public function getPlanPricing(): array
    {
        return [
            self::PLAN_FREE => [
                'name' => 'Free プラン',
                'price' => 0,
                'projects' => 5,
                'video_size' => '500MB',
            ],
            self::PLAN_TRIAL => [
                'name' => '無料トライアル',
                'price' => 0,
                'duration' => '7日間',
                'projects' => 5,
                'video_size' => '500MB',
                'after_trial' => 'Basic プラン (¥1,000/月)',
            ],
            self::PLAN_BASIC => [
                'name' => 'Basic プラン',
                'price' => 1000,
                'projects' => 10,
                'video_size' => '500MB',
            ],
            self::PLAN_STANDARD => [
                'name' => 'Standard プラン',
                'price' => 3000,
                'projects' => 50,
                'video_size' => '2GB',
            ],
            self::PLAN_PRO => [
                'name' => 'Pro プラン',
                'price' => 10000,
                'projects' => '無制限',
                'video_size' => '2GB',
            ],
        ];
    }
}
