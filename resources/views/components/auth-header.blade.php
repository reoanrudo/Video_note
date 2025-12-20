@props([
    'title',
    'description',
])

<div class="flex w-full flex-col text-center mb-8">
    <h1 class="text-4xl font-black text-gray-900 dark:text-white mb-3">
        <span class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {{ $title }}
        </span>
    </h1>
    <p class="text-base text-gray-600 dark:text-gray-400 font-medium">{{ $description }}</p>
</div>
