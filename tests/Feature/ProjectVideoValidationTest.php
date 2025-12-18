<?php

declare(strict_types=1);

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\UploadedFile;

test('video upload fails when file exceeds 500mb', function () {
    $user = User::factory()->create();
    $project = Project::factory()->for($user)->create();

    // 501 MB dummy file (size is in KB for UploadedFile::fake)
    $file = UploadedFile::fake()->create('big.mp4', 501 * 1024, 'video/mp4');

    $response = $this->actingAs($user)->post(route('projects.videos.store', $project), [
        'video' => $file,
    ]);

    $response->assertSessionHasErrors(['video']);
});
