<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectShareController;
use App\Http\Controllers\ProjectVideoController;
use App\Http\Controllers\ProjectVideoFileController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Livewire\Volt\Volt;

Route::get('/', function () {
    return view('welcome');
})->name('home');

Route::get('share/{token}', [ProjectShareController::class, 'show'])->name('projects.share');

Route::get('projects/{project}/videos/{video}/file', [ProjectVideoFileController::class, 'video'])
    ->name('projects.videos.file');
Route::get('projects/{project}/videos/{video}/snapshots/{filename}', [ProjectVideoFileController::class, 'snapshot'])
    ->name('projects.videos.snapshots.file');

Route::get('dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::middleware(['verified'])->group(function () {
        Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
        Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
        Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
        Route::post('projects/{project}/share-token', [ProjectController::class, 'regenerateShareToken'])
            ->name('projects.share-token');

        Route::post('projects/{project}/videos', [ProjectVideoController::class, 'store'])->name('projects.videos.store');
        Route::post('projects/{project}/videos/{video}/annotations', [ProjectVideoController::class, 'updateAnnotations'])
            ->name('projects.videos.annotations.update');
        Route::post('projects/{project}/videos/{video}/snapshots', [ProjectVideoController::class, 'storeSnapshot'])
            ->name('projects.videos.snapshots.store');
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
