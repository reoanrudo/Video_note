<x-layouts.app :title="__('Dashboard')">
    @php
        $progress = $projectLimit > 0 ? min(100, (int) round(($totalProjects / $projectLimit) * 100)) : 0;
        $mostRecentProject = $projects->first();
    @endphp

    <div class="flex w-full flex-1 flex-col gap-8">
        <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-sm">
            <div class="pointer-events-none absolute inset-0 opacity-80">
                <div class="absolute -left-24 -top-28 size-96 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.50),transparent)] blur-2xl"></div>
                <div class="absolute -right-28 -bottom-28 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.40),transparent)] blur-2xl"></div>
                <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:56px_56px] opacity-15"></div>
            </div>

            <div class="relative flex flex-col gap-6 p-6 sm:p-8">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div class="flex flex-col gap-2">
                        <div class="text-xs font-semibold tracking-[0.18em] text-zinc-400">
                            VIDEO NOTE
                        </div>
                        <flux:heading size="xl" class="text-white">
                            {{ auth()->user()?->name }}さん、今日も解析しましょう
                        </flux:heading>
                        <p class="max-w-2xl text-sm text-zinc-300">
                            動画に注釈・キーフレームを残して、いつでも続きを再開できます。
                        </p>
                    </div>

                    <div class="flex flex-col gap-3 sm:items-end">
                        <div class="flex items-center gap-3">
                            <div class="text-xs text-zinc-300">
                                プロジェクト上限: <span class="font-semibold text-white">{{ $projectLimit }}</span>
                            </div>
                            <div class="text-xs text-zinc-300">
                                残り <span class="font-semibold text-white">{{ $remainingProjects }}</span> 件
                            </div>
                        </div>

                        <div class="flex w-full items-center gap-3 sm:justify-end">
                            <div class="h-2 w-56 overflow-hidden rounded-full bg-white/10">
                                <div
                                    class="h-full rounded-full bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-300"
                                    style="width: {{ $progress }}%"
                                ></div>
                            </div>
                            <div class="text-xs text-zinc-400">
                                {{ $progress }}%
                            </div>
                        </div>

                        @if ($mostRecentProject)
                            <a
                                href="{{ route('projects.show', $mostRecentProject) }}"
                                class="group inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:border-white/25 hover:bg-white/10"
                                wire:navigate
                            >
                                <span class="text-white/90">最近のプロジェクトを開く</span>
                                <span class="text-white/60 transition group-hover:translate-x-0.5 group-hover:text-white/80">→</span>
                            </a>
                        @endif
                    </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-3">
                    <div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex flex-col gap-1">
                                <div class="text-xs font-semibold tracking-wide text-zinc-400">PROJECTS</div>
                                <div class="text-2xl font-semibold text-white">
                                    {{ $totalProjects }}
                                    <span class="text-sm font-medium text-zinc-400">/ {{ $projectLimit }}</span>
                                </div>
                            </div>
                            <div class="rounded-2xl bg-white/5 p-2 text-white/80">
                                <flux:icon name="layout-grid" class="size-5" />
                            </div>
                        </div>
                    </div>

                    <div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex flex-col gap-1">
                                <div class="text-xs font-semibold tracking-wide text-zinc-400">VIDEOS</div>
                                <div class="text-2xl font-semibold text-white">{{ $totalVideos }}</div>
                            </div>
                            <div class="rounded-2xl bg-white/5 p-2 text-white/80">
                                <flux:icon name="video-camera" class="size-5" />
                            </div>
                        </div>
                    </div>

                    <div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex flex-col gap-1">
                                <div class="text-xs font-semibold tracking-wide text-zinc-400">STORAGE</div>
                                <div class="text-2xl font-semibold text-white">{{ $totalVideoBytesFormatted }}</div>
                            </div>
                            <div class="rounded-2xl bg-white/5 p-2 text-white/80">
                                <flux:icon name="cloud-arrow-up" class="size-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-5 shadow-sm backdrop-blur">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div class="flex flex-col gap-1">
                            <flux:heading size="sm" class="text-white">プロジェクト</flux:heading>
                            <p class="text-sm text-zinc-400">
                                クリックで作業画面へ。検索・並び替えもここから。
                            </p>
                        </div>

                        <div class="text-xs text-zinc-400">
                            {{ $projects->count() }} 件
                        </div>
                    </div>

                    <form method="GET" action="{{ route('dashboard') }}" class="grid gap-3 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
                        <div>
                            <flux:input
                                name="q"
                                label="検索"
                                placeholder="例: 試合レビュー / 練習 / 2025"
                                value="{{ $search }}"
                            />
                        </div>

                        <div>
                            <label class="block text-xs text-zinc-400">並び替え</label>
                            <select
                                name="sort"
                                class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-cyan-400/20"
                            >
                                <option value="" @selected($sort === '')>新しい順</option>
                                <option value="name" @selected($sort === 'name')>名前順</option>
                            </select>
                        </div>

                        <div class="flex gap-2">
                            <flux:button variant="primary" type="submit">適用</flux:button>
                            <flux:button as="a" variant="outline" href="{{ route('dashboard') }}" wire:navigate>クリア</flux:button>
                        </div>
                    </form>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                    @forelse ($projects as $project)
                        @php
                            $latestVideoId = $project->videos->first()?->id;
                            $resumeUrl = $latestVideoId
                                ? route('projects.show', $project).'?video='.$latestVideoId
                                : route('projects.show', $project);
                        @endphp

                        <div class="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-zinc-950/70">
                            <div class="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                                <div class="absolute -right-24 -top-28 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.28),transparent)] blur-2xl"></div>
                                <div class="absolute -left-28 -bottom-28 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.22),transparent)] blur-2xl"></div>
                            </div>

                            <form
                                method="POST"
                                action="{{ route('projects.destroy', $project) }}"
                                class="absolute right-3 top-3 z-10"
                                onsubmit="return confirm('「{{ addslashes($project->name) }}」を削除します。動画・キーフレーム・描画も全て消えます。よろしいですか？')"
                            >
                                @csrf
                                @method('DELETE')

                                <button
                                    type="submit"
                                    class="inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/30 p-2 text-white/70 transition hover:border-white/20 hover:bg-black/40 hover:text-white"
                                    title="プロジェクトを削除"
                                >
                                    <flux:icon name="trash" class="size-4" />
                                </button>
                            </form>

                            <a href="{{ $resumeUrl }}" class="relative block p-5" wire:navigate>
                                <div class="relative flex flex-col gap-3">
                                    <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0">
                                        <div class="truncate text-base font-semibold text-white">
                                            {{ $project->name }}
                                        </div>
                                        <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                                                <span class="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                                    <flux:icon name="video-camera" class="size-4 text-white/70" />
                                                    動画 {{ $project->videos_count }}
                                                </span>
                                                <span class="text-zinc-400">
                                                    更新 {{ $project->updated_at?->diffForHumans() }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                    <div class="flex items-center justify-between text-sm">
                                        <span class="text-zinc-300">
                                            {{ $latestVideoId ? '続きから開く' : '開く' }}
                                        </span>
                                        <span class="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white/80">
                                            →
                                        </span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    @empty
                        <div class="rounded-3xl border border-dashed border-white/15 bg-zinc-950/60 p-10 text-center shadow-sm backdrop-blur sm:col-span-2">
                            <div class="mx-auto flex max-w-md flex-col items-center gap-3">
                                <div class="rounded-2xl bg-white/5 p-3 text-white/80">
                                    <flux:icon name="plus" class="size-6" />
                                </div>
                                <div class="text-sm font-medium text-white">
                                    まだプロジェクトがありません
                                </div>
                                <div class="text-sm text-zinc-400">
                                    右側のフォームから作成してください。
                                </div>
                            </div>
                        </div>
                    @endforelse
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <div id="create-project" class="rounded-3xl border border-white/10 bg-zinc-950/60 p-5 shadow-sm backdrop-blur">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex flex-col gap-1">
                            <flux:heading size="sm" class="text-white">新規プロジェクト</flux:heading>
                            <p class="text-sm text-zinc-400">
                                試合・練習・セッション単位で切ると、後から探しやすくなります。
                            </p>
                        </div>
                        <div class="rounded-2xl bg-white/5 p-2 text-white/80">
                            <flux:icon name="plus" class="size-5" />
                        </div>
                    </div>

                    <form method="POST" action="{{ route('projects.store') }}" class="mt-4 flex flex-col gap-4">
                        @csrf

                        <div>
                            <flux:input
                                name="name"
                                label="プロジェクト名"
                                placeholder="例: 2025-12-17 試合レビュー"
                                value="{{ old('name') }}"
                                required
                            />
                            @error('name')
                                <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                            @enderror
                        </div>

                        <flux:button variant="primary" type="submit" class="w-full">作成</flux:button>
                    </form>
                </div>

                <div class="rounded-3xl border border-white/10 bg-zinc-950/60 p-5 shadow-sm backdrop-blur">
                    <flux:heading size="sm" class="text-white">ショートカット</flux:heading>
                    <div class="mt-4 grid gap-2">
                        <a
                            href="{{ route('profile.edit') }}"
                            class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/10"
                            wire:navigate
                        >
                            <span class="inline-flex items-center gap-2">
                                <flux:icon name="cog" class="size-4 text-white/70" />
                                設定
                            </span>
                            <span class="text-white/50">→</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-layouts.app>
