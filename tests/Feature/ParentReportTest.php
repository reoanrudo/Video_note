<?php

use App\Mail\WeeklyParentReport;
use App\Models\ParentReport;
use App\Models\Project;
use App\Models\User;
use App\Models\Video;
use App\Services\ParentReportGenerator;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

test('parent report can be generated for a project with activity', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    // 今週の動画を作成
    $weekStart = Carbon::now()->startOfWeek();
    Video::factory()->create([
        'project_id' => $project->id,
        'created_at' => $weekStart->copy()->addDays(1),
        'annotations' => [
            'annotations' => [
                ['type' => 'text', 'content' => 'Good form'],
                ['type' => 'arrow', 'content' => 'Improve angle'],
            ],
            'snapshots' => [
                ['path' => 'snapshots/test1.jpg', 'name' => 'Snapshot 1'],
            ],
        ],
    ]);

    $generator = app(ParentReportGenerator::class);
    $report = $generator->generateWeeklyReport($project, $weekStart);

    expect($report)->toBeInstanceOf(ParentReport::class)
        ->and($report->user_id)->toBe($user->id)
        ->and($report->project_id)->toBe($project->id)
        ->and($report->data['summary']['total_videos'])->toBe(1)
        ->and($report->data['summary']['total_annotations'])->toBe(2)
        ->and($report->data['summary']['practice_days'])->toBe(1);
});

test('parent report identifies achievements based on activity', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $weekStart = Carbon::now()->startOfWeek();

    // 週5日の練習を作成
    for ($i = 0; $i < 5; $i++) {
        Video::factory()->create([
            'project_id' => $project->id,
            'created_at' => $weekStart->copy()->addDays($i),
            'annotations' => ['annotations' => []],
        ]);
    }

    $generator = app(ParentReportGenerator::class);
    $report = $generator->generateWeeklyReport($project, $weekStart);

    expect($report->data['achievements'])->toContain('週5日以上の継続的な練習を達成しました！');
});

test('parent report suggests improvements when activity is low', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $weekStart = Carbon::now()->startOfWeek();

    // 低頻度の練習
    Video::factory()->create([
        'project_id' => $project->id,
        'created_at' => $weekStart->copy()->addDay(),
        'annotations' => ['annotations' => []],
    ]);

    $generator = app(ParentReportGenerator::class);
    $report = $generator->generateWeeklyReport($project, $weekStart);

    $improvementAreas = collect($report->data['improvements'])->pluck('area');
    expect($improvementAreas)->toContain('練習頻度');
});

test('parent report is not duplicated when generated twice', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $weekStart = Carbon::now()->startOfWeek();
    Video::factory()->create([
        'project_id' => $project->id,
        'created_at' => $weekStart->copy()->addDay(),
        'annotations' => ['annotations' => []],
    ]);

    $generator = app(ParentReportGenerator::class);
    $firstReport = $generator->generateWeeklyReport($project, $weekStart);
    $secondReport = $generator->generateWeeklyReport($project, $weekStart);

    expect($firstReport->id)->toBe($secondReport->id)
        ->and(ParentReport::count())->toBe(1);
});

test('parent report can be marked as sent', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $report = ParentReport::create([
        'user_id' => $user->id,
        'project_id' => $project->id,
        'week_start' => Carbon::now()->startOfWeek(),
        'week_end' => Carbon::now()->endOfWeek(),
        'data' => ['summary' => []],
    ]);

    expect($report->isSent())->toBeFalse();

    $report->markAsSent();

    expect($report->fresh()->isSent())->toBeTrue()
        ->and($report->sent_at)->not->toBeNull();
});

test('weekly parent report mail can be queued', function () {
    Mail::fake();

    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id, 'name' => 'Tennis Training']);

    $report = ParentReport::create([
        'user_id' => $user->id,
        'project_id' => $project->id,
        'week_start' => Carbon::now()->startOfWeek(),
        'week_end' => Carbon::now()->endOfWeek(),
        'parent_email' => 'parent@example.com',
        'data' => [
            'summary' => [
                'project_name' => 'Tennis Training',
                'week_range' => '2024/01/01 - 2024/01/07',
                'total_videos' => 5,
                'total_annotations' => 10,
                'practice_days' => 3,
            ],
            'achievements' => ['Great progress this week!'],
            'improvements' => [],
            'next_week_goals' => ['Practice 4 times'],
        ],
    ]);

    Mail::to($report->parent_email)->send(new WeeklyParentReport($report));

    Mail::assertQueued(WeeklyParentReport::class, function ($mail) use ($report) {
        return $mail->report->id === $report->id;
    });
});

test('batch report generation creates reports for active projects', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $activeProject = Project::factory()->create(['user_id' => $user1->id]);
    $inactiveProject = Project::factory()->create(['user_id' => $user2->id]);

    // アクティブなプロジェクトに最近の動画を追加
    Video::factory()->create([
        'project_id' => $activeProject->id,
        'created_at' => Carbon::now()->subDays(5),
    ]);

    // 非アクティブなプロジェクトには古い動画のみ
    Video::factory()->create([
        'project_id' => $inactiveProject->id,
        'created_at' => Carbon::now()->subDays(40),
    ]);

    $generator = app(ParentReportGenerator::class);
    $weekStart = Carbon::now()->startOfWeek();
    $count = $generator->generateBatchReports($weekStart);

    expect($count)->toBe(1)
        ->and(ParentReport::where('project_id', $activeProject->id)->exists())->toBeTrue()
        ->and(ParentReport::where('project_id', $inactiveProject->id)->exists())->toBeFalse();
});

test('generate weekly reports command executes successfully', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    Video::factory()->create([
        'project_id' => $project->id,
        'created_at' => Carbon::now()->subWeek()->addDay(),
    ]);

    $this->artisan('reports:generate-weekly', ['--week-start' => Carbon::now()->subWeek()->startOfWeek()->toDateString()])
        ->expectsOutput('週次保護者レポート生成を開始します...')
        ->assertExitCode(0);

    expect(ParentReport::count())->toBe(1);
});

test('parent report forWeek helper finds existing report', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $weekStart = Carbon::now()->startOfWeek()->toDateString();

    $report = ParentReport::create([
        'user_id' => $user->id,
        'project_id' => $project->id,
        'week_start' => $weekStart,
        'week_end' => Carbon::parse($weekStart)->endOfWeek(),
        'data' => [],
    ]);

    expect($report)->not->toBeNull()
        ->and($report->id)->toBeGreaterThan(0);

    $found = ParentReport::forWeek($user->id, $project->id, $weekStart);

    expect($found)->not->toBeNull()
        ->and($found->id)->toBe($report->id);
});
