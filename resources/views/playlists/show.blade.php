@php
    $readOnly ??= false;
@endphp

<x-dynamic-component :component="$readOnly ? 'layouts.public' : 'layouts.app'" :title="$playlist->name">
    <div class="flex w-full flex-1 flex-col gap-6">
        {{-- Header --}}
        <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-sm">
                <flux:button as="a" href="{{ route('playlists.index') }}" size="sm" variant="ghost">
                    <flux:icon name="chevrons-up-down" class="size-4 rotate-90" />
                </flux:button>
                <span class="text-zinc-400">プレイリスト</span>
            </div>
            <flux:heading size="xl">{{ $playlist->name }}</flux:heading>
            @if ($playlist->description)
                <p class="text-sm text-zinc-600 dark:text-zinc-300">
                    {{ $playlist->description }}
                </p>
            @endif
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-zinc-600 dark:text-zinc-300">
                    {{ $playlist->items_count }} 個の動画
                </p>

                @if (!$readOnly)
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                        @if ($playlist->share_token)
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-zinc-600 dark:text-zinc-300">共有URL</span>
                                <input
                                    class="w-[22rem] max-w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                    value="{{ route('playlists.share', $playlist->share_token) }}"
                                    readonly
                                    onclick="this.select()"
                                />
                            </div>
                        @endif

                        <flux:button as="a" href="{{ route('playlists.edit', $playlist) }}" size="sm" variant="outline">編集</flux:button>
                        <flux:button as="a" href="{{ route('playlists.share-token', $playlist) }}" size="sm" variant="outline">共有URL再発行</flux:button>

                        <form
                            method="POST"
                            action="{{ route('playlists.destroy', $playlist) }}"
                            onsubmit="return confirm('「{{ addslashes($playlist->name) }}」を削除します。よろしいですか？')"
                        >
                            @csrf
                            @method('DELETE')
                            <flux:button type="submit" size="sm" variant="outline">削除</flux:button>
                        </form>
                    </div>
                @endif
            </div>
        </div>

        {{-- Playlist Items --}}
        <div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            @if ($playlist->items->isEmpty())
                <div class="text-center py-10">
                    <svg class="size-12 text-zinc-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <p class="text-sm text-zinc-600 dark:text-zinc-300">
                        動画がまだありません。
                    </p>
                    @if (!$readOnly)
                        <p class="text-sm text-zinc-400 mt-1">
                            編集画面から動画を追加してください。
                        </p>
                    @endif
                </div>
            @else
                <div class="space-y-3" id="playlist-items">
                    @foreach ($playlist->items->sortBy('position') as $item)
                        @php
                            $video = $item->video;
                            if (!$video) continue;
                            $snapshots = $video->annotations['snapshots'] ?? [];
                            $thumbnail = !empty($snapshots) ? ($snapshots[0]['url'] ?? null) : null;
                        @endphp

                        <div class="playlist-item group flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750"
                            data-item-id="{{ $item->id }}"
                            data-playlist-id="{{ $playlist->id }}"
                            data-video-id="{{ $video->id }}"
                            data-project-id="{{ $video->project->id }}"
                            data-start-time="{{ $item->start_time ?? 0 }}"
                            data-end-time="{{ $item->end_time ?? '' }}">
                            {{-- Thumbnail --}}
                            <a href="{{ route('projects.show', $video->project) }}?video={{ $video->id }}{{ $item->start_time ? '&t=' . number_format($item->start_time, 1) : '' }}"
                                class="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md border border-zinc-300 bg-zinc-700 dark:border-zinc-600">
                                @if ($thumbnail)
                                    <img src="{{ $thumbnail }}" alt="" class="size-full object-cover" />
                                @else
                                    <div class="flex size-full items-center justify-center">
                                        <flux:icon name="video-camera" class="size-6 text-zinc-500" />
                                    </div>
                                @endif
                                {{-- Play overlay --}}
                                <div class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                                    <div class="flex size-8 items-center justify-center rounded-full bg-white/90">
                                        <span class="text-zinc-900">▶</span>
                                    </div>
                                </div>
                            </a>

                            {{-- Info --}}
                            <div class="min-w-0 flex-1">
                                <a href="{{ route('projects.show', $video->project) }}?video={{ $video->id }}{{ $item->start_time ? '&t=' . number_format($item->start_time, 1) : '' }}"
                                    class="block">
                                    <div class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        {{ $video->project->name }}
                                    </div>
                                    <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                        <span>{{ $item->start_time ? number_format($item->start_time, 1) . 's' : '0s' }}</span>
                                        @if ($item->end_time)
                                            <span>〜 {{ number_format($item->end_time, 1) }}s</span>
                                        @endif
                                        @if ($item->start_time || $item->end_time)
                                            <span class="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-zinc-700">部分再生</span>
                                        @endif
                                    </div>
                                </a>
                            </div>

                            {{-- Position badge (only in edit mode) --}}
                            @if (!$readOnly)
                                <div class="text-xs text-zinc-400">
                                    #{{ $item->position }}
                                </div>
                            @endif
                        </div>
                    @endforeach
                </div>

                {{-- Play All Button --}}
                @if ($playlist->items->isNotEmpty() && !$readOnly)
                    <div class="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <flux:button variant="primary" class="w-full" onclick="window.location.href='{{ route('projects.show', $playlist->items->first()->video->project) }}?video={{ $playlist->items->first()->video_id }}{{ $playlist->items->first()->start_time ? '&t=' . number_format($playlist->items->first()->start_time, 1) : '' }}'">
                            最初から再生
                        </flux:button>
                    </div>
                @endif
            @endif
        </div>
    </div>
</x-dynamic-component>
