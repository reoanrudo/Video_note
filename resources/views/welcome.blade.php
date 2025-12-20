<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>PassIt - プロフェッショナル動画分析ツール</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800,900" rel="stylesheet" />

        @vite(['resources/css/app.css', 'resources/js/app.js'])

        <style>
            body {
                font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }

            @keyframes pulse-slow {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @keyframes gradient-shift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }

            .animate-float {
                animation: float 6s ease-in-out infinite;
            }

            .animate-pulse-slow {
                animation: pulse-slow 3s ease-in-out infinite;
            }

            .gradient-shift {
                background-size: 200% 200%;
                animation: gradient-shift 8s ease infinite;
            }

            .glass-effect {
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .glass-effect-dark {
                background: rgba(17, 24, 39, 0.7);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .text-shadow-glow {
                text-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
            }

            /* Particle background effect */
            .particle-bg::before {
                content: '';
                position: fixed;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
                background-size: 50px 50px;
                animation: particle-drift 20s linear infinite;
                z-index: 0;
                pointer-events: none;
            }

            @keyframes particle-drift {
                0% { transform: translate(0, 0); }
                100% { transform: translate(50px, 50px); }
            }

            /* Grid effect */
            .grid-bg {
                background-image:
                    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
                background-size: 100px 100px;
            }

            /* Smooth scroll */
            html {
                scroll-behavior: smooth;
            }

            /* Hover lift effect */
            .hover-lift {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .hover-lift:hover {
                transform: translateY(-8px) scale(1.02);
            }
        </style>
    </head>
    <body class="antialiased bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950 min-h-screen particle-bg">
        <!-- Ambient light effects -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
            <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style="animation-delay: 2s;"></div>
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow" style="animation-delay: 4s;"></div>
        </div>

        <!-- Header -->
        <header class="absolute top-0 left-0 right-0 z-50">
            <div class="container mx-auto px-6 py-6">
                <div class="glass-effect dark:glass-effect-dark rounded-2xl px-6 py-4">
                    <div class="flex items-center justify-between">
                        <!-- Logo -->
                        <div class="flex items-center gap-3">
                            <div class="relative w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/50 gradient-shift">
                                <svg class="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <span class="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent gradient-shift">PassIt</span>
                                <p class="text-xs text-gray-600 dark:text-gray-400 font-medium">Video Analysis Platform</p>
                            </div>
                        </div>

                        <!-- Navigation -->
                        @if (Route::has('login'))
                            <nav class="flex items-center gap-3">
                                @auth
                                    <a href="{{ url('/dashboard') }}" class="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-105">
                                        Dashboard
                                    </a>
                                @else
                                    <a href="{{ route('login') }}" class="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-105">
                                        ログイン
                                    </a>

                                    @if (Route::has('register'))
                                        <a href="{{ route('register') }}" class="relative px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/80 hover:scale-105 gradient-shift">
                                            <span class="relative z-10">今すぐ始める</span>
                                        </a>
                                    @endif
                                @endauth
                            </nav>
                        @endif
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="relative z-10">
            <!-- Hero Section -->
            <div class="container mx-auto px-6 pt-40 pb-32">
                <div class="max-w-6xl mx-auto">
                    <!-- Hero Content -->
                    <div class="text-center mb-16">
                        <!-- Badge -->
                        <div class="inline-flex items-center gap-2 px-5 py-2.5 glass-effect dark:glass-effect-dark rounded-full mb-10 shadow-lg hover:scale-105 transition-transform cursor-pointer">
                            <span class="relative flex h-3 w-3">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">✨ AI-Powered Video Analysis</span>
                        </div>

                        <!-- Main Headline -->
                        <h1 class="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white mb-8 leading-tight">
                            動画分析の
                            <span class="relative inline-block">
                                <span class="relative z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent gradient-shift text-shadow-glow">
                                    未来
                                </span>
                                <svg class="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 9C70 3 160 1 298 9" stroke="url(#gradient)" stroke-width="4" stroke-linecap="round"/>
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" style="stop-color:rgb(99, 102, 241);stop-opacity:1" />
                                            <stop offset="50%" style="stop-color:rgb(168, 85, 247);stop-opacity:1" />
                                            <stop offset="100%" style="stop-color:rgb(236, 72, 153);stop-opacity:1" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </span>
                            <br />
                            を体験しよう
                        </h1>

                        <!-- Subtitle -->
                        <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                            プロフェッショナルな描画ツール、リアルタイム分析、チームコラボレーション。<br />
                            <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-bold">PassIt</span>でスポーツ分析、教育、研究を次のレベルへ。
                        </p>

                        <!-- CTA Buttons -->
                        <div class="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20">
                            @if (Route::has('register'))
                                <a href="{{ route('register') }}" class="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-lg font-black rounded-2xl transition-all shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/80 hover:scale-110 gradient-shift overflow-hidden">
                                    <span class="relative z-10 flex items-center justify-center gap-2">
                                        無料で始める
                                        <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </a>
                            @endif
                            @if (Route::has('login'))
                                <a href="{{ route('login') }}" class="group w-full sm:w-auto px-10 py-5 glass-effect dark:glass-effect-dark text-gray-900 dark:text-white text-lg font-black rounded-2xl hover:scale-110 transition-all shadow-xl flex items-center justify-center gap-2">
                                    デモを見る
                                    <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </a>
                            @endif
                        </div>

                        <!-- Social Proof -->
                        <div class="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span class="font-semibold">5.0 Rating</span>
                            </div>
                            <div class="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span class="font-semibold">信頼性の高いプラットフォーム</span>
                            </div>
                            <div class="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span class="font-semibold">高速処理</span>
                            </div>
                        </div>
                    </div>

                    <!-- Features Grid -->
                    <div class="grid md:grid-cols-3 gap-6 mt-24">
                        <!-- Feature 1 -->
                        <div class="group glass-effect dark:glass-effect-dark rounded-3xl p-10 shadow-xl hover-lift cursor-pointer">
                            <div class="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-indigo-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                            </div>
                            <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">プロ級描画ツール</h3>
                            <p class="text-gray-600 dark:text-gray-400 leading-relaxed text-center font-medium">
                                線、矢印、円、テキスト、吹き出し。フォントサイズ調整可能で、動きを詳細に分析できます。
                            </p>
                        </div>

                        <!-- Feature 2 -->
                        <div class="group glass-effect dark:glass-effect-dark rounded-3xl p-10 shadow-xl hover-lift cursor-pointer">
                            <div class="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-purple-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                            </div>
                            <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">瞬間キャプチャ</h3>
                            <p class="text-gray-600 dark:text-gray-400 leading-relaxed text-center font-medium">
                                重要なシーンを即座にスナップショット。タイムスタンプ付きで後から簡単に振り返り。
                            </p>
                        </div>

                        <!-- Feature 3 -->
                        <div class="group glass-effect dark:glass-effect-dark rounded-3xl p-10 shadow-xl hover-lift cursor-pointer">
                            <div class="relative w-16 h-16 bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-pink-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <div class="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                            </div>
                            <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-4 text-center">チーム共有</h3>
                            <p class="text-gray-600 dark:text-gray-400 leading-relaxed text-center font-medium">
                                URLリンク一つで共有完了。チーム全員がリアルタイムで分析結果にアクセス可能。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Use Cases Section -->
            <div class="container mx-auto px-6 py-32 grid-bg">
                <div class="max-w-6xl mx-auto">
                    <div class="text-center mb-20">
                        <h2 class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
                            あらゆる場面で
                            <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">活躍</span>
                        </h2>
                        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
                            スポーツ、教育、ビジネス。動画分析が必要なすべてのシーンで
                        </p>
                    </div>

                    <div class="grid md:grid-cols-2 gap-8">
                        <!-- Use Case 1 -->
                        <div class="group glass-effect dark:glass-effect-dark rounded-3xl p-10 hover-lift cursor-pointer shadow-xl">
                            <div class="flex items-start gap-6">
                                <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-3">スポーツ分析</h3>
                                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">フォーム改善、戦術分析、パフォーマンス向上を科学的にサポート</p>
                                </div>
                            </div>
                        </div>

                        <!-- Use Case 2 -->
                        <div class="group glass-effect dark:glass-effect-dark rounded-3xl p-10 hover-lift cursor-pointer shadow-xl">
                            <div class="flex items-start gap-6">
                                <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-3">教育・研修</h3>
                                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">授業やトレーニング動画に詳細なフィードバックを即座に追加</p>
                                </div>
                            </div>
                        </div>

                        <!-- Use Case 3 -->
                        <div class="group glass-effect dark:glass-effect-dark rounded-3xl p-10 hover-lift cursor-pointer shadow-xl">
                            <div class="flex items-start gap-6">
                                <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-3">研究・開発</h3>
                                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">動作分析、実験記録、プロセス改善に最適な分析環境を提供</p>
                                </div>
                            </div>
                        </div>

                        <!-- Use Case 4 -->
                        <div class="group glass-effect dark:glass-effect-dark rounded-3xl p-10 hover-lift cursor-pointer shadow-xl">
                            <div class="flex items-start gap-6">
                                <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-3">ビジネス</h3>
                                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">プレゼン分析、ミーティング記録、品質管理を効率化</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CTA Section -->
            <div class="container mx-auto px-6 py-32">
                <div class="max-w-5xl mx-auto">
                    <div class="relative glass-effect dark:glass-effect-dark rounded-[3rem] p-16 shadow-2xl overflow-hidden">
                        <!-- Background gradient -->
                        <div class="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 gradient-shift"></div>

                        <div class="relative z-10 text-center">
                            <h2 class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
                                今すぐ
                                <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">体験</span>
                                しよう
                            </h2>
                            <p class="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
                                クレジットカード不要。今すぐ無料で始められます。
                            </p>
                            <div class="flex flex-col sm:flex-row items-center justify-center gap-5">
                                @if (Route::has('register'))
                                    <a href="{{ route('register') }}" class="group relative w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xl font-black rounded-2xl transition-all shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/80 hover:scale-110 gradient-shift">
                                        <span class="relative z-10 flex items-center justify-center gap-2">
                                            無料アカウント作成
                                            <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    </a>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="relative z-10 border-t border-gray-200/50 dark:border-gray-800/50 glass-effect dark:glass-effect-dark">
            <div class="container mx-auto px-6 py-12">
                <div class="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-xl gradient-shift">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span class="text-xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">PassIt</span>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Video Analysis Platform</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        &copy; {{ date('Y') }} PassIt. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    </body>
</html>
