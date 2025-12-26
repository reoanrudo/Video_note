<x-layouts.app :title="'KPI ダッシュボード'">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">KPI ダッシュボード</h1>
            <p class="text-zinc-600 dark:text-zinc-400 mt-1">週次のプロジェクト作成数と主要指標</p>
        </div>

        {{-- サマリーカード --}}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {{-- 総プロジェクト数 --}}
            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-zinc-600 dark:text-zinc-400">総プロジェクト数</p>
                        <p class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                            {{ number_format($summary['total_projects']) }}
                        </p>
                    </div>
                    <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            {{-- 総ユーザー数 --}}
            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-zinc-600 dark:text-zinc-400">総ユーザー数</p>
                        <p class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                            {{ number_format($summary['total_users']) }}
                        </p>
                    </div>
                    <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                        <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {{-- アクティブユーザー数 --}}
            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-zinc-600 dark:text-zinc-400">アクティブユーザー数（7日）</p>
                        <p class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                            {{ number_format($summary['active_users']) }}
                        </p>
                    </div>
                    <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- 今週のプロジェクト作成数 -->
            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-zinc-600 dark:text-zinc-400">今週のプロジェクト作成</p>
                        <p class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                            {{ number_format($summary['this_week_projects']) }}
                        </p>
                        @if($summary['growth_rate'] !== 0.0)
                            <p class="text-xs mt-1 {{ $summary['growth_rate'] >= 0 ? 'text-green-600' : 'text-red-600' }}">
                                {{ $summary['growth_rate'] >= 0 ? '+' : '' }}{{ number_format($summary['growth_rate'], 1) }}% vs 先週
                            </p>
                        @endif
                    </div>
                    <div class="p-3 {{ $summary['growth_rate'] >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900' }} rounded-lg">
                        @if($summary['growth_rate'] >= 0)
                            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        @else
                            <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        @endif
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {{-- 週次プロジェクト作成数グラフ --}}
            <div class="lg:col-span-2 bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">週次プロジェクト作成数</h2>
                <div class="h-64" id="weekly-chart"></div>
            </div>

            {{-- プラン別ユーザー数 --}}
            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">プラン別ユーザー数</h2>
                <div class="space-y-4">
                    @foreach($summary['users_by_plan'] as $plan => $count)
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-zinc-600 dark:text-zinc-400">
                                    {{ ucfirst($plan) }} プラン
                                </span>
                                <span class="font-medium text-zinc-900 dark:text-zinc-100">
                                    {{ number_format($count) }} ({{ $summary['total_users'] > 0 ? round($count / $summary['total_users'] * 100) : 0 }}%)
                                </span>
                            </div>
                            <div class="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: {{ $summary['total_users'] > 0 ? ($count / $summary['total_users'] * 100) : 0 }}%"></div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>
    </div>

    {{-- Chart.js 使用（CDN） --}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const weeklyData = @js($summary['weekly_project_creations']);
            const labels = weeklyData.map(d => {
                const [year, week] = d.week.split('-');
                return `${year}年第${week}週`;
            });
            const data = weeklyData.map(d => d.count);

            new Chart(document.getElementById('weekly-chart'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'プロジェクト作成数',
                        data: data,
                        borderColor: 'rgb(37, 99, 235)',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        });
    </script>
</x-layouts.app>
