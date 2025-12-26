<?php

use App\Http\Controllers\Admin\KpiDashboardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\PlaylistShareController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectShareController;
use App\Http\Controllers\ProjectVideoController;
use App\Http\Controllers\ProjectVideoFileController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\SubscriptionController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Livewire\Volt\Volt;

Route::get('/', function () {
    return view('welcome');
})->name('home');

Route::get('share/{token}', [ProjectShareController::class, 'show'])->name('projects.share');
Route::get('share-playlist/{token}', [PlaylistShareController::class, 'show'])->name('playlists.share');

// Stripe webhook (no auth middleware)
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handleWebhook'])
    ->name('cashier.webhook')
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

Route::get('projects/{project}/videos/{video}/file', [ProjectVideoFileController::class, 'video'])
    ->name('projects.videos.file');
Route::get('projects/{project}/videos/{video}/snapshots/{filename}', [ProjectVideoFileController::class, 'snapshot'])
    ->name('projects.videos.snapshots.file');

Route::get('dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    // KPI Dashboard (admin only - add authorization later)
    Route::get('admin/kpi', [KpiDashboardController::class, 'index'])
        ->name('admin.kpi');

    // Subscription routes (API)
    Route::prefix('subscription')->group(function () {
        Route::get('/', [SubscriptionController::class, 'index'])->name('subscription.index');
        Route::post('/trial', [SubscriptionController::class, 'startTrial'])->name('subscription.trial');
        Route::post('/swap', [SubscriptionController::class, 'swapPlan'])->name('subscription.swap');
        Route::post('/cancel', [SubscriptionController::class, 'cancel'])->name('subscription.cancel');
        Route::post('/resume', [SubscriptionController::class, 'resume'])->name('subscription.resume');
    });

    Route::middleware(['verified'])->group(function () {
        Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
        Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
        Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
        Route::post('projects/{project}/share-token', [ProjectController::class, 'regenerateShareToken'])
            ->name('projects.share-token');

        // Playlist routes
        Route::prefix('playlists')->group(function () {
            Route::get('/', [PlaylistController::class, 'index'])->name('playlists.index');
            Route::post('/', [PlaylistController::class, 'store'])->name('playlists.store');
            Route::get('/{playlist}', [PlaylistController::class, 'show'])->name('playlists.show');
            Route::get('/{playlist}/edit', [PlaylistController::class, 'edit'])->name('playlists.edit');
            Route::put('/{playlist}', [PlaylistController::class, 'update'])->name('playlists.update');
            Route::delete('/{playlist}', [PlaylistController::class, 'destroy'])->name('playlists.destroy');
            Route::post('/{playlist}/share-token', [PlaylistController::class, 'regenerateShareToken'])
                ->name('playlists.share-token');
            Route::post('/{playlist}/items', [PlaylistController::class, 'addVideo'])
                ->name('playlists.items.store');
            Route::put('/{playlist}/items/{item}', [PlaylistController::class, 'updateItem'])
                ->name('playlists.items.update');
            Route::delete('/{playlist}/items/{item}', [PlaylistController::class, 'removeItem'])
                ->name('playlists.items.destroy');
            Route::post('/{playlist}/reorder', [PlaylistController::class, 'reorder'])
                ->name('playlists.reorder');
        });

        Route::post('projects/{project}/videos', [ProjectVideoController::class, 'store'])->name('projects.videos.store');
        Route::post('projects/{project}/videos/from-youtube', [ProjectVideoController::class, 'storeFromYouTube'])->name('projects.videos.from-youtube');
        Route::post('projects/{project}/videos/{video}/annotations', [ProjectVideoController::class, 'updateAnnotations'])
            ->name('projects.videos.annotations.update');
        Route::post('projects/{project}/videos/{video}/snapshots', [ProjectVideoController::class, 'storeSnapshot'])
            ->name('projects.videos.snapshots.store');

        Route::post('projects/{project}/videos/{video}/comparisons', [ProjectVideoController::class, 'createComparison'])
            ->name('projects.videos.comparisons.store');
        Route::patch('projects/{project}/videos/{video}/comparisons/{comparisonId}', [ProjectVideoController::class, 'updateComparison'])
            ->name('projects.videos.comparisons.update');
        Route::delete('projects/{project}/videos/{video}/comparisons/{comparisonId}', [ProjectVideoController::class, 'deleteComparison'])
            ->name('projects.videos.comparisons.destroy');
    });

    Route::redirect('settings', 'settings/profile');

    Volt::route('settings/profile', 'settings.profile')->name('profile.edit');
    Volt::route('settings/password', 'settings.password')->name('user-password.edit');
    Volt::route('settings/appearance', 'settings.appearance')->name('appearance.edit');
    Volt::route('settings/plan', 'settings.plan')->name('plan.edit');

    Volt::route('settings/two-factor', 'settings.two-factor')
        ->middleware(
            when(
                Features::canManageTwoFactorAuthentication()
                    && Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword'),
                ['password.confirm'],
                [],
            ),
        )
        ->name('two-factor.show');
});
