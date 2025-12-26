<?php

namespace App\Http\Controllers;

use App\Services\PlanService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class SubscriptionController extends Controller
{
    public function __construct(
        private PlanService $planService
    ) {}

    /**
     * Get subscription details.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription('default');

        return response()->json([
            'plan' => $user->getEffectivePlanAttribute(),
            'on_trial' => $user->isOnTrial(),
            'trial_ends_at' => $user->trial_ends_at?->toIso8601String(),
            'subscribed' => $subscription?->active() ?? false,
            'subscription' => $subscription?->toArray(),
        ]);
    }

    /**
     * Start 7-day trial subscription.
     */
    public function startTrial(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if user already has a subscription or is on trial
        if ($user->subscribed('default') || $user->isOnTrial()) {
            return response()->json([
                'ok' => false,
                'error' => '既にサブスクリプションまたはトライアルを利用中です。',
            ], 422);
        }

        // For now, return a placeholder
        // In production, this would integrate with Stripe
        return response()->json([
            'ok' => false,
            'error' => 'Stripeの設定が必要です。ダッシュボードからAPIキーを設定してください。',
        ], 501);
    }

    /**
     * Swap to a different plan.
     */
    public function swapPlan(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription('default');

        if (!$subscription || !$subscription->active()) {
            return response()->json([
                'ok' => false,
                'error' => '有効なサブスクリプションがありません。',
            ], 422);
        }

        $request->validate([
            'plan' => 'required|in:basic,standard,pro',
        ]);

        // For now, return a placeholder
        return response()->json([
            'ok' => false,
            'error' => 'Stripeの設定が必要です。',
        ], 501);
    }

    /**
     * Cancel subscription.
     */
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription('default');

        if (!$subscription) {
            return response()->json([
                'ok' => false,
                'error' => 'サブスクリプションがありません。',
            ], 422);
        }

        $subscription->cancel();

        return response()->json([
            'ok' => true,
            'ends_at' => $subscription->ends_at->toIso8601String(),
        ]);
    }

    /**
     * Resume cancelled subscription.
     */
    public function resume(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription('default');

        if (!$subscription || !$subscription->onGracePeriod()) {
            return response()->json([
                'ok' => false,
                'error' => '再開可能なサブスクリプションがありません。',
            ], 422);
        }

        $subscription->resume();

        return response()->json(['ok' => true]);
    }
}
