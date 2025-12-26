<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;

class StripeWebhookController extends CashierWebhookController
{
    /**
     * Handle invoice payment succeeded.
     */
    public function handleInvoicePaymentSucceeded($payload): void
    {
        // Log successful payment
        \Log::info('Invoice payment succeeded', ['payload' => $payload]);

        parent::handleInvoicePaymentSucceeded($payload);
    }

    /**
     * Handle invoice payment failed.
     */
    public function handleInvoicePaymentFailed($payload): void
    {
        // Log failed payment
        \Log::warning('Invoice payment failed', ['payload' => $payload]);

        // Get customer and send notification
        $customer = $payload['data']['object']['customer'] ?? null;

        if ($customer) {
            $user = \App\Models\User::where('stripe_id', $customer)->first();
            if ($user) {
                // Create notification class later
                // $user->notify(new \App\Notifications\PaymentFailedNotification());
            }
        }
    }

    /**
     * Handle customer subscription deleted.
     */
    public function handleCustomerSubscriptionDeleted($payload): void
    {
        // Update user's plan when subscription is fully deleted
        $subscription = $payload['data']['object'];
        $stripeId = $subscription['customer'] ?? null;

        if ($stripeId) {
            $user = \App\Models\User::where('stripe_id', $stripeId)->first();
            if ($user) {
                $user->update(['plan' => 'free']);
            }
        }

        parent::handleCustomerSubscriptionDeleted($payload);
    }
}
