<?php

use App\Services\PlanService;
use Illuminate\Support\Facades\Auth;
use Livewire\Volt\Component;

new class extends Component {
    public string $plan = 'free';

    /**
     * Mount the component.
     */
    public function mount(): void
    {
        $this->plan = Auth::user()->getEffectivePlanAttribute();
    }

    /**
     * Update the plan for the currently authenticated user.
     * Note: This only changes the plan field. Stripe subscription is managed separately.
     */
    public function updatePlan(): void
    {
        $user = Auth::user();

        // Only allow free <-> pro switching without payment
        // For paid plans, use subscription flow
        $validated = $this->validate([
            'plan' => ['required', 'string', 'in:free,pro'],
        ]);

        $user->fill($validated);
        $user->save();

        $this->dispatch('plan-updated');
    }

    /**
     * Get the plan service instance.
     */
    public function getPlanServiceProperty(): PlanService
    {
        return app(PlanService::class);
    }

    /**
     * Get the current user subscription.
     */
    public function getSubscriptionProperty()
    {
        return Auth::user()->subscription('default');
    }

    /**
     * Get plan pricing information.
     */
    public function getPlanPricingProperty(): array
    {
        return app(PlanService::class)->getPlanPricing();
    }
}; ?>

<section class="w-full">
    @include('partials.settings-heading')

    <x-settings.layout :heading="__('プラン')" :subheading="__('利用プランを選択してください')">
        <div class="my-6 space-y-6">
            @if (Auth::user()->isOnTrial())
                <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
                        無料トライアル中
                    </p>
                    <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        トライアル終了: {{ Auth::user()->trial_ends_at?->format('Y年m月d日') }}
                    </p>
                    <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        トライアル終了後、Basic プラン (¥1,000/月) に自動的に切り替わります。
                    </p>
                </div>
            @endif

            @if ($subscription && $subscription->onGracePeriod())
                <div class="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                    <p class="text-sm text-yellow-800 dark:text-yellow-200">
                        サブスクリプションは {{ $subscription->ends_at->format('Y年m月d日') }} に終了します。
                    </p>
                </div>
            @endif

            <!-- Plan Grid -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                @foreach ($planService->getPlanPricing() as $planKey => $planInfo)
                    <div class="rounded-lg border @if ($plan === $planKey) border-blue-500 bg-blue-50 dark:bg-blue-900/20 @else border-gray-200 dark:border-gray-700 @endif p-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold">{{ $planInfo['name'] }}</h3>
                            @if ($planKey === \App\Services\PlanService::PLAN_TRIAL)
                                <span class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">7日間無料</span>
                            @endif
                        </div>

                        @if (isset($planInfo['price']))
                            <p class="mt-2 text-3xl font-bold">
                                @if ($planInfo['price'] === 0)
                                    ¥0
                                @else
                                    ¥{{ number_format($planInfo['price']) }}<span class="text-sm font-normal text-gray-500">/月</span>
                                @endif
                            </p>
                        @endif

                        @if (isset($planInfo['after_trial']))
                            <p class="mt-1 text-sm text-gray-500">{{ $planInfo['after_trial'] }}</p>
                        @endif

                        <ul class="mt-4 space-y-2 text-sm">
                            @if (isset($planInfo['projects']))
                                <li>プロジェクト: {{ $planInfo['projects'] === '無制限' ? '無制限' : $planInfo['projects'].'件' }}</li>
                            @endif
                            @if (isset($planInfo['video_size']))
                                <li>動画サイズ: {{ $planInfo['video_size'] }}</li>
                            @endif
                            @if (isset($planInfo['duration']))
                                <li>期間: {{ $planInfo['duration'] }}</li>
                            @endif
                        </ul>

                        @if ($plan === $planKey)
                            <flux:button class="mt-4 w-full" disabled>現在のプラン</flux:button>
                        @elseif ($planKey === \App\Services\PlanService::PLAN_TRIAL)
                            @if (!Auth::user()->subscribed('default'))
                                <flux:button class="mt-4 w-full" variant="primary">トライアル開始</flux:button>
                            @else
                                <flux:button class="mt-4 w-full" disabled>サブスクリプション中</flux:button>
                            @endif
                        @elseif (in_array($planKey, ['basic', 'standard', 'pro']))
                            <flux:button class="mt-4 w-full">変更する</flux:button>
                        @else
                            <flux:button class="mt-4 w-full" variant="ghost">選択</flux:button>
                        @endif
                    </div>
                @endforeach
            </div>

            <!-- Note about trial requiring card -->
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/20">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    <strong>トライアルについて:</strong> 無料トライアルを開始するにはクレジットカードの登録が必要です。
                    トライアル期間終了後、Basic プラン (¥1,000/月) が自動的に課金されます。
                    いつでもキャンセル可能です。
                </p>
            </div>
        </div>
    </x-settings.layout>
</section>
