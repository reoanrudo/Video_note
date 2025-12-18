function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatTime(time) {
    const safeTime = Number.isFinite(time) ? time : 0;
    const minutes = Math.floor(safeTime / 60);
    const seconds = Math.floor(safeTime % 60);
    const frames = Math.floor((safeTime % 1) * 30);

    return `${minutes}:${seconds.toString().padStart(2, '0')}.${frames
        .toString()
        .padStart(2, '0')}`;
}

function parseJsonScript(scriptId) {
    const el = document.getElementById(scriptId);
    if (!el) return null;

    try {
        return JSON.parse(el.textContent || 'null');
    } catch {
        return null;
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('`', '&#096;');
}

async function postJson(url, payload) {
    const csrf = getCsrfToken();

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
            Accept: 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}

function svgIcon(name, size = 18) {
    const icons = {
        play: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
        pause: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
        skipBack: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>`,
        skipForward: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>`,
        zoomIn: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
        zoomOut: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
        save: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
        download: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
        move: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`,
        type: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
        hash: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
        minus: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
        activity: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
        trendingUp: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>`,
        square: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
        circle: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>`,
        pencil: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7 21H3v-4L17 3z"/></svg>`,
        plus: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        ruler: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 8.7L8.7 21.3a2.1 2.1 0 0 1-3 0L2.7 18.3a2.1 2.1 0 0 1 0-3L15.3 2.7a2.1 2.1 0 0 1 3 0l3 3a2.1 2.1 0 0 1 0 3z"/><path d="M7 17l2 2"/><path d="M11 13l2 2"/><path d="M15 9l2 2"/><path d="M19 5l2 2"/></svg>`,
        chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
        grid: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
        note: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M7 8h10"/><path d="M7 12h7"/></svg>`,
        folderOpen: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h5l2 2h7a2 2 0 0 1 2 2v2H4V5a2 2 0 0 1 2-2z"/><path d="M4 9h20l-2 10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>`,
    };

    return icons[name] ?? '';
}

const DRAW_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#FFA500'];

const TOOL_DEFS = [
    { id: 'move', icon: 'move', label: 'Move / Edit' },
    { separator: true },
    { id: 'text', icon: 'type', label: 'Text' },
    { id: 'note', icon: 'note', label: 'Note' },
    { id: 'autonumber', icon: 'hash', label: 'Auto Number' },
    { separator: true },
    { id: 'line', icon: 'minus', label: 'Line' },
    { id: 'arrow', icon: 'arrowRight', label: 'Arrow' },
    { id: 'arrow-dash', icon: 'arrowRight', label: 'Arrow Dash', badge: '- -' },
    { id: 'arrow-curve', icon: 'trendingUp', label: 'Arrow Curve' },
    { id: 'polyline', icon: 'activity', label: 'Polyline' },
    { separator: true },
    { id: 'rectangle', icon: 'square', label: 'Rectangle' },
    { id: 'circle', icon: 'circle', label: 'Circle' },
    { id: 'freehand', icon: 'pencil', label: 'Freehand' },
    { id: 'crosshair', icon: 'plus', label: 'Crosshair' },
    { separator: true },
    { id: 'angle', icon: 'chevronRight', label: 'Angle' },
    { id: 'angle-vertical', icon: 'chevronRight', label: 'Angle to Vertical', badge: '↕' },
    { id: 'angle-horizontal', icon: 'chevronRight', label: 'Angle to Horizontal', badge: '↔' },
    { id: 'ruler', icon: 'ruler', label: 'Distance' },
    { separator: true },
    { id: 'grid', icon: 'grid', label: 'Grid' },
];

function buildUi(root, { readOnly, projectName, dashboardUrl }) {
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
    <div class="h-full bg-[#2a2a2a] text-white flex flex-col">
      <div class="bg-[#1e1e1e] border-b border-[#3a3a3a] px-3 py-2 flex items-center gap-4">
        ${dashboardButton}
        ${title}
        ${openButton}
        ${saveButton}
        <input data-role="file-input" type="file" accept="video/*" class="hidden" />
        <div class="ml-auto flex items-center gap-4 text-sm text-gray-400">
          <span data-role="status"></span>
          <span data-role="video-status"></span>
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
                    <video data-role="video" class="max-w-full max-h-full" style="display:block;max-height:calc(100vh - 140px)" playsinline></video>
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

            <div class="flex items-center gap-2 hidden" data-role="autonumber-box">
              <span class="text-sm text-gray-300">Next number:</span>
              <span class="text-sm font-bold text-white" data-role="autonumber-count"></span>
              <button type="button" data-action="autonumber-reset" class="px-2 py-1 bg-[#333] hover:bg-[#3a3a3a] rounded text-xs">Reset</button>
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

          <div class="flex-1 overflow-y-auto p-2">
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
            </div>
          </div>

          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <button type="button" data-action="step-prev" class="p-2 hover:bg-[#3a3a3a] rounded transition-colors" title="Previous Frame">${svgIcon('skipBack', 18)}</button>
              <button type="button" data-action="toggle-play" class="p-2.5 bg-[#0078d4] hover:bg-[#106ebe] rounded-full transition-colors" title="Play/Pause">
                <span data-role="play-icon">${svgIcon('play', 18)}</span>
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
    const fileInput = qs('[data-role="file-input"]');
    const save = qs('[data-action="save"]');
    const colorButtons = qsa('[data-color]');
    const lineWidth = qs('[data-role="line-width"]');
    const lineWidthLabel = qs('[data-role="line-width-label"]');
    const autonumberBox = qs('[data-role="autonumber-box"]');
    const autonumberCount = qs('[data-role="autonumber-count"]');
    const autonumberReset = qs('[data-action="autonumber-reset"]');
    const memoInput = qs('[data-role="memo-input"]');
    const memoText = qs('[data-role="memo-text"]');
    const memoSave = qs('[data-action="memo-save"]');
    const memoCancel = qs('[data-action="memo-cancel"]');
    const capture = qs('[data-action="capture"]');
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
        !autonumberBox ||
        !autonumberCount ||
        !autonumberReset ||
        !memoInput ||
        !memoText ||
        !memoSave ||
        !memoCancel ||
        !capture ||
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
        fileInput,
        save,
        colorButtons,
        lineWidth,
        lineWidthLabel,
        autonumberBox,
        autonumberCount,
        autonumberReset,
        memoInput,
        memoText,
        memoSave,
        memoCancel,
        capture,
        snapshots,
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

function renderDrawings(canvas, drawings, currentDrawing, currentTime, selectedDrawingIndex = null, zoom = 1) {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const effectiveZoom = Number.isFinite(zoom) ? clamp(zoom, 0.5, 4) : 1;
    const cx = cssWidth / 2;
    const cy = cssHeight / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(effectiveZoom, effectiveZoom);
    ctx.translate(-cx, -cy);

    [...drawings, currentDrawing]
        .filter((d) => d && Math.abs(d.time - currentTime) <= 2)
        .forEach((drawing, index) => {
            const timeDiff = Math.abs(drawing.time - currentTime);
            let opacity = 1;
            if (timeDiff > 1.5) {
                opacity = 1 - (timeDiff - 1.5) / 0.5;
            }

            ctx.globalAlpha = opacity;
            ctx.strokeStyle = drawing.color || '#FF0000';
            ctx.fillStyle = drawing.color || '#FF0000';
            ctx.lineWidth = drawing.lineWidth || 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (drawing.tool === 'line') {
                drawLine(ctx, drawing);
            } else if (drawing.tool === 'arrow') {
                drawArrow(ctx, drawing);
            } else if (drawing.tool === 'arrow-dash') {
                drawDashedArrow(ctx, drawing);
            } else if (drawing.tool === 'arrow-curve') {
                drawCurvedArrow(ctx, drawing);
            } else if (drawing.tool === 'polyline' && drawing.points) {
                drawPolyline(ctx, drawing);
            } else if (drawing.tool === 'polyline-arrow' && drawing.points) {
                drawPolylineArrow(ctx, drawing);
            } else if (drawing.tool === 'circle') {
                drawCircle(ctx, drawing);
            } else if (drawing.tool === 'rectangle') {
                drawRectangle(ctx, drawing);
            } else if (drawing.tool === 'freehand' && drawing.points) {
                drawFreehand(ctx, drawing);
            } else if (drawing.tool === 'angle') {
                drawAngle(ctx, drawing);
            } else if (drawing.tool === 'angle-vertical') {
                drawAngleVertical(ctx, drawing);
            } else if (drawing.tool === 'angle-horizontal') {
                drawAngleHorizontal(ctx, drawing);
            } else if (drawing.tool === 'ruler') {
                drawRuler(ctx, drawing);
            } else if (drawing.tool === 'crosshair') {
                drawCrosshair(ctx, drawing);
            } else if (drawing.tool === 'autonumber') {
                drawAutoNumber(ctx, drawing);
            } else if (drawing.tool === 'text') {
                drawText(ctx, drawing);
            } else if (drawing.tool === 'note') {
                drawNote(ctx, drawing);
            } else if (drawing.tool === 'grid') {
                drawGrid(ctx, drawing);
            }

            const isSelected =
                selectedDrawingIndex !== null &&
                index === selectedDrawingIndex &&
                drawing !== currentDrawing;
            if (isSelected) {
                ctx.globalAlpha = 1;
                drawControlPoints(ctx, drawing);
            }
        });

    ctx.restore();
    ctx.globalAlpha = 1.0;
}

function drawControlPoints(ctx, drawing) {
    ctx.fillStyle = '#00FF00';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    const drawPoint = (x, y) => {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    };

    if (
        drawing.tool === 'line' ||
        drawing.tool === 'arrow' ||
        drawing.tool === 'arrow-dash' ||
        drawing.tool === 'arrow-curve' ||
        drawing.tool === 'angle' ||
        drawing.tool === 'angle-vertical' ||
        drawing.tool === 'angle-horizontal' ||
        drawing.tool === 'ruler'
    ) {
        drawPoint(drawing.startX, drawing.startY);
        drawPoint(drawing.endX, drawing.endY);
    } else if (drawing.tool === 'circle') {
        drawPoint(drawing.startX, drawing.startY);
        drawPoint(drawing.endX, drawing.endY);
    } else if (drawing.tool === 'rectangle') {
        drawPoint(drawing.startX, drawing.startY);
        drawPoint(drawing.endX, drawing.endY);
        drawPoint(drawing.endX, drawing.startY);
        drawPoint(drawing.startX, drawing.endY);
    } else if (
        drawing.tool === 'freehand' ||
        drawing.tool === 'polyline' ||
        drawing.tool === 'polyline-arrow'
    ) {
        drawing.points.forEach((p) => drawPoint(p.x, p.y));
    } else if (
        drawing.tool === 'crosshair' ||
        drawing.tool === 'autonumber' ||
        drawing.tool === 'text' ||
        drawing.tool === 'note'
    ) {
        drawPoint(drawing.x, drawing.y);
    }
}

function drawLine(ctx, drawing) {
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.lineTo(drawing.endX, drawing.endY);
    ctx.stroke();
}

function drawArrow(ctx, drawing) {
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.lineTo(drawing.endX, drawing.endY);
    ctx.stroke();

    drawArrowHead(ctx, drawing.startX, drawing.startY, drawing.endX, drawing.endY);
}

function drawArrowHead(ctx, startX, startY, endX, endY) {
    const angle = Math.atan2(endY - startY, endX - startX);
    const headLength = 15;

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function drawDashedArrow(ctx, drawing) {
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.lineTo(drawing.endX, drawing.endY);
    ctx.stroke();
    ctx.setLineDash([]);

    drawArrowHead(ctx, drawing.startX, drawing.startY, drawing.endX, drawing.endY);
}

function drawCurvedArrow(ctx, drawing) {
    const midX = (drawing.startX + drawing.endX) / 2;
    const midY = (drawing.startY + drawing.endY) / 2;
    const offset = 30;
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.quadraticCurveTo(midX + offset, midY - offset, drawing.endX, drawing.endY);
    ctx.stroke();

    const angle = Math.atan2(drawing.endY - midY, drawing.endX - midX);
    const headLength = 15;
    ctx.beginPath();
    ctx.moveTo(drawing.endX, drawing.endY);
    ctx.lineTo(
        drawing.endX - headLength * Math.cos(angle - Math.PI / 6),
        drawing.endY - headLength * Math.sin(angle - Math.PI / 6),
    );
    ctx.moveTo(drawing.endX, drawing.endY);
    ctx.lineTo(
        drawing.endX - headLength * Math.cos(angle + Math.PI / 6),
        drawing.endY - headLength * Math.sin(angle + Math.PI / 6),
    );
    ctx.stroke();
}

function drawPolyline(ctx, drawing) {
    if (drawing.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
    for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
    }
    ctx.stroke();
}

function drawPolylineArrow(ctx, drawing) {
    if (drawing.points.length < 2) return;
    drawPolyline(ctx, drawing);

    const lastPoint = drawing.points[drawing.points.length - 1];
    const secondLastPoint = drawing.points[drawing.points.length - 2];
    const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
    const headLength = 15;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(
        lastPoint.x - headLength * Math.cos(angle - Math.PI / 6),
        lastPoint.y - headLength * Math.sin(angle - Math.PI / 6),
    );
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(
        lastPoint.x - headLength * Math.cos(angle + Math.PI / 6),
        lastPoint.y - headLength * Math.sin(angle + Math.PI / 6),
    );
    ctx.stroke();
}

function drawCircle(ctx, drawing) {
    const radius = Math.sqrt(
        Math.pow(drawing.endX - drawing.startX, 2) + Math.pow(drawing.endY - drawing.startY, 2),
    );
    ctx.beginPath();
    ctx.arc(drawing.startX, drawing.startY, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawRectangle(ctx, drawing) {
    const width = drawing.endX - drawing.startX;
    const height = drawing.endY - drawing.startY;
    ctx.beginPath();
    ctx.rect(drawing.startX, drawing.startY, width, height);
    ctx.stroke();
}

function drawFreehand(ctx, drawing) {
    if (!drawing.points?.length) return;
    ctx.beginPath();
    ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
    for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
    }
    ctx.stroke();
}

function drawAngle(ctx, drawing) {
    const dx = drawing.endX - drawing.startX;
    const dy = drawing.endY - drawing.startY;
    const angle = Math.atan2(dy, dx);
    const degrees = ((angle * 180) / Math.PI).toFixed(1);

    ctx.save();
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const verticalLength = 200;
    ctx.moveTo(drawing.startX, drawing.startY - verticalLength);
    ctx.lineTo(drawing.startX, drawing.startY + verticalLength);
    ctx.stroke();

    ctx.beginPath();
    const horizontalLength = 200;
    ctx.moveTo(drawing.startX - horizontalLength, drawing.startY);
    ctx.lineTo(drawing.startX + horizontalLength, drawing.startY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = drawing.lineWidth || 3;
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.lineTo(drawing.endX, drawing.endY);
    ctx.stroke();

    const arcRadius = 80;
    ctx.fillStyle = (drawing.color || '#00FFFF') + '80';
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.arc(drawing.startX, drawing.startY, arcRadius, 0, angle, dy < 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drawing.startX, drawing.startY, arcRadius, 0, angle, dy < 0);
    ctx.stroke();

    ctx.font = 'bold 8px Arial';
    const text = `${Math.abs(parseFloat(degrees)).toFixed(1)}°`;
    const textWidth = ctx.measureText(text).width;
    const textAngle = angle / 2;
    const textRadius = arcRadius * 0.6;
    const textX = drawing.startX + Math.cos(textAngle) * textRadius;
    const textY = drawing.startY + Math.sin(textAngle) * textRadius;

    ctx.fillStyle = drawing.color || '#00FFFF';
    const padding = 4;
    ctx.fillRect(textX - textWidth / 2 - padding, textY - 6 - padding, textWidth + padding * 2, 12 + padding * 2);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, textX, textY);

    ctx.restore();
}

function drawAngleVertical(ctx, drawing) {
    const dx = drawing.endX - drawing.startX;
    const dy = drawing.endY - drawing.startY;
    const angle = Math.atan2(dy, dx);
    const verticalAngle = Math.abs(90 - Math.abs((angle * 180) / Math.PI));

    ctx.save();
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const verticalLength = 200;
    ctx.moveTo(drawing.startX, drawing.startY - verticalLength);
    ctx.lineTo(drawing.startX, drawing.startY + verticalLength);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = drawing.lineWidth || 3;
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.lineTo(drawing.endX, drawing.endY);
    ctx.stroke();

    const arcRadius = 80;
    ctx.fillStyle = (drawing.color || '#00FFFF') + '80';
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.arc(drawing.startX, drawing.startY, arcRadius, -Math.PI / 2, angle, dy > 0 && dx > 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drawing.startX, drawing.startY, arcRadius, -Math.PI / 2, angle, dy > 0 && dx > 0);
    ctx.stroke();

    ctx.font = 'bold 8px Arial';
    const text = `${verticalAngle.toFixed(1)}°`;
    const textWidth = ctx.measureText(text).width;
    const textAngle = (-Math.PI / 2 + angle) / 2;
    const textRadius = arcRadius * 0.6;
    const textX = drawing.startX + Math.cos(textAngle) * textRadius;
    const textY = drawing.startY + Math.sin(textAngle) * textRadius;

    ctx.fillStyle = drawing.color || '#00FFFF';
    const padding = 4;
    ctx.fillRect(textX - textWidth / 2 - padding, textY - 6 - padding, textWidth + padding * 2, 12 + padding * 2);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, textX, textY);

    ctx.restore();
}

function drawAngleHorizontal(ctx, drawing) {
    const dx = drawing.endX - drawing.startX;
    const dy = drawing.endY - drawing.startY;
    const angle = Math.atan2(dy, dx);
    const degrees = ((angle * 180) / Math.PI).toFixed(1);

    ctx.save();
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const horizontalLength = 200;
    ctx.moveTo(drawing.startX - horizontalLength, drawing.startY);
    ctx.lineTo(drawing.startX + horizontalLength, drawing.startY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = drawing.lineWidth || 3;
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.lineTo(drawing.endX, drawing.endY);
    ctx.stroke();

    const arcRadius = 80;
    ctx.fillStyle = (drawing.color || '#00FFFF') + '80';
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.arc(drawing.startX, drawing.startY, arcRadius, 0, angle, dy < 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drawing.startX, drawing.startY, arcRadius, 0, angle, dy < 0);
    ctx.stroke();

    ctx.font = 'bold 8px Arial';
    const text = `${Math.abs(parseFloat(degrees)).toFixed(1)}°`;
    const textWidth = ctx.measureText(text).width;
    const textAngle = angle / 2;
    const textRadius = arcRadius * 0.6;
    const textX = drawing.startX + Math.cos(textAngle) * textRadius;
    const textY = drawing.startY + Math.sin(textAngle) * textRadius;

    ctx.fillStyle = drawing.color || '#00FFFF';
    const padding = 4;
    ctx.fillRect(textX - textWidth / 2 - padding, textY - 6 - padding, textWidth + padding * 2, 12 + padding * 2);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, textX, textY);

    ctx.restore();
}

function drawRuler(ctx, drawing) {
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.lineTo(drawing.endX, drawing.endY);
    ctx.stroke();

    const distance = Math.sqrt(
        Math.pow(drawing.endX - drawing.startX, 2) + Math.pow(drawing.endY - drawing.startY, 2),
    ).toFixed(0);
    ctx.font = '14px Arial';
    const midX = (drawing.startX + drawing.endX) / 2;
    const midY = (drawing.startY + drawing.endY) / 2;
    ctx.fillText(`${distance}px`, midX + 10, midY - 10);
}

function drawCrosshair(ctx, drawing) {
    const size = 20;
    ctx.beginPath();
    ctx.moveTo(drawing.x - size, drawing.y);
    ctx.lineTo(drawing.x + size, drawing.y);
    ctx.moveTo(drawing.x, drawing.y - size);
    ctx.lineTo(drawing.x, drawing.y + size);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(drawing.x, drawing.y, 3, 0, 2 * Math.PI);
    ctx.fill();
}

function drawAutoNumber(ctx, drawing) {
    ctx.font = 'bold 20px Arial';
    ctx.beginPath();
    ctx.arc(drawing.x, drawing.y, 18, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(drawing.number.toString(), drawing.x, drawing.y);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function drawText(ctx, drawing) {
    const text = drawing.text;
    const bgColor = drawing.backgroundColor || '#4a4a4a';

    ctx.font = '16px Arial';
    const metrics = ctx.measureText(text);
    const padding = 4;

    ctx.fillStyle = bgColor;
    ctx.fillRect(
        drawing.x - padding,
        drawing.y - 16 - padding,
        metrics.width + padding * 2,
        20 + padding * 2,
    );

    ctx.fillStyle = drawing.color || '#FFFFFF';
    ctx.fillText(text, drawing.x, drawing.y);
}

function wrapTextLines(ctx, text, maxWidth) {
    const safeText = String(text ?? '').trim();
    if (safeText === '') {
        return [''];
    }

    const words = safeText.split(/\s+/);
    const lines = [];
    let line = '';

    for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width <= maxWidth) {
            line = testLine;
            continue;
        }

        if (line) {
            lines.push(line);
            line = word;
            continue;
        }

        let chunk = '';
        for (const char of word) {
            const testChunk = chunk + char;
            if (ctx.measureText(testChunk).width <= maxWidth) {
                chunk = testChunk;
                continue;
            }
            if (chunk) {
                lines.push(chunk);
            }
            chunk = char;
        }
        line = chunk;
    }

    if (line) {
        lines.push(line);
    }

    return lines.slice(0, 6);
}

function drawNote(ctx, drawing) {
    const text = String(drawing.text ?? '').trim();
    if (text === '') return;

    const bgColor = drawing.backgroundColor || 'rgba(20,20,20,0.78)';
    const borderColor = drawing.borderColor || 'rgba(255,255,255,0.38)';
    const textColor = drawing.color || '#FFFFFF';

    const paddingX = 10;
    const paddingY = 8;
    const lineHeight = 18;
    const maxWidth = clamp(Number(drawing.maxWidth ?? 280), 140, 420);
    const radius = 10;

    ctx.font = '14px Arial';

    const lines = wrapTextLines(ctx, text, maxWidth);
    const lineWidths = lines.map((l) => ctx.measureText(l).width);
    const contentWidth = Math.max(80, ...lineWidths);
    const contentHeight = lines.length * lineHeight;

    const bubbleWidth = contentWidth + paddingX * 2;
    const bubbleHeight = contentHeight + paddingY * 2;

    const x = Number(drawing.x || 0);
    const y = Number(drawing.y || 0);

    const tailWidth = 14;
    const tailHeight = 10;
    const tailX = x + 24;
    const tailY = y + bubbleHeight;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + bubbleWidth - radius, y);
    ctx.quadraticCurveTo(x + bubbleWidth, y, x + bubbleWidth, y + radius);
    ctx.lineTo(x + bubbleWidth, y + bubbleHeight - radius);
    ctx.quadraticCurveTo(x + bubbleWidth, y + bubbleHeight, x + bubbleWidth - radius, y + bubbleHeight);
    ctx.lineTo(x + radius, y + bubbleHeight);
    ctx.quadraticCurveTo(x, y + bubbleHeight, x, y + bubbleHeight - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fillStyle = bgColor;
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tailX + tailWidth, tailY);
    ctx.lineTo(tailX + tailWidth / 2, tailY + tailHeight);
    ctx.closePath();

    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    lines.forEach((line, idx) => {
        ctx.fillText(line, x + paddingX, y + paddingY + idx * lineHeight);
    });
    ctx.textBaseline = 'alphabetic';
}

function drawGrid(ctx, drawing) {
    const gridSize = 50;
    const width = Math.abs(drawing.endX - drawing.startX);
    const height = Math.abs(drawing.endY - drawing.startY);
    const startX = Math.min(drawing.startX, drawing.endX);
    const startY = Math.min(drawing.startY, drawing.endY);

    ctx.strokeStyle = drawing.color || '#FF0000';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let x = startX; x <= startX + width; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + height);
    }
    for (let y = startY; y <= startY + height; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + width, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
}

function initVideoAnalysis() {
    const root = document.getElementById('video-analysis');
    if (!root) return;
    const existingController = root._videoAnalysisAbortController;
    const hasRenderedUi =
        root.querySelector('[data-role="canvas"]') &&
        root.querySelector('[data-tool]') &&
        root.querySelector('[data-action="capture"]');

    if (existingController && !existingController.signal.aborted && hasRenderedUi) {
        return;
    }

    if (existingController && !existingController.signal.aborted) {
        existingController.abort();
    }

    const abortController = new AbortController();
    const { signal } = abortController;
    root._videoAnalysisAbortController = abortController;

    const readOnly = root.dataset.readOnly === '1';
    const videoSrc = root.dataset.videoSrc || '';
    const videoUploadUrl = root.dataset.videoUploadUrl || '';
    const projectName = root.dataset.projectName || '';
    const dashboardUrl = root.dataset.dashboardUrl || '';
    const shareToken = root.dataset.shareToken || '';
    const defaultZoom = Number(root.dataset.defaultZoom || '');
    const zoomBase = Number(root.dataset.zoomBase || '');
    let saveUrl = root.dataset.saveUrl || '';
    let snapshotUrl = root.dataset.snapshotUrl || '';
    const initial = parseJsonScript('video-analysis-initial') || {};

    const ui = buildUi(root, { readOnly, projectName, dashboardUrl });
    root.dataset.videoAnalysisInitialized = '1';

    const resolveZoomBase = () => {
        if (!Number.isFinite(zoomBase)) {
            return 1;
        }

        return clamp(zoomBase, 0.5, 4);
    };

    const resolvedZoomBase = resolveZoomBase();

    const resolveZoom = () => {
        if (Number.isFinite(defaultZoom)) {
            return clamp(defaultZoom, 0.5, 2);
        }

        return 1;
    };

    const state = {
        zoom: resolveZoom(),
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        playbackRate: 1,
        loopRange: null,
        selectedTool: null,
        drawings: Array.isArray(initial.drawings) ? initial.drawings : [],
        currentDrawing: null,
        drawColor: initial.settings?.color || '#FF0000',
        lineWidth: Number(initial.settings?.width || 3),
        autoNumberCount: Number(initial.settings?.autoNumber || 1),
        freehandPoints: [],
        isDrawing: false,
        selectedDrawingIndex: null,
        dragState: null,
        textPosition: { x: 0, y: 0 },
        textInsertTool: 'text',
        notePosition: { x: 0, y: 0 },
        notes: Array.isArray(initial.notes) ? initial.notes : [],
        noteDrag: null,
        frameSnapshots: Array.isArray(initial.snapshots) ? initial.snapshots : [],
        contextMenu: null,
    };

    const setStatus = (message) => {
        ui.status.textContent = message;
    };

    const withShare = (inputUrl) => {
        if (!shareToken) {
            return inputUrl;
        }

        try {
            const url = new URL(String(inputUrl), window.location.href);
            if (!url.searchParams.has('share')) {
                url.searchParams.set('share', shareToken);
            }
            return url.toString();
        } catch {
            return inputUrl;
        }
    };

    let autosaveTimer = null;
    let playPromise = null;
    let desiredPlaying = false;

    const scheduleAutosave = () => {
        if (readOnly || saveUrl === '') {
            return;
        }

        if (autosaveTimer) {
            window.clearTimeout(autosaveTimer);
        }

        autosaveTimer = window.setTimeout(() => {
            void saveAnnotations({ silent: true });
        }, 600);
    };

    const setVideoStatus = () => {
        ui.videoStatus.textContent = ui.video.currentSrc ? 'Video loaded' : 'No video loaded';
    };

    const applyZoom = () => {
        const effectiveZoom = clamp(state.zoom * resolvedZoomBase, 0.5, 4);
        ui.mediaWrap.style.transform = `scale(${effectiveZoom})`;
        ui.mediaWrap.style.transformOrigin = 'center center';
        ui.noteLayer.style.transform = `scale(${effectiveZoom})`;
        ui.noteLayer.style.transformOrigin = 'center center';
        ui.zoomLabel.textContent = `${Math.round(clamp(state.zoom, 0.5, 2) * 100)}%`;
    };

    const resizeCanvas = () => {
        const rect = ui.stage.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        ui.canvas.width = Math.max(1, Math.round(rect.width * dpr));
        ui.canvas.height = Math.max(1, Math.round(rect.height * dpr));
        ui.canvas.style.width = `${rect.width}px`;
        ui.canvas.style.height = `${rect.height}px`;
    };

    const normalizeLegacyDrawingsIfNeeded = () => {
        if (!ui.video.videoWidth || !ui.video.videoHeight) {
            return;
        }

        const stageRect = ui.stage.getBoundingClientRect();
        const videoRect = ui.video.getBoundingClientRect();

        const stageWidth = stageRect.width || 1;
        const stageHeight = stageRect.height || 1;

        const videoLeft = videoRect.left - stageRect.left;
        const videoTop = videoRect.top - stageRect.top;
        const videoWidth = videoRect.width || 1;
        const videoHeight = videoRect.height || 1;

        const videoNaturalWidth = ui.video.videoWidth || 1;
        const videoNaturalHeight = ui.video.videoHeight || 1;

        const mapPoint = (x, y) => {
            const xBoard = videoLeft + (x / videoNaturalWidth) * videoWidth;
            const yBoard = videoTop + (y / videoNaturalHeight) * videoHeight;
            return {
                x: clamp(xBoard, 0, stageWidth),
                y: clamp(yBoard, 0, stageHeight),
            };
        };

        const mapPair = (d, xKey, yKey) => {
            const mapped = mapPoint(Number(d[xKey] || 0), Number(d[yKey] || 0));
            return { ...d, [xKey]: mapped.x, [yKey]: mapped.y };
        };

        state.drawings = state.drawings.map((drawing) => {
            if (!drawing || typeof drawing !== 'object') return drawing;
            if (drawing.space === 'board') return drawing;

            const tool = drawing.tool;
            if (
                tool === 'crosshair' ||
                tool === 'autonumber' ||
                tool === 'text'
            ) {
                const mapped = mapPoint(Number(drawing.x || 0), Number(drawing.y || 0));
                return { ...drawing, x: mapped.x, y: mapped.y, space: 'board' };
            }

            if (
                tool === 'line' ||
                tool === 'arrow' ||
                tool === 'arrow-dash' ||
                tool === 'arrow-curve' ||
                tool === 'angle' ||
                tool === 'angle-vertical' ||
                tool === 'angle-horizontal' ||
                tool === 'ruler' ||
                tool === 'rectangle' ||
                tool === 'circle' ||
                tool === 'grid'
            ) {
                let next = mapPair(drawing, 'startX', 'startY');
                next = mapPair(next, 'endX', 'endY');
                if (tool === 'rectangle') {
                    // rectangle uses start/end already
                }
                return { ...next, space: 'board' };
            }

            if ((tool === 'freehand' || tool === 'polyline' || tool === 'polyline-arrow') && Array.isArray(drawing.points)) {
                const points = drawing.points.map((p) => {
                    const mapped = mapPoint(Number(p?.x || 0), Number(p?.y || 0));
                    return { x: mapped.x, y: mapped.y };
                });
                return { ...drawing, points, space: 'board' };
            }

            return { ...drawing, space: 'board' };
        });
    };

    const setNoteLayerInteractivity = () => {
        const interactive = !readOnly && (state.selectedTool === 'note' || state.selectedTool === 'move');
        ui.noteLayer.style.pointerEvents = interactive ? 'auto' : 'none';
    };

    const setPlayingIcon = () => {
        ui.playIcon.innerHTML = state.isPlaying ? svgIcon('pause', 18) : svgIcon('play', 18);
    };

    const updateDrawingOptionsUi = () => {
        ui.drawingOptions.classList.toggle('hidden', !state.selectedTool);

        ui.colorButtons.forEach((btn) => {
            const color = btn.getAttribute('data-color');
            const isActive = color === state.drawColor;
            btn.classList.toggle('border-white', isActive);
            btn.classList.toggle('scale-110', isActive);
            btn.classList.toggle('border-transparent', !isActive);
        });

        ui.lineWidth.value = String(clamp(state.lineWidth, 1, 10));
        ui.lineWidthLabel.textContent = `${clamp(state.lineWidth, 1, 10)}px`;

        const showAuto = state.selectedTool === 'autonumber';
        ui.autonumberBox.classList.toggle('hidden', !showAuto);
        ui.autonumberCount.textContent = String(state.autoNumberCount);
    };

    const updateToolbarUi = () => {
        ui.toolButtons.forEach((btn) => {
            const toolId = btn.getAttribute('data-tool');
            const isActive = toolId === state.selectedTool;
            btn.classList.toggle('bg-[#0078d4]', isActive);
            btn.classList.toggle('bg-[#333]', !isActive);
        });

        ui.canvas.style.pointerEvents = 'none';
        setNoteLayerInteractivity();
    };

    const updatePlaybackUi = () => {
        const duration = state.duration || 0;
        const currentTime = state.currentTime || 0;
        const progressPct = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;
        ui.progress.style.width = `${progressPct}%`;

        ui.timeLabel.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;

        const hasRange = !!state.loopRange;
        ui.clearRange.classList.toggle('hidden', !hasRange);
        ui.rangeLabel.classList.toggle('hidden', !hasRange);
        ui.rangeHighlight.classList.toggle('hidden', !hasRange);
        ui.markerStart.classList.toggle('hidden', !hasRange);
        ui.markerEnd.classList.toggle('hidden', !hasRange);

        if (state.loopRange && duration > 0) {
            ui.rangeLabel.textContent = `Range: ${formatTime(state.loopRange.start)} - ${formatTime(state.loopRange.end)}`;

            const left = clamp((state.loopRange.start / duration) * 100, 0, 100);
            const width = clamp(((state.loopRange.end - state.loopRange.start) / duration) * 100, 0, 100);
            ui.rangeHighlight.style.left = `${left}%`;
            ui.rangeHighlight.style.width = `${width}%`;
            ui.markerStart.style.left = `${left}%`;
            ui.markerEnd.style.left = `${clamp((state.loopRange.end / duration) * 100, 0, 100)}%`;
        }
    };

    const updateSpeedUi = () => {
        ui.speedButtons.forEach((btn) => {
            const rate = Number(btn.getAttribute('data-rate'));
            const isActive = rate === state.playbackRate;
            btn.classList.toggle('bg-[#0078d4]', isActive);
            btn.classList.toggle('bg-[#333]', !isActive);
        });
    };

    const renderSnapshots = () => {
        const snapshots = state.frameSnapshots.filter((s) => s && typeof s.time === 'number');
        if (snapshots.length === 0) {
            ui.snapshots.innerHTML = `<div class="text-xs text-gray-400">まだありません</div>`;
            return;
        }

        ui.snapshots.innerHTML = snapshots
            .map((snapshot, idx) => {
                const memoHtml = snapshot.memo
                    ? `<div class="mt-1 text-xs text-gray-300 bg-[#333] rounded p-1.5 line-clamp-3">${escapeHtml(snapshot.memo)}</div>`
                    : '';

	                return `
	          <div data-snapshot="${idx}" class="relative group cursor-pointer hover:ring-2 ring-[#0078d4] rounded bg-[#1e1e1e] p-2">
	            <img src="${escapeAttribute(withShare(snapshot.url || ''))}" alt="Frame ${idx}" class="w-full rounded" />
	            <div class="mt-1 text-xs text-center text-gray-400">${formatTime(snapshot.time)}</div>
	            ${memoHtml}
	          </div>
	        `;
	            })
	            .join('');

        ui.snapshots.querySelectorAll('[data-snapshot]').forEach((el) => {
            el.addEventListener('click', () => {
                const idx = Number(el.getAttribute('data-snapshot'));
                const snapshot = snapshots[idx];
                if (!snapshot) return;
                ui.video.currentTime = clamp(snapshot.time, 0, state.duration || snapshot.time);
            });
        });
    };

    const getMousePos = (event) => {
        const rect = ui.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = ui.canvas.width / dpr;
        const cssHeight = ui.canvas.height / dpr;
        const x = ((event.clientX - rect.left) / rect.width) * cssWidth;
        const y = ((event.clientY - rect.top) / rect.height) * cssHeight;

        const effectiveZoom = clamp(state.zoom * resolvedZoomBase, 0.5, 4);
        const cx = cssWidth / 2;
        const cy = cssHeight / 2;

        const worldX = (x - cx) / effectiveZoom + cx;
        const worldY = (y - cy) / effectiveZoom + cy;

        return {
            x: clamp(worldX, 0, cssWidth),
            y: clamp(worldY, 0, cssHeight),
        };
    };

    const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        const param = lenSq !== 0 ? dot / lenSq : -1;
        let xx;
        let yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const findDrawingAtPoint = (x, y) => {
        const threshold = 10;
        for (let i = state.drawings.length - 1; i >= 0; i--) {
            const drawing = state.drawings[i];
            if (!drawing) continue;
            if (Math.abs(drawing.time - state.currentTime) > 2) continue;

            if (
                drawing.tool === 'line' ||
                drawing.tool === 'arrow' ||
                drawing.tool === 'arrow-dash' ||
                drawing.tool === 'arrow-curve' ||
                drawing.tool === 'angle' ||
                drawing.tool === 'angle-vertical' ||
                drawing.tool === 'angle-horizontal' ||
                drawing.tool === 'ruler'
            ) {
                const dist = pointToLineDistance(
                    x,
                    y,
                    drawing.startX,
                    drawing.startY,
                    drawing.endX,
                    drawing.endY,
                );
                if (dist < threshold) return i;
            } else if (drawing.tool === 'circle') {
                const radius = Math.sqrt(
                    Math.pow(drawing.endX - drawing.startX, 2) + Math.pow(drawing.endY - drawing.startY, 2),
                );
                const distToCenter = Math.sqrt(Math.pow(x - drawing.startX, 2) + Math.pow(y - drawing.startY, 2));
                if (Math.abs(distToCenter - radius) < threshold) return i;
            } else if (drawing.tool === 'rectangle') {
                const minX = Math.min(drawing.startX, drawing.endX);
                const maxX = Math.max(drawing.startX, drawing.endX);
                const minY = Math.min(drawing.startY, drawing.endY);
                const maxY = Math.max(drawing.startY, drawing.endY);
                if (x >= minX - threshold && x <= maxX + threshold && y >= minY - threshold && y <= maxY + threshold) {
                    if (x < minX + threshold || x > maxX - threshold || y < minY + threshold || y > maxY - threshold) {
                        return i;
                    }
                }
            } else if (drawing.tool === 'freehand' || drawing.tool === 'polyline' || drawing.tool === 'polyline-arrow') {
                for (let j = 0; j < drawing.points.length - 1; j++) {
                    const dist = pointToLineDistance(
                        x,
                        y,
                        drawing.points[j].x,
                        drawing.points[j].y,
                        drawing.points[j + 1].x,
                        drawing.points[j + 1].y,
                    );
                    if (dist < threshold) return i;
                }
            } else if (drawing.tool === 'crosshair' || drawing.tool === 'autonumber') {
                const dist = Math.sqrt(Math.pow(x - drawing.x, 2) + Math.pow(y - drawing.y, 2));
                if (dist < 20) return i;
            } else if (drawing.tool === 'text') {
                const textWidth = String(drawing.text || '').length * 10;
                if (x >= drawing.x - 5 && x <= drawing.x + textWidth + 5 && y >= drawing.y - 20 && y <= drawing.y + 5) {
                    return i;
                }
            } else if (drawing.tool === 'note') {
                const approxWidth = clamp(String(drawing.text || '').length * 8 + 40, 120, 420);
                const approxHeight = clamp(Math.ceil(String(drawing.text || '').length / 28) * 18 + 34, 44, 170);
                if (
                    x >= drawing.x - 5 &&
                    x <= drawing.x + approxWidth + 5 &&
                    y >= drawing.y - 5 &&
                    y <= drawing.y + approxHeight + 15
                ) {
                    return i;
                }
            }
        }
        return -1;
    };

    const findControlPoint = (x, y, drawing) => {
        const threshold = 10;

        if (
            drawing.tool === 'line' ||
            drawing.tool === 'arrow' ||
            drawing.tool === 'arrow-dash' ||
            drawing.tool === 'arrow-curve' ||
            drawing.tool === 'angle' ||
            drawing.tool === 'angle-vertical' ||
            drawing.tool === 'angle-horizontal' ||
            drawing.tool === 'ruler'
        ) {
            if (Math.sqrt(Math.pow(x - drawing.startX, 2) + Math.pow(y - drawing.startY, 2)) < threshold) return 'start';
            if (Math.sqrt(Math.pow(x - drawing.endX, 2) + Math.pow(y - drawing.endY, 2)) < threshold) return 'end';
        } else if (drawing.tool === 'circle') {
            if (Math.sqrt(Math.pow(x - drawing.startX, 2) + Math.pow(y - drawing.startY, 2)) < threshold) return 'center';
            if (Math.sqrt(Math.pow(x - drawing.endX, 2) + Math.pow(y - drawing.endY, 2)) < threshold) return 'radius';
        } else if (drawing.tool === 'rectangle') {
            if (Math.sqrt(Math.pow(x - drawing.startX, 2) + Math.pow(y - drawing.startY, 2)) < threshold) return 'topLeft';
            if (Math.sqrt(Math.pow(x - drawing.endX, 2) + Math.pow(y - drawing.endY, 2)) < threshold) return 'bottomRight';
            if (Math.sqrt(Math.pow(x - drawing.endX, 2) + Math.pow(y - drawing.startY, 2)) < threshold) return 'topRight';
            if (Math.sqrt(Math.pow(x - drawing.startX, 2) + Math.pow(y - drawing.endY, 2)) < threshold) return 'bottomLeft';
        } else if (drawing.tool === 'freehand' || drawing.tool === 'polyline' || drawing.tool === 'polyline-arrow') {
            for (let i = 0; i < drawing.points.length; i++) {
                if (Math.sqrt(Math.pow(x - drawing.points[i].x, 2) + Math.pow(y - drawing.points[i].y, 2)) < threshold) {
                    return `point-${i}`;
                }
            }
        } else if (
            drawing.tool === 'crosshair' ||
            drawing.tool === 'autonumber' ||
            drawing.tool === 'text' ||
            drawing.tool === 'note'
        ) {
            if (Math.sqrt(Math.pow(x - drawing.x, 2) + Math.pow(y - drawing.y, 2)) < threshold) return 'position';
        }

        return null;
    };

    const clearDrawings = () => {
        state.drawings = [];
        state.autoNumberCount = 1;
        state.selectedDrawingIndex = null;
        state.currentDrawing = null;
        state.isDrawing = false;
        state.dragState = null;
        state.freehandPoints = [];
        updateDrawingOptionsUi();
        scheduleAutosave();
    };

    const finishPolyline = () => {
        if (!state.currentDrawing || (state.selectedTool !== 'polyline' && state.selectedTool !== 'polyline-arrow')) return;

        const finalPoints = state.freehandPoints;
        if (finalPoints.length > 1) {
            state.drawings = [...state.drawings, { ...state.currentDrawing, points: finalPoints }];
        }
        state.currentDrawing = null;
        state.freehandPoints = [];
        state.isDrawing = false;
        scheduleAutosave();
    };

    const deleteDrawingAt = (index) => {
        state.drawings = state.drawings.filter((_, i) => i !== index);
        state.selectedDrawingIndex = null;
        scheduleAutosave();
    };

    const startDrawing = (event) => {
        if (readOnly) return;
        if (!state.selectedTool) return;

        const pos = getMousePos(event);

        if (state.selectedTool === 'move') {
            const drawingIndex = findDrawingAtPoint(pos.x, pos.y);
            if (drawingIndex !== -1) {
                const drawing = state.drawings[drawingIndex];
                const controlPoint = findControlPoint(pos.x, pos.y, drawing);

                if (controlPoint) {
                    state.dragState = { type: 'control', index: drawingIndex, controlPoint, startX: pos.x, startY: pos.y };
                } else {
                    state.dragState = { type: 'move', index: drawingIndex, startX: pos.x, startY: pos.y, offsetX: 0, offsetY: 0 };
                }
                state.selectedDrawingIndex = drawingIndex;
            } else {
                state.selectedDrawingIndex = null;
                state.dragState = null;
            }
            return;
        }

        if (state.selectedTool === 'text' || state.selectedTool === 'note') {
            const stageRect = ui.stage.getBoundingClientRect();
            const xCss = event.clientX - stageRect.left;
            const yCss = event.clientY - stageRect.top;

            if (state.selectedTool === 'note') {
                const w = stageRect.width || 1;
                const h = stageRect.height || 1;
                state.notePosition = { x: clamp(xCss / w, 0, 1), y: clamp(yCss / h, 0, 1) };
            } else {
                state.textPosition = pos;
            }

            state.textInsertTool = state.selectedTool;

            ui.textInput.classList.remove('hidden');
            ui.textInput.style.left = `${xCss}px`;
            ui.textInput.style.top = `${yCss}px`;
            ui.textInputField.value = '';
            ui.textInputField.placeholder = state.selectedTool === 'note' ? 'Note…' : 'Enter text...';
            ui.textInputField.focus();
            return;
        }

        if (state.selectedTool === 'autonumber') {
            state.drawings = [
                ...state.drawings,
                {
                    tool: 'autonumber',
                    x: pos.x,
                    y: pos.y,
                    number: state.autoNumberCount,
                    time: state.currentTime,
                    color: state.drawColor,
                    lineWidth: state.lineWidth,
                    space: 'board',
                },
            ];
            state.autoNumberCount += 1;
            updateDrawingOptionsUi();
            scheduleAutosave();
            return;
        }

        if (state.selectedTool === 'crosshair') {
            state.drawings = [
                ...state.drawings,
                {
                    tool: 'crosshair',
                    x: pos.x,
                    y: pos.y,
                    time: state.currentTime,
                    color: state.drawColor,
                    lineWidth: state.lineWidth,
                    space: 'board',
                },
            ];
            scheduleAutosave();
            return;
        }

        if (state.selectedTool === 'polyline' || state.selectedTool === 'polyline-arrow') {
            if (state.isDrawing && state.currentDrawing) {
                const newPoints = [...state.freehandPoints, pos];
                state.freehandPoints = newPoints;
                state.currentDrawing = { ...state.currentDrawing, points: newPoints };
            } else {
                state.isDrawing = true;
                state.freehandPoints = [pos];
                state.currentDrawing = {
                    tool: state.selectedTool,
                    points: [pos],
                    time: state.currentTime,
                    color: state.drawColor,
                    lineWidth: state.lineWidth,
                    space: 'board',
                };
            }
            return;
        }

        state.isDrawing = true;

        if (state.selectedTool === 'freehand') {
            state.freehandPoints = [pos];
            state.currentDrawing = {
                tool: 'freehand',
                points: [pos],
                time: state.currentTime,
                color: state.drawColor,
                lineWidth: state.lineWidth,
                space: 'board',
            };
        } else {
            state.currentDrawing = {
                tool: state.selectedTool,
                startX: pos.x,
                startY: pos.y,
                endX: pos.x,
                endY: pos.y,
                time: state.currentTime,
                color: state.drawColor,
                lineWidth: state.lineWidth,
                space: 'board',
            };
        }
    };

    const draw = (event) => {
        const pos = getMousePos(event);

        if (state.selectedTool === 'move' && state.dragState) {
            const dx = pos.x - state.dragState.startX;
            const dy = pos.y - state.dragState.startY;

            if (state.dragState.type === 'move') {
                const updatedDrawings = [...state.drawings];
                const drawing = { ...updatedDrawings[state.dragState.index] };

                if (
                    drawing.tool === 'line' ||
                    drawing.tool === 'arrow' ||
                    drawing.tool === 'arrow-dash' ||
                    drawing.tool === 'arrow-curve' ||
                    drawing.tool === 'angle' ||
                    drawing.tool === 'angle-vertical' ||
                    drawing.tool === 'angle-horizontal' ||
                    drawing.tool === 'ruler' ||
                    drawing.tool === 'circle' ||
                    drawing.tool === 'rectangle' ||
                    drawing.tool === 'grid'
                ) {
                    drawing.startX += dx - state.dragState.offsetX;
                    drawing.startY += dy - state.dragState.offsetY;
                    drawing.endX += dx - state.dragState.offsetX;
                    drawing.endY += dy - state.dragState.offsetY;
                } else if (drawing.tool === 'freehand' || drawing.tool === 'polyline' || drawing.tool === 'polyline-arrow') {
                    drawing.points = drawing.points.map((p) => ({
                        x: p.x + dx - state.dragState.offsetX,
                        y: p.y + dy - state.dragState.offsetY,
                    }));
                } else if (
                    drawing.tool === 'crosshair' ||
                    drawing.tool === 'autonumber' ||
                    drawing.tool === 'text' ||
                    drawing.tool === 'note'
                ) {
                    drawing.x += dx - state.dragState.offsetX;
                    drawing.y += dy - state.dragState.offsetY;
                }

                updatedDrawings[state.dragState.index] = drawing;
                state.drawings = updatedDrawings;
                state.dragState = { ...state.dragState, offsetX: dx, offsetY: dy };
            } else if (state.dragState.type === 'control') {
                const updatedDrawings = [...state.drawings];
                const drawing = { ...updatedDrawings[state.dragState.index] };

                if (state.dragState.controlPoint === 'start') {
                    drawing.startX = pos.x;
                    drawing.startY = pos.y;
                } else if (state.dragState.controlPoint === 'end') {
                    drawing.endX = pos.x;
                    drawing.endY = pos.y;
                } else if (state.dragState.controlPoint === 'center') {
                    const dxCenter = pos.x - drawing.startX;
                    const dyCenter = pos.y - drawing.startY;
                    drawing.startX = pos.x;
                    drawing.startY = pos.y;
                    drawing.endX += dxCenter;
                    drawing.endY += dyCenter;
                } else if (state.dragState.controlPoint === 'radius') {
                    drawing.endX = pos.x;
                    drawing.endY = pos.y;
                } else if (state.dragState.controlPoint === 'topLeft') {
                    drawing.startX = pos.x;
                    drawing.startY = pos.y;
                } else if (state.dragState.controlPoint === 'bottomRight') {
                    drawing.endX = pos.x;
                    drawing.endY = pos.y;
                } else if (state.dragState.controlPoint === 'topRight') {
                    drawing.endX = pos.x;
                    drawing.startY = pos.y;
                } else if (state.dragState.controlPoint === 'bottomLeft') {
                    drawing.startX = pos.x;
                    drawing.endY = pos.y;
                } else if (state.dragState.controlPoint === 'position') {
                    drawing.x = pos.x;
                    drawing.y = pos.y;
                } else if (state.dragState.controlPoint.startsWith('point-')) {
                    const pointIndex = parseInt(state.dragState.controlPoint.split('-')[1], 10);
                    drawing.points[pointIndex] = { x: pos.x, y: pos.y };
                }

                updatedDrawings[state.dragState.index] = drawing;
                state.drawings = updatedDrawings;
            }
            return;
        }

        if (!state.isDrawing || !state.currentDrawing) return;

        if (state.selectedTool === 'polyline' || state.selectedTool === 'polyline-arrow') {
            const previewPoints = [...state.freehandPoints, pos];
            state.currentDrawing = { ...state.currentDrawing, points: previewPoints };
            return;
        }

        if (state.selectedTool === 'freehand') {
            const newPoints = [...state.freehandPoints, pos];
            state.freehandPoints = newPoints;
            state.currentDrawing = { ...state.currentDrawing, points: newPoints };
        } else {
            state.currentDrawing = { ...state.currentDrawing, endX: pos.x, endY: pos.y };
        }
    };

    const stopDrawing = () => {
        if (state.selectedTool === 'move') {
            state.dragState = null;
            return;
        }

        if (state.selectedTool === 'polyline' || state.selectedTool === 'polyline-arrow') {
            return;
        }

        if (state.isDrawing && state.currentDrawing) {
            state.drawings = [...state.drawings, state.currentDrawing];
            state.currentDrawing = null;
            state.freehandPoints = [];
            scheduleAutosave();
        }

        state.isDrawing = false;
    };

    const handleContextMenu = (event) => {
        event.preventDefault();
        const pos = getMousePos(event);
        const idx = findDrawingAtPoint(pos.x, pos.y);
        if (idx === -1) return;

        state.contextMenu = { x: event.clientX, y: event.clientY, drawingIndex: idx };
        ui.contextMenu.classList.remove('hidden');
        ui.contextMenu.style.left = `${state.contextMenu.x}px`;
        ui.contextMenu.style.top = `${state.contextMenu.y}px`;
    };

    const hideContextMenu = () => {
        state.contextMenu = null;
        ui.contextMenu.classList.add('hidden');
    };

    const handleTextSubmit = () => {
        if (readOnly) return;

        const text = ui.textInputField.value;
        if (text.trim() !== '') {
            const tool = state.textInsertTool === 'note' ? 'note' : 'text';
            if (tool === 'note') {
                state.notes = [
                    ...state.notes,
                    {
                        id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
                        time: state.currentTime,
                        x: clamp(state.notePosition.x, 0, 1),
                        y: clamp(state.notePosition.y, 0, 1),
                        text,
                        maxWidth: 320,
                    },
                ];
            } else {
                state.drawings = [
                    ...state.drawings,
                    {
                        tool,
                        x: state.textPosition.x,
                        y: state.textPosition.y,
                        text,
                        time: state.currentTime,
                        color: state.drawColor,
                        lineWidth: state.lineWidth,
                        backgroundColor: '#4a4a4a',
                        space: 'board',
                    },
                ];
            }
        }

        ui.textInput.classList.add('hidden');
        ui.textInputField.value = '';
        ui.textInputField.placeholder = 'Enter text...';
        state.textInsertTool = 'text';
        scheduleAutosave();
    };

    const renderNotes = () => {
        const rect = ui.stage.getBoundingClientRect();
        const width = rect.width || 1;
        const height = rect.height || 1;

        const byId = new Map();
        Array.from(ui.noteLayer.querySelectorAll('[data-note-id]')).forEach((el) => {
            byId.set(el.getAttribute('data-note-id'), el);
        });

        const visibleIds = new Set();

        state.notes
            .filter((n) => n && typeof n.time === 'number' && Math.abs(n.time - state.currentTime) <= 2)
            .forEach((note) => {
                const id = String(note.id ?? '');
                if (id === '') return;
                visibleIds.add(id);

                let el = byId.get(id);
                if (!el) {
                    el = document.createElement('div');
                    el.setAttribute('data-note-id', id);
                    el.className =
                        'absolute rounded-xl border border-white/20 bg-black/70 text-white text-sm shadow-lg backdrop-blur select-none';

                    const header = document.createElement('div');
                    header.className = 'flex items-center justify-between gap-2 px-3 pt-2';

                    const left = document.createElement('div');
                    left.className = 'text-[11px] text-white/60';
                    left.textContent = 'Note';

                    const right = document.createElement('div');
                    right.className = 'flex items-center gap-1';

                    const collapseBtn = document.createElement('button');
                    collapseBtn.type = 'button';
                    collapseBtn.setAttribute('data-note-collapse', '1');
                    collapseBtn.className =
                        'rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80 hover:bg-white/10';
                    collapseBtn.textContent = '–';

                    const closeBtn = document.createElement('button');
                    closeBtn.type = 'button';
                    closeBtn.setAttribute('data-note-close', '1');
                    closeBtn.className =
                        'rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80 hover:bg-white/10';
                    closeBtn.textContent = '×';

                    right.appendChild(collapseBtn);
                    right.appendChild(closeBtn);
                    header.appendChild(left);
                    header.appendChild(right);
                    el.appendChild(header);

                    const body = document.createElement('div');
                    body.className = 'px-3 pb-2 pt-1';
                    el.appendChild(body);

                    const tail = document.createElement('div');
                    tail.setAttribute('data-note-tail', '1');
                    tail.className =
                        'absolute -bottom-2 left-6 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-black/70';
                    el.appendChild(tail);

                    const textEl = document.createElement('div');
                    textEl.setAttribute('data-note-text', '1');
                    textEl.className = 'whitespace-pre-wrap leading-snug';
                    body.appendChild(textEl);

                    const resizeHandle = document.createElement('div');
                    resizeHandle.setAttribute('data-note-resize', '1');
                    resizeHandle.className =
                        'absolute bottom-1 right-1 h-3 w-3 cursor-se-resize rounded-sm border border-white/20 bg-white/10';
                    el.appendChild(resizeHandle);

                    ui.noteLayer.appendChild(el);

                    el.addEventListener('contextmenu', (event) => {
                        if (readOnly) return;
                        event.preventDefault();
                        const noteId = el.getAttribute('data-note-id') || '';
                        if (noteId === '') return;
                        if (confirm('この吹き出しを削除しますか？')) {
                            state.notes = state.notes.filter((n) => String(n.id ?? '') !== noteId);
                            scheduleAutosave();
                        }
                    });

                    el.addEventListener('pointerdown', (event) => {
                        if (readOnly) return;
                        if (state.selectedTool !== 'move') return;
                        event.preventDefault();
                        event.stopPropagation();
                        const noteId = el.getAttribute('data-note-id') || '';
                        if (noteId === '') return;

                        const stageRect = ui.stage.getBoundingClientRect();
                        const sx = stageRect.width || 1;
                        const sy = stageRect.height || 1;

                        const note = state.notes.find((n) => String(n.id ?? '') === noteId);
                        if (!note) return;

                        const target = event.target;
                        const isButton =
                            target instanceof HTMLElement &&
                            (target.closest('[data-note-collapse]') || target.closest('[data-note-close]'));
                        if (isButton) {
                            return;
                        }

                        const isResize =
                            target instanceof HTMLElement && !!target.closest('[data-note-resize]');
                        if (isResize) {
                            el.setPointerCapture(event.pointerId);
                            state.noteDrag = {
                                mode: 'resize',
                                id: noteId,
                                startClientX: event.clientX,
                                startClientY: event.clientY,
                                startWidth: clamp(Number(note.maxWidth || 320), 160, 520),
                                stageW: sx,
                                stageH: sy,
                            };
                            return;
                        }

                        el.setPointerCapture(event.pointerId);
                        state.noteDrag = {
                            mode: 'move',
                            id: noteId,
                            startClientX: event.clientX,
                            startClientY: event.clientY,
                            startX: clamp(Number(note.x || 0), 0, 1),
                            startY: clamp(Number(note.y || 0), 0, 1),
                            stageW: sx,
                            stageH: sy,
                        };
                    });

                    el.querySelector('[data-note-collapse]')?.addEventListener('click', (event) => {
                        if (readOnly) return;
                        event.preventDefault();
                        event.stopPropagation();
                        const noteId = el.getAttribute('data-note-id') || '';
                        if (noteId === '') return;
                        state.notes = state.notes.map((n) => {
                            if (String(n.id ?? '') !== noteId) return n;
                            return { ...n, collapsed: !n.collapsed };
                        });
                        scheduleAutosave();
                    });

                    el.querySelector('[data-note-close]')?.addEventListener('click', (event) => {
                        if (readOnly) return;
                        event.preventDefault();
                        event.stopPropagation();
                        const noteId = el.getAttribute('data-note-id') || '';
                        if (noteId === '') return;
                        if (confirm('この吹き出しを削除しますか？')) {
                            state.notes = state.notes.filter((n) => String(n.id ?? '') !== noteId);
                            scheduleAutosave();
                        }
                    });
                }

                const noteTextEl = el.querySelector('[data-note-text]');
                if (noteTextEl) {
                    const collapsed = !!note.collapsed;
                    const full = String(note.text ?? '');
                    noteTextEl.textContent = collapsed ? `${full.slice(0, 18)}${full.length > 18 ? '…' : ''}` : full;
                }

                const xPx = clamp(Number(note.x || 0), 0, 1) * width;
                const yPx = clamp(Number(note.y || 0), 0, 1) * height;
                el.style.left = `${xPx}px`;
                el.style.top = `${yPx}px`;
                const maxWidth = clamp(Number(note.maxWidth || 320), 160, 520);
                el.style.width = note.collapsed ? '11rem' : `${maxWidth}px`;

                const tail = el.querySelector('[data-note-tail]');
                if (tail) {
                    tail.style.display = note.collapsed ? 'none' : 'block';
                }
                el.style.display = 'block';
            });

        byId.forEach((el, id) => {
            if (!visibleIds.has(String(id))) {
                el.style.display = 'none';
            }
        });
    };

    const openMemoInput = () => {
        ui.memoInput.classList.remove('hidden');
        ui.capture.classList.add('hidden');
        ui.memoText.value = '';
        ui.memoText.focus();
    };

    const closeMemoInput = () => {
        ui.memoInput.classList.add('hidden');
        ui.capture.classList.remove('hidden');
        ui.memoText.value = '';
    };

    const captureFrame = async (memo) => {
        if (readOnly || !snapshotUrl) return;
        setStatus('撮影中…');

        try {
            const off = document.createElement('canvas');
            off.width = ui.video.videoWidth || 1920;
            off.height = ui.video.videoHeight || 1080;
            const offCtx = off.getContext('2d');
            if (!offCtx) throw new Error('No canvas context');
            offCtx.drawImage(ui.video, 0, 0);

            const image = off.toDataURL('image/png');
            const time = ui.video.currentTime || 0;
            const res = await postJson(snapshotUrl, { image, time });

            state.frameSnapshots = [...state.frameSnapshots, { time, url: res.url, memo }];
            renderSnapshots();
            scheduleAutosave();
            setStatus('撮影しました');
            setTimeout(() => setStatus(''), 1500);
        } catch (error) {
            setStatus('撮影に失敗しました');
            console.error(error);
        }
    };

    const saveAnnotations = async ({ silent } = { silent: false }) => {
        if (readOnly || !saveUrl) return;

        if (!silent) {
            setStatus('保存中…');
        }
        try {
            const payload = {
                drawings: state.drawings,
                snapshots: state.frameSnapshots,
                notes: state.notes,
                settings: {
                    color: state.drawColor,
                    width: state.lineWidth,
                    autoNumber: state.autoNumberCount,
                },
            };

            await postJson(saveUrl, { annotations: payload });
            if (!silent) {
                setStatus('保存しました');
                setTimeout(() => setStatus(''), 1500);
            }
        } catch (error) {
            if (!silent) {
                setStatus('保存に失敗しました');
            }
            console.error(error);
        }
    };

    const convertLegacyAnnotationsIfNeeded = () => {
        if (!state.drawings.some((d) => d && typeof d === 'object' && 'type' in d)) {
            return;
        }

        const stageRect = ui.stage.getBoundingClientRect();
        const videoRect = ui.video.getBoundingClientRect();

        const videoLeft = videoRect.left - stageRect.left;
        const videoTop = videoRect.top - stageRect.top;
        const videoWidth = videoRect.width || 1;
        const videoHeight = videoRect.height || 1;

        const mapVideoNormalizedToBoard = (x, y) => ({
            x: clamp(videoLeft + clamp(Number(x || 0), 0, 1) * videoWidth, 0, stageRect.width || 1),
            y: clamp(videoTop + clamp(Number(y || 0), 0, 1) * videoHeight, 0, stageRect.height || 1),
        });

        const mapToolFromLegacy = (legacyTool) => {
            if (legacyTool === 'pen') return 'freehand';
            if (legacyTool === 'arrow') return 'arrow';
            if (legacyTool === 'text') return 'text';
            if (legacyTool === 'number') return 'autonumber';
            return null;
        };

        state.drawings = state.drawings
            .map((d) => {
                if (!d || typeof d !== 'object' || !('type' in d)) return d;
                const tool = mapToolFromLegacy(d.type);
                if (!tool) return null;

                if (tool === 'freehand' && Array.isArray(d.points)) {
                    return {
                        tool: 'freehand',
                        points: d.points.map((p) => ({
                            ...mapVideoNormalizedToBoard(p.x, p.y),
                        })),
                        time: Number(d.time || 0),
                        color: d.color || state.drawColor,
                        lineWidth: Number(d.width || state.lineWidth),
                        space: 'board',
                    };
                }

                if (tool === 'arrow' && d.start && d.end) {
                    const start = mapVideoNormalizedToBoard(d.start.x, d.start.y);
                    const end = mapVideoNormalizedToBoard(d.end.x, d.end.y);
                    return {
                        tool: 'arrow',
                        startX: start.x,
                        startY: start.y,
                        endX: end.x,
                        endY: end.y,
                        time: Number(d.time || 0),
                        color: d.color || state.drawColor,
                        lineWidth: Number(d.width || state.lineWidth),
                        space: 'board',
                    };
                }

                if (tool === 'text' && d.pos) {
                    const pos = mapVideoNormalizedToBoard(d.pos.x, d.pos.y);
                    return {
                        tool: 'text',
                        x: pos.x,
                        y: pos.y,
                        text: String(d.text || ''),
                        time: Number(d.time || 0),
                        color: d.color || state.drawColor,
                        lineWidth: Number(d.width || state.lineWidth),
                        backgroundColor: '#4a4a4a',
                        space: 'board',
                    };
                }

                if (tool === 'autonumber' && d.pos) {
                    const pos = mapVideoNormalizedToBoard(d.pos.x, d.pos.y);
                    return {
                        tool: 'autonumber',
                        x: pos.x,
                        y: pos.y,
                        number: Number(d.value || 1),
                        time: Number(d.time || 0),
                        color: d.color || state.drawColor,
                        lineWidth: Number(d.width || state.lineWidth),
                        space: 'board',
                    };
                }

                return null;
            })
            .filter(Boolean);
    };

    ui.video.src = withShare(videoSrc);
    ui.video.controls = false;
    ui.video.preload = 'metadata';
    ui.video.playbackRate = 1;
    setVideoStatus();

    if (readOnly || videoUploadUrl === '') {
        ui.openVideo.setAttribute('disabled', 'disabled');
    }

    ui.video.addEventListener('loadedmetadata', () => {
        state.duration = ui.video.duration || 0;
        resizeCanvas();
        requestAnimationFrame(() => {
            normalizeLegacyDrawingsIfNeeded();
        });
        convertLegacyAnnotationsIfNeeded();
        setVideoStatus();
    });

    ui.video.addEventListener('timeupdate', () => {
        state.currentTime = ui.video.currentTime || 0;
        if (state.loopRange && state.currentTime >= state.loopRange.end) {
            ui.video.currentTime = state.loopRange.start;
            state.currentTime = state.loopRange.start;
        }
    });

    const syncPlayingState = () => {
        state.isPlaying = !ui.video.paused;
        setPlayingIcon();
    };

    ui.video.addEventListener('play', syncPlayingState);
    ui.video.addEventListener('playing', syncPlayingState);
    ui.video.addEventListener('pause', syncPlayingState);
    ui.video.addEventListener('ended', () => {
        desiredPlaying = false;
        syncPlayingState();
    });

    ui.openVideo.addEventListener('click', () => {
        if (ui.openVideo.hasAttribute('disabled')) {
            return;
        }

        ui.fileInput.click();
    });

    ui.fileInput.addEventListener('change', async () => {
        const file = ui.fileInput.files?.[0] ?? null;
        if (!file) return;

        const localUrl = URL.createObjectURL(file);
        ui.video.src = localUrl;
        ui.video.currentTime = 0;
        state.loopRange = null;
        state.drawings = [];
        state.currentDrawing = null;
        state.freehandPoints = [];
        state.isDrawing = false;
        state.selectedDrawingIndex = null;
        state.dragState = null;
        state.noteDrag = null;
        state.notes = [];
        state.frameSnapshots = [];
        updatePlaybackUi();
        renderSnapshots();
        setVideoStatus();

        if (readOnly || videoUploadUrl === '') {
            setStatus('この画面ではアップロードできません');
            return;
        }

        ui.openVideo.setAttribute('disabled', 'disabled');
        ui.save.setAttribute('disabled', 'disabled');
        setStatus('アップロード中…');

        try {
            const csrf = getCsrfToken();
            const formData = new FormData();
            formData.append('video', file);

            const response = await fetch(videoUploadUrl, {
                method: 'POST',
                headers: {
                    ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                    Accept: 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                let message = 'アップロードに失敗しました';
                try {
                    const json = await response.json();
                    const firstError = json?.errors?.video?.[0];
                    if (typeof firstError === 'string' && firstError !== '') {
                        message = firstError;
                    } else if (typeof json?.message === 'string' && json.message !== '') {
                        message = json.message;
                    }
                } catch {
                    // ignore
                }
                setStatus(message);
                return;
            }

            const json = await response.json();
            const nextVideoUrl = json?.video_url;
            const nextSaveUrl = json?.save_url;
            const nextSnapshotUrl = json?.snapshot_url;
            const nextVideoId = json?.video_id;

            if (
                typeof nextVideoUrl !== 'string' ||
                nextVideoUrl === '' ||
                typeof nextSaveUrl !== 'string' ||
                nextSaveUrl === '' ||
                typeof nextSnapshotUrl !== 'string' ||
                nextSnapshotUrl === '' ||
                typeof nextVideoId !== 'number'
            ) {
                setStatus('アップロードに失敗しました');
                return;
            }

            saveUrl = nextSaveUrl;
            snapshotUrl = nextSnapshotUrl;
            root.dataset.saveUrl = saveUrl;
            root.dataset.snapshotUrl = snapshotUrl;
            root.dataset.videoSrc = nextVideoUrl;

            const annotations = json?.annotations ?? {};
            state.drawings = Array.isArray(annotations.drawings) ? annotations.drawings : [];
            state.frameSnapshots = Array.isArray(annotations.snapshots) ? annotations.snapshots : [];
            state.notes = Array.isArray(annotations.notes) ? annotations.notes : [];
            state.currentDrawing = null;
            state.freehandPoints = [];
            state.isDrawing = false;
            state.selectedDrawingIndex = null;
            state.dragState = null;
            state.noteDrag = null;
            state.loopRange = null;

            ui.video.src = withShare(nextVideoUrl);
            ui.video.currentTime = 0;
            renderSnapshots();
            updatePlaybackUi();
            setVideoStatus();

            try {
                const url = new URL(window.location.href);
                url.searchParams.set('video', String(nextVideoId));
                window.history.replaceState({}, '', url.toString());
            } catch {
                // ignore
            }

            setStatus('アップロードしました');
            setTimeout(() => setStatus(''), 1200);
        } catch (error) {
            console.error(error);
            setStatus('アップロードに失敗しました');
        } finally {
            ui.fileInput.value = '';
            ui.save.removeAttribute('disabled');
            if (!readOnly && videoUploadUrl !== '') {
                ui.openVideo.removeAttribute('disabled');
            }

            try {
                URL.revokeObjectURL(localUrl);
            } catch {
                // ignore
            }
        }
    });

    ui.toolButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (readOnly) return;
            const toolId = btn.getAttribute('data-tool');
            state.selectedTool = state.selectedTool === toolId ? null : toolId;
            updateToolbarUi();
            updateDrawingOptionsUi();
        });
    });

    ui.clearAll.addEventListener('click', () => {
        if (readOnly) return;
        clearDrawings();
    });

    if (ui.save) {
        ui.save.addEventListener('click', saveAnnotations);
    }

    ui.colorButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            state.drawColor = btn.getAttribute('data-color') || '#FF0000';
            updateDrawingOptionsUi();
            scheduleAutosave();
        });
    });

    ui.lineWidth.addEventListener('input', () => {
        state.lineWidth = clamp(Number(ui.lineWidth.value), 1, 10);
        updateDrawingOptionsUi();
        scheduleAutosave();
    });

    ui.autonumberReset.addEventListener('click', () => {
        if (readOnly) return;
        state.autoNumberCount = 1;
        updateDrawingOptionsUi();
        scheduleAutosave();
    });

    ui.capture.addEventListener('click', () => {
        if (readOnly) return;
        openMemoInput();
    });

    ui.memoSave.addEventListener('click', async () => {
        if (readOnly) return;
        const memo = ui.memoText.value || '';
        closeMemoInput();
        await captureFrame(memo);
    });

    ui.memoCancel.addEventListener('click', () => {
        closeMemoInput();
    });

    ui.stage.addEventListener('pointerdown', (event) => {
        if (readOnly) return;
        if (state.selectedTool !== 'note') return;

        const stageRect = ui.stage.getBoundingClientRect();
        const xCss = event.clientX - stageRect.left;
        const yCss = event.clientY - stageRect.top;

        const pos = getMousePos(event);
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = ui.canvas.width / dpr;
        const cssHeight = ui.canvas.height / dpr;

        state.notePosition = {
            x: clamp(pos.x / (cssWidth || 1), 0, 1),
            y: clamp(pos.y / (cssHeight || 1), 0, 1),
        };
        state.textInsertTool = 'note';

        ui.textInput.classList.remove('hidden');
        ui.textInput.style.left = `${xCss}px`;
        ui.textInput.style.top = `${yCss}px`;
        ui.textInputField.value = '';
        ui.textInputField.placeholder = 'Note…';
        ui.textInputField.focus();
    });

    ui.noteLayer.addEventListener('pointermove', (event) => {
        if (readOnly) return;
        if (!state.noteDrag) return;
        if (state.selectedTool !== 'move') return;

        const effectiveZoom = clamp(state.zoom * resolvedZoomBase, 0.5, 4);
        const dx = (event.clientX - state.noteDrag.startClientX) / effectiveZoom;
        const dy = (event.clientY - state.noteDrag.startClientY) / effectiveZoom;

        if (state.noteDrag.mode === 'resize') {
            const nextWidth = clamp(state.noteDrag.startWidth + dx, 160, 520);
            state.notes = state.notes.map((n) => {
                if (String(n.id ?? '') !== state.noteDrag.id) return n;
                return { ...n, maxWidth: nextWidth };
            });
            return;
        }

        const nextX = clamp(state.noteDrag.startX + dx / (state.noteDrag.stageW || 1), 0, 1);
        const nextY = clamp(state.noteDrag.startY + dy / (state.noteDrag.stageH || 1), 0, 1);

        state.notes = state.notes.map((n) => {
            if (String(n.id ?? '') !== state.noteDrag.id) return n;
            return { ...n, x: nextX, y: nextY };
        });
    });

    ui.noteLayer.addEventListener('pointerup', () => {
        if (!state.noteDrag) return;
        state.noteDrag = null;
        scheduleAutosave();
    });

    ui.noteLayer.addEventListener('pointercancel', () => {
        state.noteDrag = null;
    });

    ui.speedButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const rate = Number(btn.getAttribute('data-rate'));
            state.playbackRate = rate;
            ui.video.playbackRate = rate;
            updateSpeedUi();
        });
    });

    ui.setStart.addEventListener('click', () => {
        const currentTime = ui.video.currentTime || 0;
        const duration = ui.video.duration || 0;
        const previousEnd = state.loopRange?.end ?? duration;
        state.loopRange = { start: currentTime, end: previousEnd };
        updatePlaybackUi();
    });

    ui.setEnd.addEventListener('click', () => {
        const currentTime = ui.video.currentTime || 0;
        const previousStart = state.loopRange?.start ?? 0;
        state.loopRange = { start: previousStart, end: currentTime };
        updatePlaybackUi();
    });

    ui.clearRange.addEventListener('click', () => {
        state.loopRange = null;
        updatePlaybackUi();
    });

    ui.seekbar.addEventListener('click', (event) => {
        const duration = ui.video.duration || 0;
        if (duration <= 0) return;
        const rect = ui.seekbar.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = clamp(x / rect.width, 0, 1);
        ui.video.currentTime = percentage * duration;
    });

    const startPlayback = async () => {
        if (!ui.video.currentSrc) {
            setStatus('動画が読み込まれていません（Open Video で選択してください）');
            setTimeout(() => setStatus(''), 2000);
            return;
        }

        if (playPromise) {
            return;
        }

        playPromise = ui.video
            .play()
            .catch((error) => {
                console.error(error);
                desiredPlaying = false;
                const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
                setStatus(name ? `再生できませんでした（${name}）` : '再生できませんでした');
                setTimeout(() => setStatus(''), 2500);
            })
            .finally(() => {
                playPromise = null;
                if (!desiredPlaying && !ui.video.paused) {
                    ui.video.pause();
                }
                syncPlayingState();
            });
    };

    ui.togglePlay.addEventListener('click', async () => {
        if (!ui.video.currentSrc) {
            setStatus('動画が読み込まれていません（Open Video で選択してください）');
            setTimeout(() => setStatus(''), 2000);
            return;
        }

        if (desiredPlaying || !ui.video.paused) {
            desiredPlaying = false;
            ui.video.pause();
            syncPlayingState();
            return;
        }

        desiredPlaying = true;
        await startPlayback();
    });

    ui.stepPrev.addEventListener('click', () => {
        const frameTime = 1 / 30;
        ui.video.currentTime = clamp((ui.video.currentTime || 0) - frameTime, 0, ui.video.duration || 0);
    });

    ui.stepNext.addEventListener('click', () => {
        const frameTime = 1 / 30;
        ui.video.currentTime = clamp((ui.video.currentTime || 0) + frameTime, 0, ui.video.duration || 0);
    });

    ui.zoomOut.addEventListener('click', () => {
        state.zoom = Math.max(0.5, state.zoom - 0.25);
        applyZoom();
    });

    ui.zoomIn.addEventListener('click', () => {
        state.zoom = Math.min(2, state.zoom + 0.25);
        applyZoom();
    });

    ui.stage.addEventListener('pointerdown', (event) => {
        if (readOnly) return;
        if (!state.selectedTool) return;
        if (state.selectedTool === 'note') return;
        ui.stage.setPointerCapture(event.pointerId);
        startDrawing(event);
    });

    ui.stage.addEventListener('pointermove', (event) => {
        if (readOnly) return;
        draw(event);
    });

    ui.stage.addEventListener('pointerup', () => {
        if (readOnly) return;
        stopDrawing();
    });

    ui.stage.addEventListener('pointerleave', () => {
        if (readOnly) return;
        stopDrawing();
    });

    ui.stage.addEventListener('dblclick', () => {
        if (readOnly) return;
        if (state.selectedTool === 'polyline' || state.selectedTool === 'polyline-arrow') {
            finishPolyline();
        }
    });

    ui.stage.addEventListener('contextmenu', (event) => {
        if (readOnly) return;
        handleContextMenu(event);
    });

    ui.stage.addEventListener(
        'wheel',
        (event) => {
            if (readOnly) return;
            event.preventDefault();

            const direction = event.deltaY < 0 ? 1 : -1;
            const next = clamp(state.zoom + direction * 0.1, 0.5, 2);
            if (next === state.zoom) return;
            state.zoom = next;
            applyZoom();
        },
        { passive: false, signal }
    );

    document.addEventListener(
        'click',
        () => {
            hideContextMenu();
        },
        { signal }
    );

    ui.deleteDrawing.addEventListener('click', () => {
        if (!state.contextMenu) return;
        deleteDrawingAt(state.contextMenu.drawingIndex);
        hideContextMenu();
    });

    ui.textOk.addEventListener('click', handleTextSubmit, { signal });
    ui.textInputField.addEventListener(
        'keydown',
        (event) => {
            if (event.key === 'Enter') handleTextSubmit();
            if (event.key === 'Escape') {
                ui.textInput.classList.add('hidden');
                ui.textInputField.value = '';
                ui.textInsertTool = 'text';
                ui.textInputField.placeholder = 'Enter text...';
            }
        },
        { signal }
    );

    renderSnapshots();
    applyZoom();
    resizeCanvas();
    updateToolbarUi();
    updateDrawingOptionsUi();
    updateSpeedUi();
    updatePlaybackUi();
    setPlayingIcon();

    window.addEventListener(
        'resize',
        () => {
            resizeCanvas();
        },
        { signal }
    );

    let rafId = null;
    signal.addEventListener('abort', () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    });

    const tick = () => {
        if (signal.aborted) {
            return;
        }

        state.currentTime = ui.video.currentTime || 0;
        state.duration = ui.video.duration || 0;
        state.isPlaying = !ui.video.paused;
        setPlayingIcon();
        updatePlaybackUi();
        renderDrawings(
            ui.canvas,
            state.drawings,
            state.currentDrawing,
            state.currentTime,
            state.selectedDrawingIndex,
            state.zoom * resolvedZoomBase,
        );
        renderNotes();
        rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
}

const bootVideoAnalysis = () => {
    initVideoAnalysis();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootVideoAnalysis);
} else {
    bootVideoAnalysis();
}

document.addEventListener('livewire:navigated', bootVideoAnalysis);
