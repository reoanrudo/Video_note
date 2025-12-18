@php
    $isWorkingView = (! $readOnly && ($workingView ?? false)) || $selectedVideo instanceof \App\Models\Video;
@endphp

<x-dynamic-component :component="$isWorkingView ? 'layouts.fullscreen' : ($readOnly ? 'layouts.public' : 'layouts.app')" :title="$project->name">
    @if ($isWorkingView)
        @php
            $videoUrl = '';
            $initialAnnotations = ['drawings' => [], 'snapshots' => []];

            if ($selectedVideo instanceof \App\Models\Video) {
                $videoUrlParams = [
                    'project' => $project,
                    'video' => $selectedVideo,
                ];
                if ($readOnly) {
                    $videoUrlParams['share'] = $project->share_token;
                }

                $videoUrl = route('projects.videos.file', $videoUrlParams);
                $initialAnnotations = $selectedVideo->annotations ?? ['drawings' => [], 'snapshots' => []];
            }
        @endphp

        <h1 class="sr-only">{{ $project->name }}</h1>

	        <div
	            id="video-analysis"
	            class="h-screen w-screen"
	            data-video-src="{{ $videoUrl }}"
	            data-default-zoom="1"
	            data-zoom-base="2"
	            data-read-only="{{ $readOnly ? '1' : '0' }}"
	            data-project-name="{{ $project->name }}"
	            data-dashboard-url="{{ auth()->check() ? route('dashboard') : '' }}"
	            data-share-url="{{ $project->share_token ? route('projects.share', $project->share_token) : '' }}"
	            data-project-id="{{ $project->id }}"
	            data-video-id="{{ $selectedVideo?->id ?? '' }}"
	            data-share-token="{{ $readOnly ? $project->share_token : '' }}"
	            data-video-upload-url="{{ $readOnly ? '' : route('projects.videos.store', $project) }}"
	            data-save-url="{{ $readOnly || ! $selectedVideo ? '' : route('projects.videos.annotations.update', [$project, $selectedVideo]) }}"
	            data-snapshot-url="{{ $readOnly || ! $selectedVideo ? '' : route('projects.videos.snapshots.store', [$project, $selectedVideo]) }}"
	        ></div>

        <script id="video-analysis-initial" type="application/json">
            @json($initialAnnotations)
        </script>
    @else
        <div class="flex w-full flex-1 flex-col gap-6">
            <div class="flex flex-col gap-2">
                <flux:heading size="xl">{{ $project->name }}</flux:heading>
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p class="text-sm text-zinc-600 dark:text-zinc-300">
                        @if ($readOnly)
                            共有リンクで閲覧中（保存はできません）
                        @else
                            描画・スナップショットを保存できます
                        @endif
                    </p>

                    @if (! $readOnly)
                        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                            @if ($project->share_token)
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-zinc-600 dark:text-zinc-300">共有URL</span>
                                    <input
                                        class="w-[22rem] max-w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                        value="{{ route('projects.share', $project->share_token) }}"
                                        readonly
                                        onclick="this.select()"
                                    />
                                </div>
                            @endif

                            <form method="POST" action="{{ route('projects.share-token', $project) }}">
                                @csrf
                                <flux:button type="submit" size="sm" variant="outline">共有URLを再発行</flux:button>
                            </form>

                            <form
                                method="POST"
                                action="{{ route('projects.destroy', $project) }}"
                                onsubmit="return confirm('「{{ addslashes($project->name) }}」を削除します。動画・キーフレーム・描画も全て消えます。よろしいですか？')"
                            >
                                @csrf
                                @method('DELETE')
                                <flux:button type="submit" size="sm" variant="outline">削除</flux:button>
                            </form>
                        </div>
                    @endif
                </div>
            </div>

            <div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <div class="text-sm text-zinc-600 dark:text-zinc-300">
                    動画がまだありません。プロジェクトに動画をアップロードしてください。
                </div>
            </div>
        </div>
    @endif
</x-dynamic-component>
