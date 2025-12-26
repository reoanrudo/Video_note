<?php

use App\Models\Project;
use App\Models\User;
use App\Services\PlanService;
use Illuminate\Support\Facades\Storage;

test('free user can create up to 10 projects', function () {
    $user = User::factory()->create(['plan' => 'free']);

    // Create 10 projects
    for ($i = 0; $i < 10; $i++) {
        $response = $this->actingAs($user)->post(route('projects.store'), [
            'name' => "Project {$i}",
        ]);
        $response->assertRedirect();
    }

    // 11th project should fail
    $response = $this->actingAs($user)->post(route('projects.store'), [
        'name' => 'Project 11',
    ]);
    $response->assertRedirect();
    $response->assertSessionHasErrors(['name']);
});

test('pro user can create unlimited projects', function () {
    $user = User::factory()->create(['plan' => 'pro']);

    // Create more than 10 projects
    for ($i = 0; $i < 15; $i++) {
        $response = $this->actingAs($user)->post(route('projects.store'), [
            'name' => "Project {$i}",
        ]);
        $response->assertRedirect();
    }

    // Verify all projects were created
    expect($user->projects()->count())->toBe(15);
});

test('plan service returns correct limits for free user', function () {
    $service = app(PlanService::class);
    $user = User::factory()->create(['plan' => 'free']);

    expect($service->getMaxProjects($user))->toBe(10);
    expect($service->getMaxVideoSize($user))->toBe(512000); // 500MB in KB
    expect($service->getRetentionDays($user))->toBe(7);
    expect($service->canCreateProject($user))->toBeTrue();
});

test('plan service returns correct limits for pro user', function () {
    $service = app(PlanService::class);
    $user = User::factory()->create(['plan' => 'pro']);

    expect($service->getMaxProjects($user))->toBe(PHP_INT_MAX);
    expect($service->getMaxVideoSize($user))->toBe(2097152); // 2GB in KB
    expect($service->getRetentionDays($user))->toBe(PHP_INT_MAX);
    expect($service->canCreateProject($user))->toBeTrue();
});

test('delete expired videos skips pro users', function () {
    Storage::fake('public');

    $freeUser = User::factory()->create(['plan' => 'free']);
    $proUser = User::factory()->create(['plan' => 'pro']);

    // Create projects and videos with explicit old timestamps
    $eightDaysAgo = now()->subDays(8);
    $freeProject = Project::factory()->for($freeUser)->create([
        'created_at' => $eightDaysAgo,
        'updated_at' => $eightDaysAgo,
    ]);
    $proProject = Project::factory()->for($proUser)->create([
        'created_at' => $eightDaysAgo,
        'updated_at' => $eightDaysAgo,
    ]);

    // Create videos with explicit old timestamps (using DB::table to bypass model timestamps)
    $freeVideoId = \DB::table('videos')->insertGetId([
        'project_id' => $freeProject->id,
        'original_name' => 'test1.mp4',
        'path' => 'projects/test1/video.mp4',
        'mime_type' => 'video/mp4',
        'size' => 1000,
        'annotations' => null,
        'created_at' => $eightDaysAgo,
        'updated_at' => $eightDaysAgo,
    ]);

    $proVideoId = \DB::table('videos')->insertGetId([
        'project_id' => $proProject->id,
        'original_name' => 'test2.mp4',
        'path' => 'projects/test2/video.mp4',
        'mime_type' => 'video/mp4',
        'size' => 1000,
        'annotations' => null,
        'created_at' => $eightDaysAgo,
        'updated_at' => $eightDaysAgo,
    ]);

    // Create fake files
    Storage::disk('public')->put('projects/test1/video.mp4', 'content');
    Storage::disk('public')->put('projects/test2/video.mp4', 'content');

    // Run the command
    $this->artisan('app:delete-expired-videos');

    // Free user's video should be deleted
    expect(\DB::table('videos')->where('id', $freeVideoId)->first())->toBeNull();
    Storage::disk('public')->assertMissing('projects/test1/video.mp4');

    // Pro user's video should still exist
    expect(\DB::table('videos')->where('id', $proVideoId)->first())->not->toBeNull();
    Storage::disk('public')->assertExists('projects/test2/video.mp4');
});
