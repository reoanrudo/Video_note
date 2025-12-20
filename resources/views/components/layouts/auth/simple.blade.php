<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        @include('partials.head')

        <style>
            @keyframes gradient-shift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }

            @keyframes pulse-slow {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }

            .gradient-shift {
                background-size: 200% 200%;
                animation: gradient-shift 8s ease infinite;
            }

            .animate-pulse-slow {
                animation: pulse-slow 3s ease-in-out infinite;
            }

            .animate-float {
                animation: float 6s ease-in-out infinite;
            }

            .glass-effect {
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .glass-effect-dark {
                background: rgba(17, 24, 39, 0.8);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            /* Particle background */
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

            /* Input focus glow */
            input:focus, textarea:focus, select:focus {
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
        </style>
    </head>
    <body class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950 antialiased particle-bg">
        <!-- Ambient light effects -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
            <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style="animation-delay: 2s;"></div>
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow" style="animation-delay: 4s;"></div>
        </div>

        <!-- Main Content -->
        <div class="relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 p-6 md:p-10">
            <!-- Logo -->
            <a href="{{ route('home') }}" class="flex flex-col items-center gap-3 font-medium group" wire:navigate>
                <div class="relative">
                    <div class="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 gradient-shift group-hover:scale-110 transition-all">
                        <svg class="w-9 h-9 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div class="text-center">
                    <span class="text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent gradient-shift">PassIt</span>
                    <p class="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">Video Analysis Platform</p>
                </div>
            </a>

            <!-- Auth Card -->
            <div class="w-full max-w-md">
                <div class="glass-effect dark:glass-effect-dark rounded-3xl p-10 shadow-2xl">
                    {{ $slot }}
                </div>
            </div>

            <!-- Back to home link -->
            <a href="{{ route('home') }}" class="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors flex items-center gap-2 group">
                <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                ホームに戻る
            </a>
        </div>

        @fluxScripts
    </body>
</html>
