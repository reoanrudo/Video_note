<?php

declare(strict_types=1);

test('video analysis script can reinitialize safely', function () {
    $script = file_get_contents(dirname(__DIR__, 2).'/resources/js/video-analysis.js');

    expect($script)->toBeString();
    expect($script)->toContain('AbortController');
    expect($script)->not->toContain("if (root.dataset.videoAnalysisInitialized === '1') return;");
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
