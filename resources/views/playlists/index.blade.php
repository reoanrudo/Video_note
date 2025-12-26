<x-layouts.app :title="__('プレイリスト')">
    <div class="flex w-full flex-1 flex-col gap-8">
        {{-- Header --}}
        <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-sm">
            <div class="pointer-events-none absolute inset-0 opacity-80">
                <div
                    class="absolute -left-24 -top-28 size-96 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.50),transparent)] blur-2xl">
                </div>
                <div
                    class="absolute -right-28 -bottom-28 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.40),transparent)] blur-2xl">
                </div>
                <div
                    class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:56px_56px] opacity-15">
                </div>
            </div>

            <div class="relative flex flex-col gap-6 p-6 sm:p-8">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div class="flex flex-col gap-2">
                        <div class="text-xs font-semibold tracking-[0.18em] text-zinc-400">
                            PLAYLISTS
                        </div>
                        <flux:heading size="xl" class="text-white">
                            プレイリスト
                        </flux:heading>
                        <p class="max-w-2xl text-sm text-zinc-300">
                            複数の動画をまとめて連続再生できます。
                        </p>
                    </div>

                    <flux:button variant="primary" onclick="document.getElementById('create-playlist-form').classList.toggle('hidden')">
                        <flux:icon name="plus" class="size-5" />
                        新規プレイリスト
                    </flux:button>
                </div>
            </div>
        </section>

        {{-- Create Playlist Form --}}
        <div id="create-playlist-form" class="hidden">
            <div class="rounded-3xl border border-white/10 bg-zinc-950/60 p-5 shadow-sm backdrop-blur">
                <form method="POST" action="{{ route('playlists.store') }}" class="flex flex-col gap-4">
                    @csrf

                    <div>
                        <flux:input name="name" label="プレイリスト名" placeholder="例: オフェンス練習 2025-01"
                            value="{{ old('name') }}" required />
                        @error('name')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <flux:textarea name="description" label="説明（任意）" placeholder="このプレイリストについて..."
                            rows="3">{{ old('description') }}</flux:textarea>
                        @error('description')
                            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="flex gap-2">
                        <flux:button variant="primary" type="submit">作成</flux:button>
                        <flux:button type="button" variant="outline" onclick="document.getElementById('create-playlist-form').classList.add('hidden')">キャンセル</flux:button>
                    </div>
                </form>
            </div>
        </div>

        {{-- Playlist List --}}
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-5 shadow-sm backdrop-blur">
                <div class="flex flex-col gap-1">
                    <flux:heading size="sm" class="text-white">マイプレイリスト</flux:heading>
                    <p class="text-sm text-zinc-400">
                        {{ $playlists->count() }} 件のプレイリスト
                    </p>
                </div>
            </div>

            @forelse ($playlists as $playlist)
                @php
                    $firstItem = $playlist->items->first();
                    $thumbnail = null;
                    if ($firstItem?->video) {
                        $snapshots = $firstItem->video->annotations['snapshots'] ?? [];
                        if (!empty($snapshots)) {
                            $thumbnail = $snapshots[0]['url'] ?? null;
                        }
                    }
                @endphp

                <div
                    class="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-zinc-950/70">
                    <div
                        class="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                        <div
                            class="absolute -right-24 -top-28 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.28),transparent)] blur-2xl">
                        </div>
                        <div
                            class="absolute -left-28 -bottom-28 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.22),transparent)] blur-2xl">
                        </div>
                    </div>

                    {{-- Right: Thumbnail & Actions --}}
                    <div class="absolute right-3 top-3 z-10 flex items-start gap-2">
                        {{-- Thumbnail --}}
                        <div class="relative h-12 w-20 overflow-hidden rounded-md border border-white/10 bg-zinc-800 shadow-md">
                            @if ($thumbnail)
                                <img src="{{ $thumbnail }}" alt="" class="size-full object-cover" />
                            @elseif ($firstItem?->video)
                                <div class="flex size-full items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                                    <flux:icon name="video-camera" class="size-5 text-zinc-600" />
                                </div>
                            @else
                                <div class="flex size-full items-center justify-center bg-gradient-to-br from-indigo-900/30 to-purple-900/30">
                                    <svg class="size-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </div>
                            @endif
                            {{-- Video count badge --}}
                            @if ($playlist->items_count > 0)
                                <div class="absolute bottom-0.5 right-0.5 rounded-sm bg-black/80 px-1 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                                    {{ $playlist->items_count }}
                                </div>
                            @endif
                        </div>

                        {{-- Delete button --}}
                        <form method="POST" action="{{ route('playlists.destroy', $playlist) }}"
                            onsubmit="return confirm('「{{ addslashes($playlist->name) }}」を削除します。よろしいですか？')">
                            @csrf
                            @method('DELETE')

                            <button type="submit"
                                class="inline-flex items-center justify-center rounded-lg border border-white/10 bg-black/30 p-1.5 text-white/70 transition hover:border-white/20 hover:bg-black/40 hover:text-white"
                                title="プレイリストを削除">
                                <flux:icon name="trash" class="size-4" />
                            </button>
                        </form>
                    </div>

                    <a href="{{ route('playlists.show', $playlist) }}" class="relative block p-5" wire:navigate>
                        <div class="relative flex flex-col gap-3">
                            <div class="min-w-0">
                                <div class="truncate text-base font-semibold text-white">
                                    {{ $playlist->name }}
                                </div>
                                @if ($playlist->description)
                                    <div class="mt-1 line-clamp-2 text-sm text-zinc-400">
                                        {{ $playlist->description }}
                                    </div>
                                @endif
                                <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                                    <span class="text-zinc-400">
                                        {{ $playlist->items_count }} 個の動画
                                    </span>
                                    @if ($playlist->updated_at)
                                        <span class="text-zinc-500">•</span>
                                        <span class="text-zinc-400">
                                            更新 {{ $playlist->updated_at->diffForHumans() }}
                                        </span>
                                    @endif
                                </div>
                            </div>

                            <div class="flex items-center justify-between text-sm">
                                <span class="text-zinc-300">
                                    {{ $firstItem ? '再生する' : '動画を追加' }}
                                </span>
                                <span
                                    class="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white/80">
                                    →
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
            @empty
                <div
                    class="rounded-3xl border border-dashed border-white/15 bg-zinc-950/60 p-10 text-center shadow-sm backdrop-blur">
                    <div class="mx-auto flex max-w-md flex-col items-center gap-3">
                        <div class="rounded-2xl bg-white/5 p-3 text-white/80">
                            <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </div>
                        <div class="text-sm font-medium text-white">
                            まだプレイリストがありません
                        </div>
                        <div class="text-sm text-zinc-400">
                            上部のボタンから作成してください。
                        </div>
                    </div>
                </div>
            @endforelse
        </div>
    </div>
</x-layouts.app>
