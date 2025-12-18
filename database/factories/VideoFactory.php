<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Video>
 */
class VideoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'original_name' => 'video.mp4',
            'path' => 'projects/1/videos/video.mp4',
            'mime_type' => 'video/mp4',
            'size' => 1024,
            'annotations' => [
                'drawings' => [],
                'snapshots' => [],
            ],
            'meta' => [],
        ];
    }
}
