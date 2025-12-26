<?php

namespace Database\Factories;

use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlaylistItemFactory extends Factory
{
    protected $model = PlaylistItem::class;

    public function definition(): array
    {
        return [
            'playlist_id' => Playlist::factory(),
            'video_id' => Video::factory(),
            'position' => fake()->numberBetween(1, 100),
            'start_time' => fake()->optional()->randomFloat(1, 0, 100),
            'end_time' => fake()->optional()->randomFloat(1, 100, 200),
        ];
    }

    /**
     * Set a specific position
     */
    public function withPosition(int $position): static
    {
        return $this->state(fn (array $attributes) => [
            'position' => $position,
        ]);
    }
}
