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
    expect($script)->toContain('data-text-id');
    expect($script)->toContain('text-sm');
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
    expect($script)->toContain('cwDeg');
    expect($script)->toContain('ccwDeg');
    expect($script)->toContain('% (2 * Math.PI)');
    expect($script)->toContain('controlX');
    expect($script)->toContain('controlY');
    expect($script)->toContain("state.angleDraftPhase = 'control'");
    expect($script)->toContain("state.angleDraftPhase === 'control'");
    expect($script)->toContain("state.angleDraftPhase === 'end'");
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
    expect($script)->toContain('const isDraftingAngle = state.selectedTool === \'angle\'');
    expect($script)->toContain('const shouldAutoSwitchToMove = !isDraftingAngle');
    expect($script)->toContain("state.selectedTool = 'move'");
});

test('video analysis shows snapshot markers on the seek bar', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('data-role="snapshot-markers"');
    expect($script)->toContain('renderSnapshotMarkers');
    expect($script)->toContain('data-action="delete-snapshot"');
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

test('video analysis provides magnifier tool', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain("id: 'magnifier'");
    expect($script)->toContain("tool === 'magnifier'");
    expect($script)->toContain('handleX');
    expect($script)->toContain('handleY');
    expect($script)->toContain('handleRadius');
    expect($script)->toContain('event.altKey');
    expect($script)->toContain('zoom');
});

test('text tool places default label', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain("text: 'テキスト'");
});

test('video analysis supports editing existing text and notes with move tool', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('renderTextOverlays');
    expect($script)->toContain('contentEditable');
});

test('clear all only clears current frame', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('Math.round((state.currentTime || 0) * 30) / 30');
    expect($script)->not->toContain('Math.round(s.time * 30) / 30 !== frame');
    expect($script)->not->toContain('Math.round(n.time * 30) / 30 !== frame');
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
