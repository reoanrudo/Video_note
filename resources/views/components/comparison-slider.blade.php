<div
    x-data="{
        sliderValue: 50,
        beforeImage: @js($beforeImage ?? ''),
        afterImage: @js($afterImage ?? ''),
        title: @js($title ?? 'Before / After比較'),
        description: @js($description ?? ''),
    }"
    class="w-full max-w-4xl mx-auto"
>
    <div class="mb-4">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ $title }}</h3>
        @if($description ?? false)
            <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{{ $description }}</p>
        @endif
    </div>

    <div class="relative w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shadow-lg" style="aspect-ratio: 16/9;">
        <!-- Before 画像 (背景全体) -->
        <div class="absolute inset-0">
            <img
                :src="beforeImage"
                alt="Before"
                class="w-full h-full object-contain"
            />
            <div class="absolute bottom-2 left-2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                Before
            </div>
        </div>

        <!-- After 画像 (スライダーで制御) -->
        <div class="absolute inset-0 overflow-hidden" :style="`clip-path: inset(0 ${100 - sliderValue}% 0 0)`">
            <img
                :src="afterImage"
                alt="After"
                class="w-full h-full object-contain"
            />
            <div class="absolute bottom-2 right-2 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                After
            </div>
        </div>

        <!-- スライダーハンドル -->
        <div
            class="absolute inset-y-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
            :style="`left: ${sliderValue}%`"
            @mousedown.prevent="handleDrag"
        >
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
            </div>
        </div>
    </div>

    <!-- スライダーコントロール -->
    <div class="mt-4">
        <input
            type="range"
            min="0"
            max="100"
            x-model="sliderValue"
            class="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div class="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            <span>Before (0%)</span>
            <span x-text="`${sliderValue}%`"></span>
            <span>After (100%)</span>
        </div>
    </div>

    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('comparison', () => ({
                handleDrag(event) {
                    const container = event.target.closest('[x-data]').querySelector('[style*="aspect-ratio"]');
                    const rect = container.getBoundingClientRect();

                    const updatePosition = (e) => {
                        const x = e.clientX - rect.left;
                        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                        this.sliderValue = Math.round(percent);
                    };

                    const stopDrag = () => {
                        document.removeEventListener('mousemove', updatePosition);
                        document.removeEventListener('mouseup', stopDrag);
                    };

                    document.addEventListener('mousemove', updatePosition);
                    document.addEventListener('mouseup', stopDrag);
                }
            }))
        });
    </script>
</div>
