<x-layouts.app :title="__('プレイリスト編集: ' . $playlist->name)">
    <div class="flex w-full flex-1 flex-col gap-6">
        {{-- Header --}}
        <div class="flex items-center gap-2 text-sm">
            <flux:button as="a" href="{{ route('playlists.index') }}" size="sm" variant="ghost">
                <flux:icon name="chevrons-up-down" class="size-4 rotate-90" />
            </flux:button>
            <flux:button as="a" href="{{ route('playlists.show', $playlist) }}" size="sm" variant="ghost">
                プレイリスト
            </flux:button>
            <span class="text-zinc-400">編集</span>
        </div>

        <flux:heading size="xl">{{ $playlist->name }} を編集</flux:heading>

        {{-- Edit Playlist Form --}}
        <div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <form method="POST" action="{{ route('playlists.update', $playlist) }}" class="flex flex-col gap-4">
                @csrf
                @method('PUT')

                <div>
                    <flux:input name="name" label="プレイリスト名" placeholder="例: オフェンス練習 2025-01"
                        value="{{ old('name', $playlist->name) }}" required />
                    @error('name')
                        <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                    @enderror
                </div>

                <div>
                    <flux:textarea name="description" label="説明（任意）" placeholder="このプレイリストについて..."
                        rows="3">{{ old('description', $playlist->description) }}</flux:textarea>
                    @error('description')
                        <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</p>
                    @enderror
                </div>

                <div class="flex gap-2">
                    <flux:button variant="primary" type="submit">保存</flux:button>
                    <flux:button as="a" variant="outline" href="{{ route('playlists.show', $playlist) }}">キャンセル</flux:button>
                </div>
            </form>
        </div>

        {{-- Add Video Section --}}
        <div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <flux:heading size="sm" class="mb-4">動画を追加</flux:heading>

            <div class="flex flex-col gap-4">
                {{-- Select Project --}}
                <div>
                    <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">プロジェクト</label>
                    <select id="project-select" class="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                        <option value="">プロジェクトを選択...</option>
                        @foreach(auth()->user()->projects()->with('videos')->latest()->get() as $project)
                            <option value="{{ $project->id }}" data-videos="{{ $project->videos->pluck('id')|json_encode }}">
                                {{ $project->name }} ({{ $project->videos->count() }} 個の動画)
                            </option>
                        @endforeach
                    </select>
                </div>

                {{-- Select Video --}}
                <div>
                    <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">動画</label>
                    <select id="video-select" class="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" disabled>
                        <option value="">先にプロジェクトを選択...</option>
                    </select>
                </div>

                {{-- Time Range (Optional) --}}
                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <flux:input id="start-time" name="start_time" label="開始時刻（秒）" placeholder="例: 15.5" step="0.1" min="0" />
                        <p class="mt-1 text-xs text-zinc-500">部分再生する場合に指定</p>
                    </div>
                    <div>
                        <flux:input id="end-time" name="end_time" label="終了時刻（秒）" placeholder="例: 30.0" step="0.1" min="0" />
                        <p class="mt-1 text-xs text-zinc-500">開始時刻より後にすること</p>
                    </div>
                </div>

                <flux:button id="add-video-btn" variant="primary" type="button" disabled>
                    <flux:icon name="plus" class="size-4" />
                    追加
                </flux:button>
            </div>
        </div>

        {{-- Playlist Items (Drag & Drop Reorder) --}}
        <div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <div class="flex items-center justify-between mb-4">
                <flux:heading size="sm">動画一覧</flux:heading>
                <span class="text-sm text-zinc-500">{{ $playlist->items->count() }} 個</span>
            </div>

            @if ($playlist->items->isEmpty())
                <div class="text-center py-10">
                    <svg class="size-12 text-zinc-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <p class="text-sm text-zinc-600 dark:text-zinc-300">
                        動画がまだありません。
                    </p>
                </div>
            @else
                <div class="space-y-3" id="playlist-items-edit">
                    @foreach ($playlist->items->sortBy('position') as $item)
                        @php
                            $video = $item->video;
                            if (!$video) continue;
                            $snapshots = $video->annotations['snapshots'] ?? [];
                            $thumbnail = !empty($snapshots) ? ($snapshots[0]['url'] ?? null) : null;
                        @endphp

                        <div class="playlist-item-edit group flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
                            data-item-id="{{ $item->id }}"
                            data-position="{{ $item->position }}">
                            {{-- Drag handle --}}
                            <div class="cursor-grab text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" title="ドラッグで並び替え">
                                <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                                </svg>
                            </div>

                            {{-- Position --}}
                            <div class="text-sm font-medium text-zinc-500 w-8">
                                #{{ $item->position }}
                            </div>

                            {{-- Thumbnail --}}
                            <a href="{{ route('projects.show', $video->project) }}?video={{ $video->id }}"
                                class="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border border-zinc-300 bg-zinc-700 dark:border-zinc-600">
                                @if ($thumbnail)
                                    <img src="{{ $thumbnail }}" alt="" class="size-full object-cover" />
                                @else
                                    <div class="flex size-full items-center justify-center">
                                        <flux:icon name="video-camera" class="size-5 text-zinc-500" />
                                    </div>
                                @endif
                            </a>

                            {{-- Info --}}
                            <div class="min-w-0 flex-1">
                                <div class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    {{ $video->project->name }}
                                </div>
                                <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                    @if ($item->start_time || $item->end_time)
                                        <span>{{ $item->start_time ? number_format($item->start_time, 1) . 's' : '0s' }}</span>
                                        @if ($item->end_time)
                                            <span>〜 {{ number_format($item->end_time, 1) }}s</span>
                                        @endif
                                        <span class="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-zinc-700">部分再生</span>
                                    @else
                                        <span>全動画</span>
                                    @endif
                                </div>
                            </div>

                            {{-- Remove button --}}
                            <button type="button"
                                class="remove-item-btn inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 dark:border-zinc-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                data-item-id="{{ $item->id }}"
                                title="削除">
                                <flux:icon name="trash" class="size-4" />
                            </button>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>

        {{-- Back button --}}
        <div class="flex gap-2">
            <flux:button as="a" variant="outline" href="{{ route('playlists.show', $playlist) }}">
                戻る
            </flux:button>
        </div>
    </div>

    @push('scripts')
        <script>
            const playlistId = {{ $playlist->id }};
            const projects = {{ auth()->user()->projects()->with('videos')->latest()->get()->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'videos' => $p->videos->map(fn($v) => ['id' => $v->id, 'project_id' => $v->project_id])]) }}};

            const projectSelect = document.getElementById('project-select');
            const videoSelect = document.getElementById('video-select');
            const addVideoBtn = document.getElementById('add-video-btn');
            const startTimeInput = document.getElementById('start-time');
            const endTimeInput = document.getElementById('end-time');
            const itemsContainer = document.getElementById('playlist-items-edit');

            // Populate videos when project is selected
            projectSelect.addEventListener('change', function() {
                const projectId = parseInt(this.value);
                const project = projects.find(p => p.id === projectId);

                videoSelect.innerHTML = '<option value="">動画を選択...</option>';
                if (project && project.videos.length > 0) {
                    project.videos.forEach(video => {
                        const option = document.createElement('option');
                        option.value = video.id;
                        option.textContent = `動画 #${video.id}`;
                        videoSelect.appendChild(option);
                    });
                    videoSelect.disabled = false;
                } else {
                    videoSelect.innerHTML = '<option value="">動画がありません</option>';
                    videoSelect.disabled = true;
                }
                updateAddButton();
            });

            // Enable add button when video is selected
            videoSelect.addEventListener('change', updateAddButton);

            function updateAddButton() {
                addVideoBtn.disabled = !videoSelect.value;
            }

            // Add video to playlist
            addVideoBtn.addEventListener('click', async function() {
                const videoId = parseInt(videoSelect.value);
                if (!videoId) return;

                const startTime = parseFloat(startTimeInput.value) || null;
                const endTime = parseFloat(endTimeInput.value) || null;

                const response = await fetch(`{{ route('playlists.items.store', $playlist) }}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    },
                    body: JSON.stringify({
                        video_id: videoId,
                        start_time: startTime,
                        end_time: endTime,
                    }),
                });

                if (response.ok) {
                    location.reload();
                } else {
                    const data = await response.json();
                    alert(data.message || '追加に失敗しました');
                }
            });

            // Remove item
            document.querySelectorAll('.remove-item-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const itemId = this.dataset.itemId;
                    if (!confirm('このアイテムを削除しますか？')) return;

                    const response = await fetch(`{{ route('playlists.items.destroy', [$playlist, '']) }}${itemId}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': '{{ csrf_token() }}',
                        },
                    });

                    if (response.ok) {
                        location.reload();
                    } else {
                        alert('削除に失敗しました');
                    }
                });
            });

            // Drag and drop reordering
            let draggedItem = null;

            itemsContainer.addEventListener('dragstart', function(e) {
                if (e.target.classList.contains('playlist-item-edit')) {
                    draggedItem = e.target;
                    e.target.style.opacity = '0.5';
                }
            });

            itemsContainer.addEventListener('dragend', function(e) {
                if (e.target.classList.contains('playlist-item-edit')) {
                    e.target.style.opacity = '1';
                    draggedItem = null;
                }
            });

            itemsContainer.addEventListener('dragover', function(e) {
                e.preventDefault();
                const target = e.target.closest('.playlist-item-edit');
                if (target && target !== draggedItem) {
                    const rect = target.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    if (e.clientY < midY) {
                        target.parentNode.insertBefore(draggedItem, target);
                    } else {
                        target.parentNode.insertBefore(draggedItem, target.nextSibling);
                    }
                }
            });

            // Save order on drop
            itemsContainer.addEventListener('drop', async function(e) {
                e.preventDefault();
                await saveOrder();
            });

            async function saveOrder() {
                const orders = [];
                document.querySelectorAll('.playlist-item-edit').forEach((item, index) => {
                    orders.push({
                        id: parseInt(item.dataset.itemId),
                        position: index + 1,
                    });
                });

                const response = await fetch(`{{ route('playlists.reorder', $playlist) }}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    },
                    body: JSON.stringify({ orders }),
                });

                if (!response.ok) {
                    alert('並び替えの保存に失敗しました');
                    location.reload();
                } else {
                    // Update position numbers
                    document.querySelectorAll('.playlist-item-edit').forEach((item, index) => {
                        item.dataset.position = index + 1;
                        item.querySelector('.text-sm.font-medium.text-zinc-500').textContent = '#' + (index + 1);
                    });
                }
            }
        </script>
    @endpush
</x-layouts.app>
