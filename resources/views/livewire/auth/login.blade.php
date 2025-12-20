<x-layouts.auth>
    <div class="flex flex-col gap-8">
        <x-auth-header title="PassItにログイン" description="アカウントにアクセスして動画分析を始めましょう" />

        <!-- Session Status -->
        <x-auth-session-status class="text-center" :status="session('status')" />

        <form method="POST" action="{{ route('login.store') }}" class="flex flex-col gap-6">
            @csrf

            <!-- Email Address -->
            <div class="space-y-2">
                <flux:input
                    name="email"
                    label="メールアドレス"
                    :value="old('email')"
                    type="email"
                    required
                    autofocus
                    autocomplete="email"
                    placeholder="your@email.com"
                    class="w-full"
                />
            </div>

            <!-- Password -->
            <div class="relative space-y-2">
                <flux:input
                    name="password"
                    label="パスワード"
                    type="password"
                    required
                    autocomplete="current-password"
                    placeholder="••••••••"
                    viewable
                    class="w-full"
                />

                @if (Route::has('password.request'))
                    <div class="text-right mt-2">
                        <flux:link class="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors" :href="route('password.request')" wire:navigate>
                            パスワードをお忘れですか？
                        </flux:link>
                    </div>
                @endif
            </div>

            <!-- Remember Me -->
            <div class="flex items-center">
                <flux:checkbox name="remember" :checked="old('remember')" id="remember" />
                <label for="remember" class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    ログイン状態を保持する
                </label>
            </div>

            <!-- Submit Button -->
            <div class="flex items-center justify-end pt-2">
                <flux:button
                    type="submit"
                    variant="primary"
                    class="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105"
                    data-test="login-button"
                >
                    <span class="flex items-center justify-center gap-2">
                        ログイン
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </span>
                </flux:button>
            </div>
        </form>

        @if (Route::has('register'))
            <div class="relative">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-4 bg-white dark:bg-gray-900/80 text-gray-600 dark:text-gray-400 font-medium">または</span>
                </div>
            </div>

            <div class="text-center space-y-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    アカウントをお持ちでないですか？
                </p>
                <flux:link
                    :href="route('register')"
                    wire:navigate
                    class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border-2 border-indigo-600 dark:border-indigo-400 hover:border-indigo-700 dark:hover:border-indigo-300 rounded-xl transition-all hover:scale-105"
                >
                    無料アカウントを作成
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </flux:link>
            </div>
        @endif
    </div>
</x-layouts.auth>
