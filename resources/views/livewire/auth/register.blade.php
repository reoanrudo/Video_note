<x-layouts.auth>
    <div class="flex flex-col gap-8">
        <x-auth-header title="PassItを始めよう" description="無料アカウントを作成して、今すぐ動画分析をスタート" />

        <!-- Session Status -->
        <x-auth-session-status class="text-center" :status="session('status')" />

        <form method="POST" action="{{ route('register.store') }}" class="flex flex-col gap-6">
            @csrf

            <!-- Name -->
            <div class="space-y-2">
                <flux:input
                    name="name"
                    label="お名前"
                    :value="old('name')"
                    type="text"
                    required
                    autofocus
                    autocomplete="name"
                    placeholder="山田 太郎"
                    class="w-full"
                />
            </div>

            <!-- Email Address -->
            <div class="space-y-2">
                <flux:input
                    name="email"
                    label="メールアドレス"
                    :value="old('email')"
                    type="email"
                    required
                    autocomplete="email"
                    placeholder="your@email.com"
                    class="w-full"
                />
            </div>

            <!-- Password -->
            <div class="space-y-2">
                <flux:input
                    name="password"
                    label="パスワード"
                    type="password"
                    required
                    autocomplete="new-password"
                    placeholder="8文字以上"
                    viewable
                    class="w-full"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    8文字以上の安全なパスワードを設定してください
                </p>
            </div>

            <!-- Confirm Password -->
            <div class="space-y-2">
                <flux:input
                    name="password_confirmation"
                    label="パスワード（確認）"
                    type="password"
                    required
                    autocomplete="new-password"
                    placeholder="もう一度入力してください"
                    viewable
                    class="w-full"
                />
            </div>

            <!-- Terms Notice -->
            <div class="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                <p class="text-xs text-gray-600 dark:text-gray-400 text-center">
                    アカウントを作成することで、
                    <a href="#" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">利用規約</a>
                    と
                    <a href="#" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">プライバシーポリシー</a>
                    に同意したものとみなします
                </p>
            </div>

            <!-- Submit Button -->
            <div class="flex items-center justify-end pt-2">
                <flux:button
                    type="submit"
                    variant="primary"
                    class="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105"
                    data-test="register-user-button"
                >
                    <span class="flex items-center justify-center gap-2">
                        無料で始める
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </span>
                </flux:button>
            </div>
        </form>

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
                すでにアカウントをお持ちですか？
            </p>
            <flux:link
                :href="route('login')"
                wire:navigate
                class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border-2 border-indigo-600 dark:border-indigo-400 hover:border-indigo-700 dark:hover:border-indigo-300 rounded-xl transition-all hover:scale-105"
            >
                ログイン
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </flux:link>
        </div>
    </div>
</x-layouts.auth>
