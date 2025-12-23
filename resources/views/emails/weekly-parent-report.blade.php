<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>週次活動レポート</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4F46E5;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .header .week-range {
            color: #6B7280;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #1F2937;
            font-size: 18px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #E5E7EB;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .summary-item {
            background-color: #F9FAFB;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #4F46E5;
        }
        .summary-item .label {
            font-size: 12px;
            color: #6B7280;
            margin-bottom: 5px;
        }
        .summary-item .value {
            font-size: 24px;
            font-weight: bold;
            color: #1F2937;
        }
        .achievement-list, .improvement-list, .goal-list {
            list-style: none;
            padding: 0;
        }
        .achievement-list li {
            padding: 10px;
            margin-bottom: 8px;
            background-color: #ECFDF5;
            border-left: 3px solid #10B981;
            border-radius: 4px;
        }
        .achievement-list li:before {
            content: "✓ ";
            color: #10B981;
            font-weight: bold;
            margin-right: 8px;
        }
        .improvement-list li {
            padding: 10px;
            margin-bottom: 8px;
            background-color: #FEF3C7;
            border-left: 3px solid #F59E0B;
            border-radius: 4px;
        }
        .improvement-area {
            font-weight: bold;
            color: #92400E;
        }
        .improvement-suggestion {
            color: #78350F;
            margin-top: 5px;
        }
        .goal-list li {
            padding: 10px;
            margin-bottom: 8px;
            background-color: #EFF6FF;
            border-left: 3px solid #3B82F6;
            border-radius: 4px;
        }
        .goal-list li:before {
            content: "→ ";
            color: #3B82F6;
            font-weight: bold;
            margin-right: 8px;
        }
        .coach-comment {
            background-color: #F9FAFB;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #6366F1;
            font-style: italic;
            color: #4B5563;
        }
        .coach-comment .coach-name {
            text-align: right;
            margin-top: 15px;
            font-weight: bold;
            color: #1F2937;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $projectName }} 週次活動レポート</h1>
            <div class="week-range">{{ $summary['week_range'] ?? '' }}</div>
        </div>

        <!-- サマリーセクション -->
        <div class="section">
            <h2>📊 今週の活動サマリー</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="label">動画本数</div>
                    <div class="value">{{ $summary['total_videos'] ?? 0 }}本</div>
                </div>
                <div class="summary-item">
                    <div class="label">分析ポイント</div>
                    <div class="value">{{ $summary['total_annotations'] ?? 0 }}件</div>
                </div>
                <div class="summary-item">
                    <div class="label">練習日数</div>
                    <div class="value">{{ $summary['practice_days'] ?? 0 }}日</div>
                </div>
                <div class="summary-item">
                    <div class="label">スナップショット</div>
                    <div class="value">{{ $summary['total_snapshots'] ?? 0 }}枚</div>
                </div>
            </div>
        </div>

        <!-- 達成事項 -->
        @if(!empty($achievements))
        <div class="section">
            <h2>🎉 今週の達成事項</h2>
            <ul class="achievement-list">
                @foreach($achievements as $achievement)
                <li>{{ $achievement }}</li>
                @endforeach
            </ul>
        </div>
        @endif

        <!-- 改善点 -->
        @if(!empty($improvements))
        <div class="section">
            <h2>💡 改善のヒント</h2>
            <ul class="improvement-list">
                @foreach($improvements as $improvement)
                <li>
                    <div class="improvement-area">{{ $improvement['area'] }}</div>
                    <div class="improvement-suggestion">{{ $improvement['suggestion'] }}</div>
                </li>
                @endforeach
            </ul>
        </div>
        @endif

        <!-- 来週の目標 -->
        @if(!empty($nextWeekGoals))
        <div class="section">
            <h2>🎯 来週の目標</h2>
            <ul class="goal-list">
                @foreach($nextWeekGoals as $goal)
                <li>{{ $goal }}</li>
                @endforeach
            </ul>
        </div>
        @endif

        <!-- コーチからのコメント -->
        @if(!empty($coachComment))
        <div class="section">
            <h2>💬 コーチからのメッセージ</h2>
            <div class="coach-comment">
                {{ $coachComment }}
                <div class="coach-name">— {{ $coachName }}</div>
            </div>
        </div>
        @endif

        <!-- フッター -->
        <div class="footer">
            <p>このレポートは {{ $coachName }} コーチから自動生成されました</p>
            <p>Video Note - 成長を可視化する動画分析プラットフォーム</p>
        </div>
    </div>
</body>
</html>
