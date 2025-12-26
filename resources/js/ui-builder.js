/**
 * Video Analysis - UI Builder
 * Builds the video analysis interface HTML
 */

import { svgIcon, DRAW_COLORS, TAG_COLORS, FORMATIONS, TOOL_DEFS, escapeHtml, escapeAttribute } from './utils.js';

function buildUi(root, { readOnly, projectName, dashboardUrl }) {
    const shareUrl = root.dataset.shareUrl || '';
    const openDisabled = readOnly ? 'disabled' : '';
    const openClass = readOnly
        ? 'flex items-center gap-2 px-3 py-1.5 bg-[#333] opacity-50 rounded text-sm transition-colors cursor-not-allowed'
        : 'flex items-center gap-2 px-3 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] rounded text-sm transition-colors';

    const saveDisabled = readOnly ? 'disabled' : '';
    const saveClass = readOnly
        ? 'flex items-center gap-2 px-3 py-1.5 bg-[#333] opacity-50 rounded text-sm transition-colors cursor-not-allowed'
        : 'flex items-center gap-2 px-3 py-1.5 bg-[#333] hover:bg-[#3a3a3a] rounded text-sm transition-colors';

    const saveButton = `<button type="button" data-action="save" ${saveDisabled} class="${saveClass}">${svgIcon('save', 16)}Save</button>`;

    const openButton = `<button type="button" data-action="open-video" ${openDisabled} class="${openClass}">${svgIcon('folderOpen', 16)}Open Video</button>`;

    const shareDisabled = shareUrl === '' ? 'disabled' : '';
    const shareClass =
        shareUrl === ''
            ? 'flex items-center gap-2 px-3 py-1.5 bg-[#333] opacity-50 rounded text-sm transition-colors cursor-not-allowed'
            : 'flex items-center gap-2 px-3 py-1.5 bg-[#333] hover:bg-[#3a3a3a] rounded text-sm transition-colors';
    const shareButton = `<button type="button" data-action="share" ${shareDisabled} class="${shareClass}">${svgIcon('share', 16)}共有</button>`;

    const dashboardButton = dashboardUrl
        ? `<a href="${escapeAttribute(dashboardUrl)}" class="flex items-center gap-2 px-3 py-1.5 bg-[#333] hover:bg-[#3a3a3a] rounded text-sm transition-colors">ダッシュボードへ</a>`
        : '';

    const title = projectName
        ? `<div class="text-sm font-semibold text-white/90 truncate" data-role="project-title">${escapeHtml(projectName)}</div>`
        : '';

    const toolbarButtons = TOOL_DEFS.map((tool, idx) => {
        if (tool.separator) {
            return `<div data-role="tool-sep-${idx}" class="h-px bg-[#3a3a3a] w-10 my-1" aria-hidden="true"></div>`;
        }

        const badge = tool.badge
            ? `<span class="absolute bottom-0 right-0 text-[8px] bg-[#1e1e1e] px-1 rounded">${tool.badge}</span>`
            : '';

        return `
      <button
        type="button"
        data-tool="${tool.id}"
        class="w-12 h-12 flex items-center justify-center rounded transition-colors relative bg-[#333] hover:bg-[#3a3a3a]"
        title="${tool.label}"
      >
        ${svgIcon(tool.icon, 20)}
        ${badge}
      </button>
    `;
    }).join('');

    const captureDisabled = readOnly ? 'disabled' : '';
    const captureBtnClass = readOnly
        ? 'w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#333] opacity-50 rounded text-sm transition-colors cursor-not-allowed'
        : 'w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#0078d4] hover:bg-[#106ebe] rounded text-sm transition-colors';

    root.innerHTML = `
    <style>
      [data-placeholder]:empty:before {
        content: attr(data-placeholder);
        color: #9ca3af;
        font-style: italic;
        pointer-events: none;
      }
    </style>
    <div class="h-full bg-[#2a2a2a] text-white flex flex-col">
      <div class="bg-[#1e1e1e] border-b border-[#3a3a3a] px-3 py-2 flex items-center gap-4">
        ${dashboardButton}
        ${title}
        ${openButton}
        ${saveButton}
        <input data-role="file-input" type="file" accept="video/*" class="hidden" />
        <div class="ml-auto flex items-center gap-3">
          ${shareButton}
          <div class="flex items-center gap-4 text-sm text-gray-400">
            <span data-role="status"></span>
            <span data-role="video-status"></span>
          </div>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <div class="w-16 bg-[#252525] border-r border-[#3a3a3a] flex flex-col items-center py-4 gap-1 overflow-y-auto">
          ${toolbarButtons}
          <div class="h-px bg-[#3a3a3a] w-10 my-1" aria-hidden="true"></div>
          <button type="button" data-action="clear-all" class="w-12 h-12 flex items-center justify-center rounded bg-[#333] hover:bg-[#3a3a3a] transition-colors" title="Clear All">
            ${svgIcon('trash', 20)}
          </button>
        </div>

        <div class="flex-1 flex flex-col bg-[#2a2a2a]">
          <div class="flex-1 relative">
            <div class="absolute inset-0 overflow-hidden" data-role="stage">
              <div data-role="board-wrap" class="absolute inset-0">
                <canvas data-role="canvas" class="absolute inset-0 cursor-crosshair z-20"></canvas>
                <div data-role="note-layer" class="absolute inset-0 pointer-events-none z-30"></div>

                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10" aria-hidden="true">
                    <div data-role="media-wrap" class="relative">
                    <video data-role="video" class="max-w-full max-h-full" style="display:block;max-width:100%;max-height:100%;object-fit:contain;" playsinline></video>
                  </div>
                </div>
              </div>

              <div data-role="text-input" class="absolute bg-white text-black p-2 rounded shadow-lg hidden z-50">
                <input data-role="text-input-field" type="text" class="px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Enter text..." />
                <button type="button" data-action="text-ok" class="ml-2 px-3 py-1 bg-[#0078d4] text-white rounded text-sm">OK</button>
              </div>
            </div>
          </div>

          <div data-role="drawing-options" class="bg-[#1e1e1e] border-t border-[#3a3a3a] p-3 flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-300">Color:</span>
              <div class="flex gap-1" data-role="color-palette">
                ${DRAW_COLORS.map((color) => `<button type="button" data-color="${color}" class="w-8 h-8 rounded border-2 transition-all border-transparent" style="background-color:${color}"></button>`).join('')}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-300">Width:</span>
              <input data-role="line-width" type="range" min="1" max="10" value="3" class="w-32" />
              <span class="text-sm text-gray-300 w-10" data-role="line-width-label"></span>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-300">Font Size:</span>
              <input data-role="font-size" type="range" min="10" max="48" value="14" class="w-32" />
              <span class="text-sm text-gray-300 w-12" data-role="font-size-label"></span>
            </div>

            <div class="flex items-center gap-2 hidden" data-role="autonumber-box">
              <span class="text-sm text-gray-300">Next number:</span>
              <span class="text-sm font-bold text-white" data-role="autonumber-count"></span>
              <button type="button" data-action="autonumber-reset" class="px-2 py-1 bg-[#333] hover:bg-[#3a3a3a] rounded text-xs">Reset</button>
            </div>

            <div class="flex items-center gap-2 hidden" data-role="pose-options">
              <span class="text-sm text-gray-300">Track:</span>
              <select data-role="trajectory-point" class="px-2 py-1 bg-[#333] text-white border border-[#3a3a3a] rounded text-sm">
                <option value="left_ankle">Left Ankle</option>
                <option value="right_ankle">Right Ankle</option>
                <option value="left_hip">Left Hip</option>
                <option value="right_hip">Right Hip</option>
                <option value="left_shoulder">Left Shoulder</option>
                <option value="right_shoulder">Right Shoulder</option>
                <option value="nose">Nose</option>
              </select>
              <label class="flex items-center gap-1 text-sm text-gray-300">
                <input type="checkbox" data-role="show-skeleton" checked class="rounded">
                <span>Skeleton</span>
              </label>
              <label class="flex items-center gap-1 text-sm text-gray-300">
                <input type="checkbox" data-role="show-trajectory" checked class="rounded">
                <span>Trajectory</span>
              </label>
            </div>
          </div>
        </div>

        <div class="w-64 bg-[#252525] border-l border-[#3a3a3a] flex flex-col">
          <div class="p-3 border-b border-[#3a3a3a]">
            <h3 class="text-sm font-semibold mb-2">Timeline</h3>

            <div data-role="memo-input" class="space-y-2 hidden">
              <textarea data-role="memo-text" rows="3" class="w-full px-2 py-1 bg-[#333] text-white border border-[#3a3a3a] rounded text-sm resize-none" placeholder="キャプチャータイトルを入力..."></textarea>
              <div class="flex gap-2">
                <button type="button" data-action="memo-save" class="flex-1 px-3 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] rounded text-sm transition-colors">保存</button>
                <button type="button" data-action="memo-cancel" class="flex-1 px-3 py-1.5 bg-[#333] hover:bg-[#3a3a3a] rounded text-sm transition-colors">キャンセル</button>
              </div>
            </div>

            <button type="button" data-action="capture" ${captureDisabled} class="${captureBtnClass}">
              ${svgIcon('download', 16)}Capture Frame
            </button>
          </div>

          <div class="p-3 border-b border-[#3a3a3a]">
            <h3 class="text-sm font-semibold mb-2">Tags</h3>

            <div data-role="tag-input" class="space-y-2 hidden">
              <input
                data-role="tag-name"
                type="text"
                class="w-full px-2 py-1 bg-[#333] text-white border border-[#3a3a3a] rounded text-sm"
                placeholder="タグ名（例: ゴール、ファール）"
                maxlength="30"
              />
              <div class="flex gap-1 flex-wrap">
                ${TAG_COLORS.map((color) => `
                  <button
                    type="button"
                    data-tag-color="${color}"
                    class="w-6 h-6 rounded border-2 border-transparent transition-all hover:border-white"
                    style="background-color:${color}"
                  ></button>
                `).join('')}
              </div>
              <div class="flex gap-2">
                <button type="button" data-action="tag-save" class="flex-1 px-3 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] rounded text-sm transition-colors">追加</button>
                <button type="button" data-action="tag-cancel" class="flex-1 px-3 py-1.5 bg-[#333] hover:bg-[#3a3a3a] rounded text-sm transition-colors">キャンセル</button>
              </div>
            </div>

            <button type="button" data-action="add-tag" ${captureDisabled} class="${captureBtnClass}">
              ${svgIcon('tag', 16)}Add Tag
            </button>
          </div>

          <div class="p-3 border-b border-[#3a3a3a]">
            <h3 class="text-sm font-semibold mb-2">Tactical Board</h3>

            <div data-role="formation-selector" class="space-y-2 hidden">
              <select
                data-role="formation-select"
                class="w-full px-2 py-1 bg-[#333] text-white border border-[#3a3a3a] rounded text-sm"
              >
                ${Object.keys(FORMATIONS).map((formation) => `
                  <option value="${formation}">${formation}</option>
                `).join('')}
              </select>
              <div class="flex gap-2">
                <button type="button" data-action="formation-create" class="flex-1 px-3 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] rounded text-sm transition-colors">Create Board</button>
                <button type="button" data-action="formation-cancel" class="flex-1 px-3 py-1.5 bg-[#333] hover:bg-[#3a3a3a] rounded text-sm transition-colors">Cancel</button>
              </div>
            </div>

            <button type="button" data-action="add-tactical-board" ${captureDisabled} class="${captureBtnClass}">
              ${svgIcon('target', 16)}Add Tactical Board
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-2">
            <div class="space-y-2" data-role="tags"></div>
          </div>

          <div class="flex-1 overflow-y-auto p-2" data-role="snapshots-container">
            <div class="space-y-2" data-role="snapshots"></div>
          </div>

          <div class="p-3 border-t border-[#3a3a3a]">
            <h3 class="text-xs font-semibold mb-2 text-gray-300">Playback Speed</h3>
            <div class="grid grid-cols-2 gap-1" data-role="speed-buttons">
              ${[0.25, 0.5, 1, 2].map((rate) => `<button type="button" data-rate="${rate}" class="px-2 py-1 rounded text-xs transition-colors bg-[#333] hover:bg-[#3a3a3a]">${rate}x</button>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#1e1e1e] border-t border-[#3a3a3a] p-3">
        <div class="max-w-full mx-auto">
          <div class="flex items-center gap-2 mb-2">
            <button type="button" data-action="set-start" class="px-3 py-1 bg-[#333] hover:bg-[#3a3a3a] rounded text-xs transition-colors">Set Start</button>
            <button type="button" data-action="set-end" class="px-3 py-1 bg-[#333] hover:bg-[#3a3a3a] rounded text-xs transition-colors">Set End</button>
            <div data-role="range-label" class="text-xs text-gray-400 hidden"></div>
            <button type="button" data-action="clear-range" class="px-3 py-1 bg-[#ff4444] hover:bg-[#cc3333] rounded text-xs transition-colors hidden">Clear</button>
          </div>

          <div class="mb-2">
            <div data-role="seekbar" class="relative h-2 bg-[#333] rounded-full cursor-pointer overflow-hidden">
              <div data-role="range-highlight" class="absolute h-full bg-[#0078d4] opacity-30 hidden"></div>
              <div data-role="progress" class="absolute h-full bg-[#0078d4]" style="width:0%"></div>
              <div data-role="marker-start" class="absolute h-full w-1 bg-green-500 hidden"></div>
              <div data-role="marker-end" class="absolute h-full w-1 bg-red-500 hidden"></div>
              <div data-role="snapshot-markers" class="absolute inset-0 pointer-events-none"></div>
              <div data-role="tag-markers" class="absolute inset-0 pointer-events-none"></div>
            </div>
          </div>

          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <button type="button" data-action="step-prev" class="p-2 hover:bg-[#3a3a3a] rounded transition-colors" title="Previous Frame">${svgIcon('skipBack', 18)}</button>
              <button type="button" data-action="toggle-play" class="relative z-50 p-2.5 bg-[#0078d4] hover:bg-[#106ebe] rounded-full transition-colors pointer-events-auto" title="Play/Pause">
                <span data-role="play-icon" class="pointer-events-none">${svgIcon('play', 18)}</span>
              </button>
              <button type="button" data-action="step-next" class="p-2 hover:bg-[#3a3a3a] rounded transition-colors" title="Next Frame">${svgIcon('skipForward', 18)}</button>
            </div>

            <div class="text-sm text-gray-300 font-mono" data-role="time-label"></div>

            <div class="flex items-center gap-2">
              <button type="button" data-action="zoom-out" class="p-2 hover:bg-[#3a3a3a] rounded transition-colors" title="Zoom Out">${svgIcon('zoomOut', 18)}</button>
              <span class="text-sm text-gray-300 w-12 text-center" data-role="zoom-label"></span>
              <button type="button" data-action="zoom-in" class="p-2 hover:bg-[#3a3a3a] rounded transition-colors" title="Zoom In">${svgIcon('zoomIn', 18)}</button>
            </div>
          </div>
        </div>
      </div>

      <div data-role="context-menu" class="fixed bg-[#333] border border-[#555] rounded shadow-lg py-1 z-50 hidden">
        <button type="button" data-action="delete-drawing" class="w-full px-4 py-2 text-left hover:bg-[#444] text-white text-sm">削除</button>
      </div>
    </div>
  `;

    const qs = (selector) => root.querySelector(selector);
    const qsa = (selector) => Array.from(root.querySelectorAll(selector));

    const status = qs('[data-role="status"]');
    const videoStatus = qs('[data-role="video-status"]');
    const video = qs('[data-role="video"]');
    const canvas = qs('[data-role="canvas"]');
    const stage = qs('[data-role="stage"]');
    const boardWrap = qs('[data-role="board-wrap"]');
    const noteLayer = qs('[data-role="note-layer"]');
    const mediaWrap = qs('[data-role="media-wrap"]');
    const zoomWrap = mediaWrap;
    const drawingOptions = qs('[data-role="drawing-options"]');
    const toolButtons = qsa('[data-tool]');
    const clearAll = qs('[data-action="clear-all"]');
    const openVideo = qs('[data-action="open-video"]');
    const share = qs('[data-action="share"]');
    const fileInput = qs('[data-role="file-input"]');
    const save = qs('[data-action="save"]');
    const colorButtons = qsa('[data-color]');
    const lineWidth = qs('[data-role="line-width"]');
    const lineWidthLabel = qs('[data-role="line-width-label"]');
    const fontSize = qs('[data-role="font-size"]');
    const fontSizeLabel = qs('[data-role="font-size-label"]');
    const autonumberBox = qs('[data-role="autonumber-box"]');
    const autonumberCount = qs('[data-role="autonumber-count"]');
    const autonumberReset = qs('[data-action="autonumber-reset"]');
    const poseOptions = qs('[data-role="pose-options"]');
    const trajectoryPoint = qs('[data-role="trajectory-point"]');
    const showSkeleton = qs('[data-role="show-skeleton"]');
    const showTrajectory = qs('[data-role="show-trajectory"]');
    const memoInput = qs('[data-role="memo-input"]');
    const memoText = qs('[data-role="memo-text"]');
    const memoSave = qs('[data-action="memo-save"]');
    const memoCancel = qs('[data-action="memo-cancel"]');
    const capture = qs('[data-action="capture"]');
    const tagInput = qs('[data-role="tag-input"]');
    const tagName = qs('[data-role="tag-name"]');
    const tagSave = qs('[data-action="tag-save"]');
    const tagCancel = qs('[data-action="tag-cancel"]');
    const addTag = qs('[data-action="add-tag"]');
    const tags = qs('[data-role="tags"]');
    const tagColorButtons = qsa('[data-tag-color]');
    const formationSelector = qs('[data-role="formation-selector"]');
    const formationSelect = qs('[data-role="formation-select"]');
    const addTacticalBoard = qs('[data-action="add-tactical-board"]');
    const formationCreate = qs('[data-action="formation-create"]');
    const formationCancel = qs('[data-action="formation-cancel"]');
    const snapshotsContainer = qs('[data-role="snapshots-container"]');
    const snapshots = qs('[data-role="snapshots"]');
    const speedButtons = qsa('[data-rate]');
    const setStart = qs('[data-action="set-start"]');
    const setEnd = qs('[data-action="set-end"]');
    const clearRange = qs('[data-action="clear-range"]');
    const rangeLabel = qs('[data-role="range-label"]');
    const seekbar = qs('[data-role="seekbar"]');
    const rangeHighlight = qs('[data-role="range-highlight"]');
    const progress = qs('[data-role="progress"]');
    const markerStart = qs('[data-role="marker-start"]');
    const markerEnd = qs('[data-role="marker-end"]');
    const snapshotMarkers = qs('[data-role="snapshot-markers"]');
    const tagMarkers = qs('[data-role="tag-markers"]');
    const stepPrev = qs('[data-action="step-prev"]');
    const stepNext = qs('[data-action="step-next"]');
    const togglePlay = qs('[data-action="toggle-play"]');
    const playIcon = qs('[data-role="play-icon"]');
    const timeLabel = qs('[data-role="time-label"]');
    const zoomOut = qs('[data-action="zoom-out"]');
    const zoomIn = qs('[data-action="zoom-in"]');
    const zoomLabel = qs('[data-role="zoom-label"]');
    const contextMenu = qs('[data-role="context-menu"]');
    const deleteDrawing = qs('[data-action="delete-drawing"]');
    const textInput = qs('[data-role="text-input"]');
    const textInputField = qs('[data-role="text-input-field"]');
    const textOk = qs('[data-action="text-ok"]');

    if (
        !status ||
        !videoStatus ||
        !video ||
        !canvas ||
        !stage ||
        !boardWrap ||
        !noteLayer ||
        !zoomWrap ||
        !mediaWrap ||
        !drawingOptions ||
        !clearAll ||
        !openVideo ||
        !fileInput ||
        !lineWidth ||
        !lineWidthLabel ||
        !fontSize ||
        !fontSizeLabel ||
        !autonumberBox ||
        !autonumberCount ||
        !autonumberReset ||
        !memoInput ||
        !memoText ||
        !memoSave ||
        !memoCancel ||
        !capture ||
        !tagInput ||
        !tagName ||
        !tagSave ||
        !tagCancel ||
        !addTag ||
        !tags ||
        !snapshotsContainer ||
        !snapshots ||
        !setStart ||
        !setEnd ||
        !clearRange ||
        !rangeLabel ||
        !seekbar ||
        !rangeHighlight ||
        !progress ||
        !markerStart ||
        !markerEnd ||
        !stepPrev ||
        !stepNext ||
        !togglePlay ||
        !playIcon ||
        !timeLabel ||
        !zoomOut ||
        !zoomIn ||
        !zoomLabel ||
        !contextMenu ||
        !deleteDrawing ||
        !textInput ||
        !textInputField ||
        !textOk
    ) {
        throw new Error('Video analysis UI failed to render');
    }

    return {
        status,
        videoStatus,
        video,
        canvas,
        stage,
        boardWrap,
        noteLayer,
        zoomWrap,
        mediaWrap,
        drawingOptions,
        toolButtons,
        clearAll,
        openVideo,
        share,
        fileInput,
        save,
        colorButtons,
        lineWidth,
        lineWidthLabel,
        fontSize,
        fontSizeLabel,
        autonumberBox,
        autonumberCount,
        autonumberReset,
        memoInput,
        memoText,
        memoSave,
        memoCancel,
        poseOptions,
        trajectoryPoint,
        showSkeleton,
        showTrajectory,
        capture,
        tagInput,
        tagName,
        tagSave,
        tagCancel,
        addTag,
        tags,
        tagColorButtons,
        formationSelector,
        formationSelect,
        addTacticalBoard,
        formationCreate,
        formationCancel,
        snapshots,
        snapshotsContainer,
        speedButtons,
        setStart,
        setEnd,
        clearRange,
        rangeLabel,
        seekbar,
        rangeHighlight,
        progress,
        markerStart,
        markerEnd,
        snapshotMarkers,
        tagMarkers,
        stepPrev,
        stepNext,
        togglePlay,
        playIcon,
        timeLabel,
        zoomOut,
        zoomIn,
        zoomLabel,
        contextMenu,
        deleteDrawing,
        textInput,
        textInputField,
        textOk,
    };
}

export { buildUi };
