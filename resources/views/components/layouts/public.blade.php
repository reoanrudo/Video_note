<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        @include('partials.head')
    </head>
    <body class="min-h-screen bg-white dark:bg-zinc-800">
        <header class="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
            <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 p-4">
                <a href="{{ route('home') }}" class="flex items-center gap-2">
                    <x-app-logo-icon class="size-6 fill-current text-black dark:text-white" />
                    <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{{ config('app.name') }}</span>
                </a>

                <div class="flex items-center gap-2">
                    @auth
                        <flux:button as="a" variant="outline" size="sm" href="{{ route('dashboard') }}" wire:navigate>
                            ダッシュボードへ
                        </flux:button>
                    @else
                        <flux:button as="a" variant="outline" size="sm" href="{{ route('login') }}" wire:navigate>
                            ログイン
                        </flux:button>
                    @endauth
                </div>
            </div>
        </header>

        <main class="mx-auto w-full max-w-6xl p-4">
            {{ $slot }}
        </main>

        @fluxScripts
    </body>
</html>

