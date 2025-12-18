<?php

declare(strict_types=1);

test('video analysis script can reinitialize safely', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('AbortController');
    expect($script)->not->toContain("if (root.dataset.videoAnalysisInitialized === '1') return;");
});

test('video analysis script defines curve control point helper', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('function getCurveControlPoint');
});

test('video analysis script uses smaller text tool font', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('const fontSize = 12;');
});

test('video analysis script draws smaller crosshair', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('const size = 12;');
    expect($script)->toContain('ctx.arc(drawing.x, drawing.y, 2');
});

test('video analysis script draws smaller angle guide', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('const arcRadius = 50;');
    expect($script)->toContain('const verticalLength = 120;');
    expect($script)->toContain('const horizontalLength = 120;');
});

test('video analysis angle tools normalize beyond 180 degrees', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('normalizedAngle');
    expect($script)->toContain('% (2 * Math.PI)');
});

test('video analysis ignores right click for drawing interactions', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('if (event.button !== 0) return;');
    expect($script)->toContain("ui.stage.addEventListener('contextmenu'");
});

test('video analysis auto switches to move tool when clicking an existing drawing', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('const shouldAutoSwitchToMove = drawingIndex !== -1');
    expect($script)->toContain("state.selectedTool = 'move'");
});

test('video analysis shows snapshot markers on the seek bar', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('data-role="snapshot-markers"');
    expect($script)->toContain('renderSnapshotMarkers');
});

test('video analysis notes can point to a target', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('data-note-target-for');
    expect($script)->toContain("mode: 'target'");
    expect($script)->toContain('targetX');
    expect($script)->toContain('targetY');
});

test('video analysis header has share button', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('data-action="share"');
    expect($script)->toContain('navigator.clipboard.writeText');
});

test('project show view provides share url via data attribute', function () {
    $view = file_get_contents(dirname(__DIR__, 2).'/resources/views/projects/show.blade.php');

    expect($view)->toBeString();
    expect($view)->toContain('data-share-url');
});

test('video analysis background uses the same gray as the app chrome', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('flex-1 flex flex-col bg-[#2a2a2a]');
});

test('zoom is clipped within the stage frame', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('data-role="stage"');
    expect($script)->toContain('overflow-hidden');
});

test('zoom scales video and overlays without shrinking the canvas layer', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('ui.mediaWrap.style.transform');
    expect($script)->toContain('ui.noteLayer.style.transform');
});

test('move tool uses stage pointer events so drawings can be selected even when overlays are present', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain("ui.stage.addEventListener('pointerdown'");
    expect($script)->toContain("ui.canvas.style.pointerEvents = 'none'");
});

test('mouse wheel zoom is supported on the stage', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain("'wheel'");
    expect($script)->toContain('passive: false');
});
