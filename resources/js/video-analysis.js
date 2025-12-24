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
        share: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.7" y1="10.7" x2="15.3" y2="6.3"/><line x1="8.7" y1="13.3" x2="15.3" y2="17.7"/></svg>`,
        magnifier: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
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
    { id: 'magnifier', icon: 'magnifier', label: 'Magnifier' },
    { id: 'freehand', icon: 'pencil', label: 'Freehand' },
    { id: 'crosshair', icon: 'plus', label: 'Crosshair' },
    { separator: true },
    { id: 'angle', icon: 'chevronRight', label: 'Angle' },
    { id: 'angle-vertical', icon: 'chevronRight', label: 'Angle to Vertical', badge: '↕' },
    { id: 'angle-horizontal', icon: 'chevronRight', label: 'Angle to Horizontal', badge: '↔' },
    { id: 'ruler', icon: 'ruler', label: 'Distance' },
];

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

          ${!readOnly ? `
          <div class="p-3 border-t border-[#3a3a3a]">
            <h3 class="text-xs font-semibold mb-2 text-gray-300 flex items-center justify-between">
              <span>Before/After比較</span>
              <button type="button" data-action="toggle-comparison-mode" class="px-2 py-1 text-xs rounded transition-colors bg-[#0078d4] hover:bg-[#106ebe]" data-comparison-mode="off">
                作成モード
              </button>
            </h3>
            <div data-role="comparison-mode-hint" class="text-xs text-gray-400 mb-2 hidden">
              2つのスナップショットを選択してください
            </div>
            <div class="space-y-2 mb-2">
              <input type="text" data-role="comparison-search" placeholder="検索..." class="w-full px-2 py-1 bg-[#333] text-white border border-[#3a3a3a] rounded text-xs" />
              <select data-role="comparison-sort" class="w-full px-2 py-1 bg-[#333] text-white border border-[#3a3a3a] rounded text-xs">
                <option value="newest">新しい順</option>
                <option value="oldest">古い順</option>
                <option value="title-asc">タイトル順 (A-Z)</option>
                <option value="title-desc">タイトル順 (Z-A)</option>
              </select>
              <label class="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" data-role="comparison-favorites-only" class="rounded bg-[#333] border-[#3a3a3a]" />
                <span>お気に入りのみ</span>
              </label>
            </div>
            <div class="space-y-2" data-role="comparisons"></div>
          </div>
          ` : ''}

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
	    const snapshotMarkers = qs('[data-role="snapshot-markers"]');
	    const stepPrev = qs('[data-action="step-prev"]');
	    const stepNext = qs('[data-action="step-next"]');
    const togglePlay = qs('[data-action="toggle-play"]');
    const playIcon = qs('[data-role="play-icon"]');
    const timeLabel = qs('[data-role="time-label"]');
    const zoomOut = qs('[data-action="zoom-out"]');
    const zoomIn = qs('[data-action="zoom-in"]');
    const zoomLabel = qs('[data-role="zoom-label"]');
    const contextMenu = qs('[data-role="context-menu"]');
    const comparisons = qs('[data-role="comparisons"]');
    const comparisonModeButton = qs('[data-action="toggle-comparison-mode"]');
    const comparisonModeHint = qs('[data-role="comparison-mode-hint"]');
    const comparisonSearch = qs('[data-role="comparison-search"]');
    const comparisonSort = qs('[data-role="comparison-sort"]');
    const comparisonFavoritesOnly = qs('[data-role="comparison-favorites-only"]');
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
	        snapshotMarkers,
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
        comparisons,
        comparisonModeButton,
        comparisonModeHint,
        comparisonSearch,
        comparisonSort,
        comparisonFavoritesOnly,
    };
}

function renderDrawings(canvas, drawings, currentDrawing, currentTime, selectedDrawingIndex = null, zoom = 1, video = null, stage = null) {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const effectiveZoom = Number.isFinite(zoom) ? clamp(zoom, 0.1, 6) : 1;
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
            } else if (drawing.tool === 'curve') {
                drawCurve(ctx, drawing);
            } else if (drawing.tool === 'polyline' && drawing.points) {
                drawPolyline(ctx, drawing);
            } else if (drawing.tool === 'polyline-arrow' && drawing.points) {
                drawPolylineArrow(ctx, drawing);
            } else if (drawing.tool === 'circle') {
                drawCircle(ctx, drawing);
            } else if (drawing.tool === 'magnifier') {
                drawMagnifier(ctx, drawing, video, stage, effectiveZoom, cx, cy);
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

    if (drawing.tool === 'magnifier') {
        const radius = clamp(
            Number.isFinite(Number(drawing.radius))
                ? Number(drawing.radius)
                : Math.hypot(Number(drawing.endX) - Number(drawing.startX), Number(drawing.endY) - Number(drawing.startY)),
            20,
            280,
        );

        const handleX = Number.isFinite(Number(drawing.handleX))
            ? Number(drawing.handleX)
            : drawing.startX + radius * 0.8;
        const handleY = Number.isFinite(Number(drawing.handleY))
            ? Number(drawing.handleY)
            : drawing.startY + radius * 0.8;

        const handleLen = Math.hypot(handleX - drawing.startX, handleY - drawing.startY);
        const ux = handleLen > 0 ? (handleX - drawing.startX) / handleLen : 1;
        const uy = handleLen > 0 ? (handleY - drawing.startY) / handleLen : 0;
        const radiusX = drawing.startX + ux * radius;
        const radiusY = drawing.startY + uy * radius;

        drawPoint(drawing.startX, drawing.startY);
        drawPoint(radiusX, radiusY);
        drawPoint(handleX, handleY);
    } else if (drawing.tool === 'angle') {
        drawPoint(drawing.startX, drawing.startY);
        if (
            Object.prototype.hasOwnProperty.call(drawing, 'controlX') &&
            Object.prototype.hasOwnProperty.call(drawing, 'controlY')
        ) {
            drawPoint(Number(drawing.controlX), Number(drawing.controlY));
        }
        drawPoint(drawing.endX, drawing.endY);
    } else if (
        drawing.tool === 'line' ||
        drawing.tool === 'arrow' ||
        drawing.tool === 'arrow-dash' ||
        drawing.tool === 'arrow-curve' ||
        drawing.tool === 'curve' ||
        drawing.tool === 'angle-vertical' ||
        drawing.tool === 'angle-horizontal' ||
        drawing.tool === 'ruler'
    ) {
        if (drawing.tool === 'arrow-curve' || drawing.tool === 'curve') {
            const controlPoint = getCurveControlPoint(drawing);

            drawPoint(drawing.startX, drawing.startY);
            drawPoint(controlPoint.x, controlPoint.y);
            drawPoint(drawing.endX, drawing.endY);
        } else {
            drawPoint(drawing.startX, drawing.startY);
            drawPoint(drawing.endX, drawing.endY);
        }
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

function getCurveControlPoint(drawing) {
    const controlX = Number(drawing.controlX);
    const controlY = Number(drawing.controlY);

    if (Number.isFinite(controlX) && Number.isFinite(controlY)) {
        return { x: controlX, y: controlY };
    }

    const startX = Number(drawing.startX);
    const startY = Number(drawing.startY);
    const endX = Number(drawing.endX);
    const endY = Number(drawing.endY);

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);

    if (!Number.isFinite(length) || length === 0) {
        return { x: midX, y: midY };
    }

    const offset = 30;
    const normalX = (-dy / length) * offset;
    const normalY = (dx / length) * offset;

    return { x: midX + normalX, y: midY + normalY };
}

function drawCurvedArrow(ctx, drawing) {
    const controlPoint = getCurveControlPoint(drawing);
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, drawing.endX, drawing.endY);
    ctx.stroke();

    drawArrowHead(ctx, controlPoint.x, controlPoint.y, drawing.endX, drawing.endY);
}

function drawCurve(ctx, drawing) {
    const controlPoint = getCurveControlPoint(drawing);

    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, drawing.endX, drawing.endY);
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

function drawMagnifier(ctx, drawing, video, stage, effectiveZoom, cx, cy) {
    const legacyDx = Number(drawing.endX) - Number(drawing.startX);
    const legacyDy = Number(drawing.endY) - Number(drawing.startY);

    const radius = clamp(
        Number.isFinite(Number(drawing.radius)) ? Number(drawing.radius) : Math.hypot(legacyDx, legacyDy),
        20,
        280,
    );

    const zoomFactor = clamp(Number(drawing.zoom || 2), 1.2, 4);

    const handleX = Number.isFinite(Number(drawing.handleX)) ? Number(drawing.handleX) : drawing.startX;
    const handleY = Number.isFinite(Number(drawing.handleY)) ? Number(drawing.handleY) : drawing.startY;
    const handleRadius = clamp(Number(drawing.handleRadius ?? 12), 8, 30);

    ctx.save();

    ctx.beginPath();
    ctx.arc(drawing.startX, drawing.startY, radius, 0, 2 * Math.PI);
    ctx.clip();

    if (video instanceof HTMLVideoElement && stage instanceof HTMLElement && video.videoWidth && video.videoHeight) {
        const stageRect = stage.getBoundingClientRect();
        const videoRect = video.getBoundingClientRect();

        const videoLeft = videoRect.left - stageRect.left;
        const videoTop = videoRect.top - stageRect.top;
        const videoWidth = videoRect.width || 1;
        const videoHeight = videoRect.height || 1;

        const displayX = (handleX - cx) * effectiveZoom + cx;
        const displayY = (handleY - cy) * effectiveZoom + cy;
        const displayRadius = radius * effectiveZoom;

        const relX = displayX - videoLeft;
        const relY = displayY - videoTop;

        const naturalX = clamp((relX / videoWidth) * video.videoWidth, 0, video.videoWidth);
        const naturalY = clamp((relY / videoHeight) * video.videoHeight, 0, video.videoHeight);

        const sourceW = Math.max(1, ((displayRadius * 2) / zoomFactor) * (video.videoWidth / videoWidth));
        const sourceH = Math.max(1, ((displayRadius * 2) / zoomFactor) * (video.videoHeight / videoHeight));

        const sourceX = clamp(naturalX - sourceW / 2, 0, Math.max(0, video.videoWidth - sourceW));
        const sourceY = clamp(naturalY - sourceH / 2, 0, Math.max(0, video.videoHeight - sourceH));

        ctx.drawImage(
            video,
            sourceX,
            sourceY,
            sourceW,
            sourceH,
            drawing.startX - radius,
            drawing.startY - radius,
            radius * 2,
            radius * 2,
        );
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(drawing.startX - radius, drawing.startY - radius, radius * 2, radius * 2);
    }

        ctx.restore();

    ctx.save();
    ctx.strokeStyle = drawing.color || '#FFFFFF';
    ctx.lineWidth = clamp(Number(drawing.lineWidth || 3), 1, 10);
    ctx.beginPath();
    ctx.arc(drawing.startX, drawing.startY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.lineTo(handleX, handleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(handleX, handleY, handleRadius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = (drawing.color || '#FFFFFF') + '22';
    ctx.beginPath();
    ctx.arc(handleX, handleY, handleRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
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
    const p0x = Number(drawing.startX);
    const p0y = Number(drawing.startY);
    const p2x = Number(drawing.endX);
    const p2y = Number(drawing.endY);

    const hasControl =
        Object.prototype.hasOwnProperty.call(drawing, 'controlX') &&
        Object.prototype.hasOwnProperty.call(drawing, 'controlY') &&
        Number.isFinite(Number(drawing.controlX)) &&
        Number.isFinite(Number(drawing.controlY));

    const p1x = hasControl ? Number(drawing.controlX) : p0x + 60;
    const p1y = hasControl ? Number(drawing.controlY) : p0y;

    const v1x = p1x - p0x;
    const v1y = p1y - p0y;
    const v2x = p2x - p0x;
    const v2y = p2y - p0y;

    const theta1 = Math.atan2(v1y, v1x);
    const theta2 = Math.atan2(v2y, v2x);

    const normalized1 = ((theta1 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const normalized2 = ((theta2 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // On screen (y down), angles increase clockwise.
    // Right turn (clockwise) => negative, left turn (counterclockwise) => positive.
    const cwRad = ((normalized2 - normalized1) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const ccwRad = (2 * Math.PI - cwRad) % (2 * Math.PI);

    const cwDeg = (cwRad * 180) / Math.PI;
    const ccwDeg = (ccwRad * 180) / Math.PI;

    const prefersCw = cwDeg <= ccwDeg;
    const primaryDeg = prefersCw ? cwDeg : ccwDeg;
    const secondaryDeg = prefersCw ? ccwDeg : cwDeg;
    const primarySign = prefersCw ? '−' : '+';
    const secondarySign = prefersCw ? '+' : '−';

    ctx.save();
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const verticalLength = 120;
    ctx.moveTo(drawing.startX, drawing.startY - verticalLength);
    ctx.lineTo(drawing.startX, drawing.startY + verticalLength);
    ctx.stroke();

    ctx.beginPath();
    const horizontalLength = 120;
    ctx.moveTo(drawing.startX - horizontalLength, drawing.startY);
    ctx.lineTo(drawing.startX + horizontalLength, drawing.startY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = drawing.lineWidth || 3;
    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.lineTo(p1x, p1y);
    ctx.moveTo(p0x, p0y);
    ctx.lineTo(p2x, p2y);
    ctx.stroke();

    const arcRadius = 50;
    const primaryRad = (primaryDeg * Math.PI) / 180;
    ctx.fillStyle = (drawing.color || '#00FFFF') + '80';
    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.arc(
        p0x,
        p0y,
        arcRadius,
        normalized1,
        prefersCw ? normalized1 + primaryRad : normalized1 - primaryRad,
        !prefersCw,
    );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        p0x,
        p0y,
        arcRadius,
        normalized1,
        prefersCw ? normalized1 + primaryRad : normalized1 - primaryRad,
        !prefersCw,
    );
    ctx.stroke();

    ctx.font = 'bold 8px Arial';
    const formatAngle = (sign, deg) => `${sign}${deg.toFixed(1)}°`;
    const primaryText = formatAngle(primarySign, primaryDeg);
    const secondaryText = secondaryDeg === 0 ? '' : ` (${formatAngle(secondarySign, secondaryDeg)})`;
    const text = `${primaryText}${secondaryText}`;
    const textWidth = ctx.measureText(text).width;
    const textAngle = prefersCw ? normalized1 + primaryRad / 2 : normalized1 - primaryRad / 2;
    const textRadius = arcRadius * 0.6;
    const textX = p0x + Math.cos(textAngle) * textRadius;
    const textY = p0y + Math.sin(textAngle) * textRadius;

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
    const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const baseline = -Math.PI / 2;
    const cwDelta = ((normalizedAngle - baseline) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const ccwDelta = (2 * Math.PI - cwDelta) % (2 * Math.PI);
    const prefersCw = cwDelta <= ccwDelta;
    const primaryRad = prefersCw ? cwDelta : ccwDelta;
    const secondaryRad = prefersCw ? ccwDelta : cwDelta;
    const primaryDeg = (primaryRad * 180) / Math.PI;
    const secondaryDeg = (secondaryRad * 180) / Math.PI;
    const primarySign = prefersCw ? '−' : '+';
    const secondarySign = prefersCw ? '+' : '−';

    ctx.save();
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const verticalLength = 120;
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

    const arcRadius = 50;
    ctx.fillStyle = (drawing.color || '#00FFFF') + '80';
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.arc(
        drawing.startX,
        drawing.startY,
        arcRadius,
        baseline,
        prefersCw ? baseline + primaryRad : baseline - primaryRad,
        !prefersCw,
    );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        drawing.startX,
        drawing.startY,
        arcRadius,
        baseline,
        prefersCw ? baseline + primaryRad : baseline - primaryRad,
        !prefersCw,
    );
    ctx.stroke();

    ctx.font = 'bold 8px Arial';
    const formatAngle = (sign, deg) => `${sign}${deg.toFixed(1)}°`;
    const primaryText = formatAngle(primarySign, primaryDeg);
    const secondaryText = secondaryDeg === 0 ? '' : ` (${formatAngle(secondarySign, secondaryDeg)})`;
    const text = `${primaryText}${secondaryText}`;
    const textWidth = ctx.measureText(text).width;
    const textAngle = prefersCw ? baseline + primaryRad / 2 : baseline - primaryRad / 2;
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
    const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const cwDeg = (normalizedAngle * 180) / Math.PI;
    const ccwDeg = (360 - cwDeg) % 360;
    const prefersCw = cwDeg <= ccwDeg;
    const primaryDeg = prefersCw ? cwDeg : ccwDeg;
    const secondaryDeg = prefersCw ? ccwDeg : cwDeg;
    const primarySign = prefersCw ? '−' : '+';
    const secondarySign = prefersCw ? '+' : '−';

    ctx.save();
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const horizontalLength = 120;
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

    const arcRadius = 50;
    const primaryRad = (primaryDeg * Math.PI) / 180;
    ctx.fillStyle = (drawing.color || '#00FFFF') + '80';
    ctx.beginPath();
    ctx.moveTo(drawing.startX, drawing.startY);
    ctx.arc(
        drawing.startX,
        drawing.startY,
        arcRadius,
        0,
        prefersCw ? primaryRad : -primaryRad,
        !prefersCw,
    );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = drawing.color || '#00FFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        drawing.startX,
        drawing.startY,
        arcRadius,
        0,
        prefersCw ? primaryRad : -primaryRad,
        !prefersCw,
    );
    ctx.stroke();

    ctx.font = 'bold 8px Arial';
    const formatAngle = (sign, deg) => `${sign}${deg.toFixed(1)}°`;
    const primaryText = formatAngle(primarySign, primaryDeg);
    const secondaryText = secondaryDeg === 0 ? '' : ` (${formatAngle(secondarySign, secondaryDeg)})`;
    const text = `${primaryText}${secondaryText}`;
    const textWidth = ctx.measureText(text).width;
    const textAngle = prefersCw ? primaryRad / 2 : -primaryRad / 2;
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
    const size = 12;
    ctx.beginPath();
    ctx.moveTo(drawing.x - size, drawing.y);
    ctx.lineTo(drawing.x + size, drawing.y);
    ctx.moveTo(drawing.x, drawing.y - size);
    ctx.lineTo(drawing.x, drawing.y + size);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(drawing.x, drawing.y, 2, 0, 2 * Math.PI);
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
    // Text is rendered as an overlay element (see renderTextOverlays).
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
        if (Number.isFinite(zoomBase)) {
            return clamp(zoomBase, 0.1, 6);
        }
        return 1;
    };

    const computeFitZoom = () => {
        if (!ui.stage || !ui.video.videoWidth || !ui.video.videoHeight) return 1;

        const stageRect = ui.stage.getBoundingClientRect();
        const maxWidth = Math.max(1, stageRect.width - 32);
        const maxHeight = Math.max(1, stageRect.height - 120);
        const scaleX = maxWidth / ui.video.videoWidth;
        const scaleY = maxHeight / ui.video.videoHeight;
        const fit = Math.min(scaleX, scaleY);
        return clamp(fit, 0.1, 6);
    };

    const resolvedZoomBase = resolveZoomBase();

    const resolveZoom = () => {
        if (Number.isFinite(defaultZoom)) {
            return clamp(defaultZoom, 0.1, 3);
        }

        const fit = computeFitZoom();
        // 枠内に収まるフィット倍率を上限1.0に抑えて「いきなり拡大」しない
        const safeFit = Math.min(fit, 1);
        return clamp(safeFit / resolvedZoomBase, 0.1, 1);
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
        fontSize: Number(initial.settings?.fontSize || 14),
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
        editingTextId: null,
        editingNoteId: null,
        textDrag: null,
        angleDraftPhase: null,
        zoomDisplayBase: 1,
        zoomInitialized: false,
        comparisons: Array.isArray(initial.comparisons) ? initial.comparisons : [],
        comparisonMode: false,
        selectedSnapshotsForComparison: [],
        comparisonSearchTerm: '',
        comparisonSortMode: 'newest',
        comparisonFavoritesOnly: false,
    };

    function ensureLegacyTextIds() {
        state.drawings = state.drawings.map((d, idx) => {
            if (!d || typeof d !== 'object') return d;
            if (d.tool !== 'text') return d;
            if (typeof d.id === 'string' && d.id !== '') return d;
            const time = typeof d.time === 'number' ? d.time : 0;
            return { ...d, id: `legacy-text-${idx}-${Math.round(time * 1000)}` };
        });
    }

    ensureLegacyTextIds();

    function ensureCurveControlPoints() {
        state.drawings = state.drawings.map((d) => {
            if (!d || typeof d !== 'object') return d;
            if (d.tool !== 'arrow-curve' && d.tool !== 'curve') return d;
            const hasControl = Number.isFinite(Number(d.controlX)) && Number.isFinite(Number(d.controlY));
            if (hasControl) return d;
            const control = getCurveControlPoint(d);
            return { ...d, controlX: control.x, controlY: control.y };
        });
    }

    ensureCurveControlPoints();

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
	    let pendingTextEdit = null;
	    let pendingNoteEdit = null;
	    let editSession = null;

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
        const effectiveZoom = clamp(state.zoom * resolvedZoomBase, 0.1, 6);
        ui.mediaWrap.style.transform = `scale(${effectiveZoom})`;
        ui.mediaWrap.style.transformOrigin = 'center center';
        ui.noteLayer.style.transform = `scale(${effectiveZoom})`;
        ui.noteLayer.style.transformOrigin = 'center center';

        const base = state.zoomDisplayBase && Number.isFinite(state.zoomDisplayBase) ? state.zoomDisplayBase : 1;
        const displayPct = clamp((state.zoom / base) * 100, 1, 999);
        ui.zoomLabel.textContent = `${Math.round(displayPct)}%`;
    };

    const resizeCanvas = () => {
        const rect = ui.stage.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        ui.canvas.width = Math.max(1, Math.round(rect.width * dpr));
        ui.canvas.height = Math.max(1, Math.round(rect.height * dpr));
        ui.canvas.style.width = `${rect.width}px`;
        ui.canvas.style.height = `${rect.height}px`;
        ui.canvas.style.left = '0px';
        ui.canvas.style.top = '0px';

        ui.noteLayer.style.width = `${rect.width}px`;
        ui.noteLayer.style.height = `${rect.height}px`;
        ui.noteLayer.style.left = '0px';
        ui.noteLayer.style.top = '0px';

        ui.boardWrap.style.width = `${rect.width}px`;
        ui.boardWrap.style.height = `${rect.height}px`;
        ui.boardWrap.style.left = '0px';
        ui.boardWrap.style.top = '0px';
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
	                tool === 'grid' ||
	                tool === 'magnifier'
	            ) {
	                let next = mapPair(drawing, 'startX', 'startY');
	                next = mapPair(next, 'endX', 'endY');
	                if (tool === 'angle' && Object.prototype.hasOwnProperty.call(drawing, 'controlX') && Object.prototype.hasOwnProperty.call(drawing, 'controlY')) {
	                    next = mapPair(next, 'controlX', 'controlY');
	                }
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
	    ui.drawingOptions.classList.remove('hidden');

        ui.colorButtons.forEach((btn) => {
            const color = btn.getAttribute('data-color');
            const isActive = color === state.drawColor;
            btn.classList.toggle('border-white', isActive);
            btn.classList.toggle('scale-110', isActive);
            btn.classList.toggle('border-transparent', !isActive);
        });

        ui.lineWidth.value = String(clamp(state.lineWidth, 1, 10));
        ui.lineWidthLabel.textContent = `${clamp(state.lineWidth, 1, 10)}px`;

        ui.fontSize.value = String(clamp(state.fontSize, 10, 48));
        ui.fontSizeLabel.textContent = `${clamp(state.fontSize, 10, 48)}px`;

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

        renderSnapshotMarkers();
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
	            renderSnapshotMarkers();
	            return;
	        }

	        ui.snapshots.innerHTML = snapshots
	            .map((snapshot, idx) => {
	                const deleteButton = readOnly
	                    ? ''
	                    : `<button type="button" data-action="delete-snapshot" data-snapshot="${idx}" class="absolute top-1 right-1 hidden group-hover:flex items-center justify-center h-6 w-6 rounded bg-black/60 hover:bg-black/80 text-white/90 z-10">×</button>`;
	                const memoHtml = snapshot.memo
	                    ? `<div class="mt-1 text-xs text-gray-300 bg-[#333] rounded p-1.5 line-clamp-3">${escapeHtml(snapshot.memo)}</div>`
	                    : '';

	                // 比較モード時の選択状態を表示
	                const isSelected = state.comparisonMode && state.selectedSnapshotsForComparison.includes(idx);
	                const selectionOrder = isSelected ? state.selectedSnapshotsForComparison.indexOf(idx) + 1 : '';
	                const ringClass = state.comparisonMode
	                    ? (isSelected ? 'ring-2 ring-green-500' : 'hover:ring-2 ring-yellow-500')
	                    : 'hover:ring-2 ring-[#0078d4]';
	                const selectionBadge = isSelected
	                    ? `<div class="absolute top-1 left-1 bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10">${selectionOrder}</div>`
	                    : '';

		                return `
		          <div data-snapshot="${idx}" class="relative group cursor-pointer ${ringClass} rounded bg-[#1e1e1e] p-2">
		            ${selectionBadge}
		            ${deleteButton}
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

	                // 比較モード時の選択処理
	                if (state.comparisonMode && !readOnly) {
	                    handleSnapshotSelectionForComparison(idx);
	                    return;
	                }

	                ui.video.currentTime = clamp(snapshot.time, 0, state.duration || snapshot.time);
	            });
	        });

	        ui.snapshots.querySelectorAll('[data-action="delete-snapshot"]').forEach((btn) => {
	            btn.addEventListener('click', (event) => {
	                if (readOnly) return;
	                event.preventDefault();
	                event.stopPropagation();

	                const idx = Number(btn.getAttribute('data-snapshot'));
	                if (!Number.isFinite(idx)) return;

	                state.frameSnapshots = state.frameSnapshots.filter((_, i) => i !== idx);
	                renderSnapshots();
	                updatePlaybackUi();
	                scheduleAutosave();
	            });
	        });

	        renderSnapshotMarkers();
	    };

    const handleSnapshotSelectionForComparison = async (idx) => {
        if (state.selectedSnapshotsForComparison.includes(idx)) {
            // 選択解除
            state.selectedSnapshotsForComparison = state.selectedSnapshotsForComparison.filter(i => i !== idx);
            renderSnapshots();
            return;
        }

        if (state.selectedSnapshotsForComparison.length >= 2) {
            // 既に2つ選択済みの場合は最初の選択をクリア
            state.selectedSnapshotsForComparison = [state.selectedSnapshotsForComparison[1], idx];
        } else {
            state.selectedSnapshotsForComparison.push(idx);
        }

        renderSnapshots();

        // 2つ選択されたら比較を作成
        if (state.selectedSnapshotsForComparison.length === 2) {
            await createComparison(state.selectedSnapshotsForComparison[0], state.selectedSnapshotsForComparison[1]);
        }
    };

    const createComparison = async (beforeIndex, afterIndex) => {
        const title = prompt('比較のタイトルを入力してください:', 'フォーム改善');
        if (!title) {
            state.selectedSnapshotsForComparison = [];
            renderSnapshots();
            return;
        }

        const description = prompt('説明を入力してください（省略可）:', '') || '';

        try {
            const url = root.dataset.saveUrl.replace('/annotations', '/comparisons');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    before_snapshot_index: beforeIndex,
                    after_snapshot_index: afterIndex,
                    title,
                    description,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create comparison');
            }

            const data = await response.json();
            if (data.ok && data.comparison) {
                state.comparisons.push(data.comparison);
                renderComparisons();
            }

            // 選択をクリア
            state.selectedSnapshotsForComparison = [];
            state.comparisonMode = false;

            if (ui.comparisonModeButton) {
                ui.comparisonModeButton.textContent = '作成モード';
                ui.comparisonModeButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                ui.comparisonModeButton.classList.add('bg-[#0078d4]', 'hover:bg-[#106ebe]');
            }

            if (ui.comparisonModeHint) {
                ui.comparisonModeHint.classList.add('hidden');
            }

            renderSnapshots();
            alert('比較を作成しました！');
        } catch (error) {
            console.error('Failed to create comparison:', error);
            alert('比較の作成に失敗しました');
            state.selectedSnapshotsForComparison = [];
            renderSnapshots();
        }
    };

    const renderComparisons = () => {
        if (!ui.comparisons || readOnly) return;

        let comparisons = state.comparisons.filter((c) => c && typeof c.id === 'string');

        // フィルター処理
        if (state.comparisonSearchTerm) {
            const searchLower = state.comparisonSearchTerm.toLowerCase();
            comparisons = comparisons.filter((c) => {
                const title = (c.title || '').toLowerCase();
                const description = (c.description || '').toLowerCase();
                return title.includes(searchLower) || description.includes(searchLower);
            });
        }

        // お気に入りフィルター
        if (state.comparisonFavoritesOnly) {
            comparisons = comparisons.filter((c) => c.favorite === true);
        }

        // ソート処理
        comparisons = [...comparisons]; // 元の配列を変更しないようにコピー
        if (state.comparisonSortMode === 'newest') {
            comparisons.reverse(); // 配列の末尾が最新と仮定
        } else if (state.comparisonSortMode === 'oldest') {
            // そのまま (配列の先頭が古いと仮定)
        } else if (state.comparisonSortMode === 'title-asc') {
            comparisons.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else if (state.comparisonSortMode === 'title-desc') {
            comparisons.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        }

        if (comparisons.length === 0) {
            ui.comparisons.innerHTML = `<div class="text-xs text-gray-400">${state.comparisonSearchTerm ? '検索結果がありません' : 'まだありません'}</div>`;
            return;
        }

        ui.comparisons.innerHTML = comparisons
            .map((comparison, idx) => {
                const beforeSnapshot = state.frameSnapshots.find(s => s.id === comparison.before_snapshot_id);
                const afterSnapshot = state.frameSnapshots.find(s => s.id === comparison.after_snapshot_id);

                if (!beforeSnapshot || !afterSnapshot) return '';

                const isFavorite = comparison.favorite === true;
                const tags = Array.isArray(comparison.tags) ? comparison.tags : [];

                return `
                    <div data-comparison="${idx}" data-comparison-id="${escapeAttribute(comparison.id)}" class="relative group cursor-pointer hover:ring-2 ring-green-500 rounded bg-[#1e1e1e] p-2">
                        <div class="absolute top-1 left-1 z-10">
                            <button type="button" data-action="toggle-favorite" data-comparison-id="${escapeAttribute(comparison.id)}" class="flex items-center justify-center h-6 w-6 rounded ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}" title="${isFavorite ? 'お気に入り解除' : 'お気に入り'}">
                                <svg class="w-4 h-4" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </button>
                        </div>
                        <div class="absolute top-1 right-1 hidden group-hover:flex gap-1 z-10">
                            <button type="button" data-action="add-tag" data-comparison-id="${escapeAttribute(comparison.id)}" class="flex items-center justify-center h-6 w-6 rounded bg-purple-600/80 hover:bg-purple-700 text-white/90" title="タグ追加">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </button>
                            <button type="button" data-action="edit-comparison" data-comparison-id="${escapeAttribute(comparison.id)}" class="flex items-center justify-center h-6 w-6 rounded bg-blue-600/80 hover:bg-blue-700 text-white/90" title="編集">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button type="button" data-action="delete-comparison" data-comparison-id="${escapeAttribute(comparison.id)}" class="flex items-center justify-center h-6 w-6 rounded bg-black/60 hover:bg-black/80 text-white/90" title="削除">×</button>
                        </div>
                        <div class="grid grid-cols-2 gap-2 mt-6">
                            <div class="text-center">
                                <img src="${escapeAttribute(withShare(beforeSnapshot.url || ''))}" alt="Before" class="w-full rounded" />
                                <div class="mt-1 text-xs text-blue-400">Before</div>
                            </div>
                            <div class="text-center">
                                <img src="${escapeAttribute(withShare(afterSnapshot.url || ''))}" alt="After" class="w-full rounded" />
                                <div class="mt-1 text-xs text-green-400">After</div>
                            </div>
                        </div>
                        <div class="mt-2">
                            <div class="text-xs text-gray-300 font-semibold" data-role="comparison-title">${escapeHtml(comparison.title || '比較')}</div>
                            ${comparison.description ? `<div class="mt-1 text-xs text-gray-400" data-role="comparison-description">${escapeHtml(comparison.description)}</div>` : '<div class="mt-1 text-xs text-gray-400" data-role="comparison-description"></div>'}
                            ${tags.length > 0 ? `
                            <div class="mt-1 flex flex-wrap gap-1">
                                ${tags.map(tag => `<span class="inline-block px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded text-xs">${escapeHtml(tag)}</span>`).join('')}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            })
            .filter(Boolean)
            .join('');

        // クリックイベント
        ui.comparisons.querySelectorAll('[data-comparison]').forEach((el) => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('[data-action="delete-comparison"]')) return;
                if (e.target.closest('[data-action="edit-comparison"]')) return;
                if (e.target.closest('[data-action="toggle-favorite"]')) return;
                if (e.target.closest('[data-action="add-tag"]')) return;
                const idx = Number(el.getAttribute('data-comparison'));
                const comparison = comparisons[idx];
                if (!comparison) return;
                openComparisonViewer(comparison, comparisons, idx);
            });
        });

        // 編集ボタン
        ui.comparisons.querySelectorAll('[data-action="edit-comparison"]').forEach((btn) => {
            btn.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();

                const comparisonId = btn.getAttribute('data-comparison-id');
                if (!comparisonId) return;

                const comparison = comparisons.find(c => c.id === comparisonId);
                if (!comparison) return;

                const newTitle = prompt('タイトルを入力してください:', comparison.title || '');
                if (newTitle === null) return; // キャンセル時

                const newDescription = prompt('説明を入力してください:', comparison.description || '');
                if (newDescription === null) return; // キャンセル時

                try {
                    const url = root.dataset.saveUrl.replace('/annotations', `/comparisons/${encodeURIComponent(comparisonId)}`);
                    const response = await fetch(url, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                        body: JSON.stringify({
                            title: newTitle,
                            description: newDescription,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update comparison');
                    }

                    const data = await response.json();
                    if (data.ok && data.comparison) {
                        // state内の比較を更新
                        const index = state.comparisons.findIndex(c => c.id === comparisonId);
                        if (index !== -1) {
                            state.comparisons[index] = data.comparison;
                            renderComparisons();
                        }
                    }
                } catch (error) {
                    console.error('Failed to update comparison:', error);
                    alert('比較の更新に失敗しました');
                }
            });
        });

        // 削除ボタン
        ui.comparisons.querySelectorAll('[data-action="delete-comparison"]').forEach((btn) => {
            btn.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();

                const comparisonId = btn.getAttribute('data-comparison-id');
                if (!comparisonId) return;

                if (!confirm('この比較を削除しますか？')) return;

                try {
                    const url = root.dataset.saveUrl.replace('/annotations', `/comparisons/${encodeURIComponent(comparisonId)}`);
                    const response = await fetch(url, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to delete comparison');
                    }

                    state.comparisons = state.comparisons.filter((c) => c.id !== comparisonId);
                    renderComparisons();
                } catch (error) {
                    console.error('Failed to delete comparison:', error);
                    alert('比較の削除に失敗しました');
                }
            });
        });

        // お気に入りボタン
        ui.comparisons.querySelectorAll('[data-action="toggle-favorite"]').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                const comparisonId = btn.getAttribute('data-comparison-id');
                if (!comparisonId) return;

                const index = state.comparisons.findIndex(c => c.id === comparisonId);
                if (index === -1) return;

                // お気に入り状態をトグル
                state.comparisons[index].favorite = !state.comparisons[index].favorite;
                renderComparisons();
                saveAnnotations();
            });
        });

        // タグ追加ボタン
        ui.comparisons.querySelectorAll('[data-action="add-tag"]').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                const comparisonId = btn.getAttribute('data-comparison-id');
                if (!comparisonId) return;

                const index = state.comparisons.findIndex(c => c.id === comparisonId);
                if (index === -1) return;

                const newTag = prompt('タグを入力してください:');
                if (!newTag || newTag.trim() === '') return;

                const trimmedTag = newTag.trim();
                const tags = Array.isArray(state.comparisons[index].tags) ? state.comparisons[index].tags : [];

                if (!tags.includes(trimmedTag)) {
                    state.comparisons[index].tags = [...tags, trimmedTag];
                    renderComparisons();
                    saveAnnotations();
                }
            });
        });
    };

    const openComparisonViewer = (comparison, allComparisons = null, startIndex = 0) => {
        // allComparisonsが提供された場合はスライドショーモード
        const isSlideshowMode = allComparisons && allComparisons.length > 1;
        let currentIndex = startIndex;
        let autoPlayInterval = null;
        let isAutoPlaying = false;

        const beforeSnapshot = state.frameSnapshots.find(s => s.id === comparison.before_snapshot_id);
        const afterSnapshot = state.frameSnapshots.find(s => s.id === comparison.after_snapshot_id);

        if (!beforeSnapshot || !afterSnapshot) return;

        // モーダルを作成
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-[#1e1e1e] rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto p-6">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h2 class="text-xl font-semibold text-white" data-role="title">${escapeHtml(comparison.title || 'Before/After比較')}</h2>
                        <p class="text-sm text-gray-400 mt-1" data-role="description">${comparison.description ? escapeHtml(comparison.description) : ''}</p>
                        ${isSlideshowMode ? `<div class="text-xs text-gray-500 mt-2" data-role="counter">${currentIndex + 1} / ${allComparisons.length}</div>` : ''}
                    </div>
                    <button type="button" class="text-white hover:text-gray-300 text-2xl ml-4" data-action="close-modal">&times;</button>
                </div>
                <div class="comparison-slider-container"></div>
                ${isSlideshowMode ? `
                <div class="flex items-center justify-center gap-4 mt-4">
                    <button type="button" data-action="prev" class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed">
                        ← 前へ
                    </button>
                    <button type="button" data-action="toggle-autoplay" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                        再生
                    </button>
                    <button type="button" data-action="next" class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed">
                        次へ →
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        let sliderInput, sliderHandle, afterClip, sliderValue, sliderContainer;
        let isDragging = false;

        const renderSlider = (comp) => {
            const before = state.frameSnapshots.find(s => s.id === comp.before_snapshot_id);
            const after = state.frameSnapshots.find(s => s.id === comp.after_snapshot_id);

            if (!before || !after) return;

            // スライダーを初期化
            const container = modal.querySelector('.comparison-slider-container');
            container.innerHTML = `
                <div class="relative w-full bg-zinc-800 rounded-lg overflow-hidden" style="aspect-ratio: 16/9;">
                    <div class="absolute inset-0">
                        <img src="${escapeAttribute(withShare(before.url))}" alt="Before" class="w-full h-full object-contain" />
                        <div class="absolute bottom-2 left-2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">Before</div>
                    </div>
                    <div class="absolute inset-0 overflow-hidden" style="clip-path: inset(0 50% 0 0);" data-role="after-clip">
                        <img src="${escapeAttribute(withShare(after.url))}" alt="After" class="w-full h-full object-contain" />
                        <div class="absolute bottom-2 right-2 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">After</div>
                    </div>
                    <div class="absolute inset-y-0 w-1 bg-white shadow-lg cursor-ew-resize z-10" style="left: 50%;" data-role="slider-handle">
                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <svg class="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <input type="range" min="0" max="100" value="50" data-role="slider-input" class="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div class="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Before (0%)</span>
                        <span data-role="slider-value">50%</span>
                        <span>After (100%)</span>
                    </div>
                </div>
            `;

            sliderInput = modal.querySelector('[data-role="slider-input"]');
            sliderHandle = modal.querySelector('[data-role="slider-handle"]');
            afterClip = modal.querySelector('[data-role="after-clip"]');
            sliderValue = modal.querySelector('[data-role="slider-value"]');
            sliderContainer = modal.querySelector('[style*="aspect-ratio"]');

            const updateSlider = (percent) => {
                sliderHandle.style.left = `${percent}%`;
                afterClip.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
                sliderValue.textContent = `${Math.round(percent)}%`;
            };

            sliderInput.addEventListener('input', (e) => {
                updateSlider(Number(e.target.value));
            });

            // ドラッグ機能
            const handleDrag = (e) => {
                if (!isDragging) return;
                const rect = sliderContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                sliderInput.value = percent;
                updateSlider(percent);
            };

            sliderHandle.addEventListener('mousedown', () => {
                isDragging = true;
            });

            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        };

        const updateContent = () => {
            const comp = allComparisons[currentIndex];
            modal.querySelector('[data-role="title"]').textContent = comp.title || 'Before/After比較';
            modal.querySelector('[data-role="description"]').textContent = comp.description || '';
            if (isSlideshowMode) {
                modal.querySelector('[data-role="counter"]').textContent = `${currentIndex + 1} / ${allComparisons.length}`;
            }
            renderSlider(comp);
            updateNavigationButtons();
        };

        const updateNavigationButtons = () => {
            if (!isSlideshowMode) return;
            const prevBtn = modal.querySelector('[data-action="prev"]');
            const nextBtn = modal.querySelector('[data-action="next"]');
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === allComparisons.length - 1;
        };

        const goToPrev = () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateContent();
            }
        };

        const goToNext = () => {
            if (currentIndex < allComparisons.length - 1) {
                currentIndex++;
                updateContent();
            } else if (isAutoPlaying) {
                // 最後まで行ったら自動再生を停止
                stopAutoPlay();
            }
        };

        const startAutoPlay = () => {
            if (isAutoPlaying) return;
            isAutoPlaying = true;
            const toggleBtn = modal.querySelector('[data-action="toggle-autoplay"]');
            toggleBtn.textContent = '停止';
            autoPlayInterval = setInterval(goToNext, 3000);
        };

        const stopAutoPlay = () => {
            if (!isAutoPlaying) return;
            isAutoPlaying = false;
            const toggleBtn = modal.querySelector('[data-action="toggle-autoplay"]');
            toggleBtn.textContent = '再生';
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        };

        const cleanup = () => {
            stopAutoPlay();
            modal.remove();
        };

        // 初回レンダリング
        renderSlider(comparison);

        if (isSlideshowMode) {
            updateNavigationButtons();

            // ナビゲーションボタン
            modal.querySelector('[data-action="prev"]').addEventListener('click', () => {
                stopAutoPlay();
                goToPrev();
            });

            modal.querySelector('[data-action="next"]').addEventListener('click', () => {
                stopAutoPlay();
                goToNext();
            });

            modal.querySelector('[data-action="toggle-autoplay"]').addEventListener('click', () => {
                if (isAutoPlaying) {
                    stopAutoPlay();
                } else {
                    startAutoPlay();
                }
            });

            // キーボードナビゲーション
            const handleKeyDown = (e) => {
                if (e.key === 'ArrowLeft') {
                    stopAutoPlay();
                    goToPrev();
                } else if (e.key === 'ArrowRight') {
                    stopAutoPlay();
                    goToNext();
                } else if (e.key === ' ') {
                    e.preventDefault();
                    if (isAutoPlaying) {
                        stopAutoPlay();
                    } else {
                        startAutoPlay();
                    }
                } else if (e.key === 'Escape') {
                    cleanup();
                }
            };

            document.addEventListener('keydown', handleKeyDown);

            // クリーンアップ時にキーボードリスナーも削除
            const originalCleanup = cleanup;
            modal._cleanup = () => {
                document.removeEventListener('keydown', handleKeyDown);
                originalCleanup();
            };
        } else {
            modal._cleanup = cleanup;
        }

        // 閉じるボタン
        modal.querySelector('[data-action="close-modal"]').addEventListener('click', () => {
            modal._cleanup();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal._cleanup();
            }
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
            x: worldX,
            y: worldY,
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

    const pointToQuadraticBezierDistance = (px, py, p0x, p0y, p1x, p1y, p2x, p2y) => {
        let minDist = Infinity;
        const steps = 30;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const mt = 1 - t;
            const bx = mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x;
            const by = mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y;
            const dist = Math.hypot(px - bx, py - by);
            if (dist < minDist) minDist = dist;
        }
        return minDist;
    };
    const hitThreshold = () => {
        const z = clamp(state.zoom * resolvedZoomBase, 0.5, 4);
        return clamp(16 / z, 10, 28);
    };

    const findDrawingAtPoint = (x, y) => {
        const threshold = hitThreshold();
        for (let i = state.drawings.length - 1; i >= 0; i--) {
            const drawing = state.drawings[i];
            if (!drawing) continue;
            if (Math.abs(drawing.time - state.currentTime) > 2) continue;

            if (
                drawing.tool === 'line' ||
                drawing.tool === 'arrow' ||
                drawing.tool === 'arrow-dash' ||
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
            } else if (drawing.tool === 'arrow-curve') {
                const control = getCurveControlPoint(drawing);
                const distCurve = pointToQuadraticBezierDistance(
                    x,
                    y,
                    Number(drawing.startX),
                    Number(drawing.startY),
                    control.x,
                    control.y,
                    Number(drawing.endX),
                    Number(drawing.endY),
                );
                const distControl = Math.hypot(x - control.x, y - control.y);
                if (Math.min(distCurve, distControl) < threshold) return i;
            } else if (drawing.tool === 'angle') {
                const hasControl =
                    Object.prototype.hasOwnProperty.call(drawing, 'controlX') &&
                    Object.prototype.hasOwnProperty.call(drawing, 'controlY') &&
                    Number.isFinite(Number(drawing.controlX)) &&
                    Number.isFinite(Number(drawing.controlY));

                const p0x = Number(drawing.startX);
                const p0y = Number(drawing.startY);
                const p1x = hasControl ? Number(drawing.controlX) : p0x + 60;
                const p1y = hasControl ? Number(drawing.controlY) : p0y;
                const p2x = Number(drawing.endX);
                const p2y = Number(drawing.endY);

                const dist1 = pointToLineDistance(x, y, p0x, p0y, p1x, p1y);
                const dist2 = pointToLineDistance(x, y, p0x, p0y, p2x, p2y);
                if (Math.min(dist1, dist2) < threshold) return i;
            } else if (drawing.tool === 'magnifier') {
                const radius = clamp(
                    Number.isFinite(Number(drawing.radius))
                        ? Number(drawing.radius)
                        : Math.hypot(Number(drawing.endX) - Number(drawing.startX), Number(drawing.endY) - Number(drawing.startY)),
                    20,
                    280,
                );

                const distToCenter = Math.hypot(x - drawing.startX, y - drawing.startY);
                if (distToCenter <= radius) return i;

                const handleX = Number.isFinite(Number(drawing.handleX))
                    ? Number(drawing.handleX)
                    : drawing.startX + radius * 0.8;
                const handleY = Number.isFinite(Number(drawing.handleY))
                    ? Number(drawing.handleY)
                    : drawing.startY + radius * 0.8;
                const handleRadius = clamp(Number(drawing.handleRadius ?? 12), 8, 30);

                if (Math.hypot(x - handleX, y - handleY) < threshold + handleRadius) return i;

                const distToHandleLine = pointToLineDistance(x, y, drawing.startX, drawing.startY, handleX, handleY);
                if (distToHandleLine < threshold) return i;
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
        const threshold = hitThreshold();
        const controlThreshold = threshold * 1.3;

        if (drawing.tool === 'angle') {
            if (Math.hypot(x - drawing.startX, y - drawing.startY) < threshold) return 'start';
            if (Math.hypot(x - drawing.endX, y - drawing.endY) < threshold) return 'end';
            if (
                Object.prototype.hasOwnProperty.call(drawing, 'controlX') &&
                Object.prototype.hasOwnProperty.call(drawing, 'controlY') &&
                Math.hypot(x - Number(drawing.controlX), y - Number(drawing.controlY)) < threshold
            ) {
                return 'control';
            }
        } else if (
            drawing.tool === 'line' ||
            drawing.tool === 'arrow' ||
            drawing.tool === 'arrow-dash' ||
            drawing.tool === 'angle-vertical' ||
            drawing.tool === 'angle-horizontal' ||
            drawing.tool === 'ruler'
        ) {
            if (Math.sqrt(Math.pow(x - drawing.startX, 2) + Math.pow(y - drawing.startY, 2)) < threshold) return 'start';
            if (Math.sqrt(Math.pow(x - drawing.endX, 2) + Math.pow(y - drawing.endY, 2)) < threshold) return 'end';
        } else if (drawing.tool === 'arrow-curve') {
            const control = getCurveControlPoint(drawing);
            // 中央ハンドル優先で判定
            if (Math.hypot(x - control.x, y - control.y) < controlThreshold) return 'control';
            if (Math.sqrt(Math.pow(x - drawing.startX, 2) + Math.pow(y - drawing.startY, 2)) < threshold) return 'start';
            if (Math.sqrt(Math.pow(x - drawing.endX, 2) + Math.pow(y - drawing.endY, 2)) < threshold) return 'end';
        } else if (drawing.tool === 'magnifier') {
            const radius = clamp(
                Number.isFinite(Number(drawing.radius))
                    ? Number(drawing.radius)
                    : Math.hypot(Number(drawing.endX) - Number(drawing.startX), Number(drawing.endY) - Number(drawing.startY)),
                20,
                280,
            );

            const handleX = Number.isFinite(Number(drawing.handleX))
                ? Number(drawing.handleX)
                : drawing.startX + radius * 0.8;
            const handleY = Number.isFinite(Number(drawing.handleY))
                ? Number(drawing.handleY)
                : drawing.startY + radius * 0.8;
            const handleRadius = clamp(Number(drawing.handleRadius ?? 12), 8, 30);

            if (Math.hypot(x - drawing.startX, y - drawing.startY) < threshold) return 'center';
            if (Math.hypot(x - handleX, y - handleY) < threshold + handleRadius) return 'handle';

            const handleLen = Math.hypot(handleX - drawing.startX, handleY - drawing.startY);
            const ux = handleLen > 0 ? (handleX - drawing.startX) / handleLen : 1;
            const uy = handleLen > 0 ? (handleY - drawing.startY) / handleLen : 0;
            const radiusX = drawing.startX + ux * radius;
            const radiusY = drawing.startY + uy * radius;
            if (Math.hypot(x - radiusX, y - radiusY) < threshold) return 'radius';
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
        const frame = Math.round((state.currentTime || 0) * 30) / 30;

        state.drawings = state.drawings.filter((d) => {
            if (!d || typeof d.time !== 'number') return true;
            return Math.round(d.time * 30) / 30 !== frame;
        });

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
	        if (event.button !== 0) return;

        const pos = getMousePos(event);

        if (state.selectedTool === 'move') {
            const drawingIndex = findDrawingAtPoint(pos.x, pos.y);
            if (drawingIndex !== -1) {
                const drawing = state.drawings[drawingIndex];
                let controlPoint = findControlPoint(pos.x, pos.y, drawing);
                if (!controlPoint && drawing.tool === 'arrow-curve') {
                    const control = getCurveControlPoint(drawing);
                    if (Math.hypot(pos.x - control.x, pos.y - control.y) < hitThreshold() * 1.4) {
                        controlPoint = 'control';
                    } else {
                        const distCurve = pointToQuadraticBezierDistance(
                            pos.x,
                            pos.y,
                            Number(drawing.startX),
                            Number(drawing.startY),
                            control.x,
                            control.y,
                            Number(drawing.endX),
                            Number(drawing.endY),
                        );
                        if (distCurve < hitThreshold()) {
                            controlPoint = 'control';
                        }
                    }
                }

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

        if (state.selectedTool === 'text') {
            const id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());

            state.drawings = [
                ...state.drawings,
                {
                    id,
                    tool: 'text',
                    x: pos.x,
                    y: pos.y,
                    text: 'テキスト',
                    time: state.currentTime,
                    color: state.drawColor,
                    lineWidth: state.lineWidth,
                    fontSize: state.fontSize,
                    backgroundColor: '#4a4a4a',
                    space: 'board',
                },
            ];

            state.selectedTool = 'move';
            state.editingTextId = id;
            updateToolbarUi();
            updateDrawingOptionsUi();
            scheduleAutosave();
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

	        if (state.selectedTool === 'angle') {
	            if (state.isDrawing && state.currentDrawing && state.currentDrawing.tool === 'angle') {
	                if (state.angleDraftPhase === 'control') {
	                    state.currentDrawing = { ...state.currentDrawing, controlX: pos.x, controlY: pos.y, endX: pos.x, endY: pos.y };
	                    state.angleDraftPhase = 'end';
	                    return;
	                }

	                if (state.angleDraftPhase === 'end') {
	                    state.currentDrawing = { ...state.currentDrawing, endX: pos.x, endY: pos.y };
	                    state.drawings = [...state.drawings, state.currentDrawing];
	                    state.currentDrawing = null;
	                    state.isDrawing = false;
	                    state.angleDraftPhase = null;
	                    scheduleAutosave();
	                    return;
	                }
	            }

	            state.isDrawing = true;
	            state.angleDraftPhase = 'control';
	            state.currentDrawing = {
	                tool: 'angle',
	                startX: pos.x,
	                startY: pos.y,
	                controlX: pos.x,
	                controlY: pos.y,
	                endX: pos.x,
	                endY: pos.y,
	                time: state.currentTime,
	                color: state.drawColor,
	                lineWidth: state.lineWidth,
	                space: 'board',
	            };
	            return;
	        }

	        state.isDrawing = true;

        if (state.selectedTool === 'magnifier') {
            const radius = 60;

            state.currentDrawing = {
                tool: 'magnifier',
                startX: pos.x,
                startY: pos.y,
                radius,
                handleX: pos.x,
                handleY: pos.y,
                handleRadius: 14,
                zoom: 2,
                time: state.currentTime,
                color: state.drawColor,
                lineWidth: state.lineWidth,
                space: 'board',
            };
            return;
        }

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
                ...(state.selectedTool === 'magnifier' ? { zoom: 2 } : {}),
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

	                if (drawing.tool === 'magnifier') {
	                    drawing.startX += dx - state.dragState.offsetX;
	                    drawing.startY += dy - state.dragState.offsetY;
	                } else if (drawing.tool === 'angle') {
	                    drawing.startX += dx - state.dragState.offsetX;
	                    drawing.startY += dy - state.dragState.offsetY;
	                    drawing.endX += dx - state.dragState.offsetX;
	                    drawing.endY += dy - state.dragState.offsetY;
	                    drawing.controlX = Number(drawing.controlX) + dx - state.dragState.offsetX;
	                    drawing.controlY = Number(drawing.controlY) + dy - state.dragState.offsetY;
                } else if (
                    drawing.tool === 'line' ||
                    drawing.tool === 'arrow' ||
                    drawing.tool === 'arrow-dash' ||
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
                } else if (drawing.tool === 'arrow-curve') {
                    const deltaX = dx - state.dragState.offsetX;
                    const deltaY = dy - state.dragState.offsetY;
                    drawing.startX += deltaX;
                    drawing.startY += deltaY;
                    drawing.endX += deltaX;
                    drawing.endY += deltaY;
                    const control = getCurveControlPoint(drawing);
                    drawing.controlX = Number.isFinite(Number(drawing.controlX)) ? drawing.controlX + deltaX : control.x + deltaX;
                    drawing.controlY = Number.isFinite(Number(drawing.controlY)) ? drawing.controlY + deltaY : control.y + deltaY;
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
	                } else if (state.dragState.controlPoint === 'control') {
	                    drawing.controlX = pos.x;
	                    drawing.controlY = pos.y;
	                } else if (state.dragState.controlPoint === 'center') {
	                    const dxCenter = pos.x - drawing.startX;
	                    const dyCenter = pos.y - drawing.startY;
	                    drawing.startX = pos.x;
                    drawing.startY = pos.y;
                    if (drawing.tool !== 'magnifier') {
                        drawing.endX += dxCenter;
                        drawing.endY += dyCenter;
                    }
                } else if (state.dragState.controlPoint === 'radius') {
                    if (drawing.tool === 'magnifier') {
                        const radius = clamp(Math.hypot(pos.x - drawing.startX, pos.y - drawing.startY), 30, 280);
                        drawing.radius = radius;
                    } else {
                        drawing.endX = pos.x;
                        drawing.endY = pos.y;
                    }
                } else if (state.dragState.controlPoint === 'handle') {
                    drawing.handleX = pos.x;
                    drawing.handleY = pos.y;
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

	        if (state.selectedTool === 'angle' && state.currentDrawing.tool === 'angle') {
	            if (state.angleDraftPhase === 'control') {
	                state.currentDrawing = { ...state.currentDrawing, controlX: pos.x, controlY: pos.y };
	                return;
	            }

	            if (state.angleDraftPhase === 'end') {
	                state.currentDrawing = { ...state.currentDrawing, endX: pos.x, endY: pos.y };
	                return;
	            }
	        }

	        if (state.selectedTool === 'magnifier' && state.currentDrawing.tool === 'magnifier') {
	            state.currentDrawing = { ...state.currentDrawing, startX: pos.x, startY: pos.y };
	            return;
	        }

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

	    const stopDrawing = (event = null) => {
	        if (state.selectedTool === 'move') {
	            state.dragState = null;
	            return;
	        }

	        if (state.selectedTool === 'angle') {
	            return;
	        }

	        if (state.selectedTool === 'polyline' || state.selectedTool === 'polyline-arrow') {
	            return;
	        }

        if (state.isDrawing && state.currentDrawing) {
            let finalDrawing = state.currentDrawing;
            if (
                (finalDrawing.tool === 'arrow-curve' || finalDrawing.tool === 'curve') &&
                (!Number.isFinite(Number(finalDrawing.controlX)) || !Number.isFinite(Number(finalDrawing.controlY)))
            ) {
                const control = getCurveControlPoint(finalDrawing);
                finalDrawing = { ...finalDrawing, controlX: control.x, controlY: control.y };
            }

            state.drawings = [...state.drawings, finalDrawing];
            state.currentDrawing = null;
            state.freehandPoints = [];
            scheduleAutosave();
        }

        state.isDrawing = false;
    };

    const handleContextMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();

        state.isDrawing = false;
        state.currentDrawing = null;
        state.freehandPoints = [];
        state.dragState = null;

        const pos = getMousePos(event);
        const idx = findDrawingAtPoint(pos.x, pos.y);
        if (idx === -1) {
            state.selectedDrawingIndex = null;
            state.contextMenu = null;
            ui.contextMenu.classList.add('hidden');
            return;
        }

        state.selectedDrawingIndex = idx;
        state.contextMenu = { x: event.clientX, y: event.clientY, drawingIndex: idx };
        ui.contextMenu.classList.remove('hidden');
        ui.contextMenu.style.left = `${state.contextMenu.x}px`;
        ui.contextMenu.style.top = `${state.contextMenu.y}px`;
    };

    const hideContextMenu = () => {
        state.contextMenu = null;
        ui.contextMenu.classList.add('hidden');
    };

    let snapshotMarkersKey = '';

    const renderSnapshotMarkers = () => {
        if (!ui.snapshotMarkers) return;

        const duration = state.duration || 0;
        const snapshots = state.frameSnapshots.filter((s) => s && typeof s.time === 'number');
        const key = `${duration}:${snapshots.map((s) => Number(s.time).toFixed(3)).join(',')}`;

        if (key === snapshotMarkersKey) {
            return;
        }

        snapshotMarkersKey = key;

        if (duration <= 0 || snapshots.length === 0) {
            ui.snapshotMarkers.innerHTML = '';
            return;
        }

        ui.snapshotMarkers.innerHTML = snapshots
            .map((snapshot) => {
                const left = clamp((snapshot.time / duration) * 100, 0, 100);
                return `<div class="absolute top-0 h-full w-0.5 bg-yellow-300/80" style="left:${left}%"></div>`;
            })
            .join('');
    };

    const openTextEditor = ({ clientX, clientY, value, placeholder, mode, session }) => {
        if (readOnly) return;

        const stageRect = ui.stage.getBoundingClientRect();
        const xCss = clamp(clientX - stageRect.left, 0, stageRect.width || 1);
        const yCss = clamp(clientY - stageRect.top, 0, stageRect.height || 1);

        editSession = session;
        state.textInsertTool = mode;

        ui.textInput.classList.remove('hidden');
        ui.textInput.style.left = `${xCss}px`;
        ui.textInput.style.top = `${yCss}px`;
        ui.textInputField.value = value ?? '';
        ui.textInputField.placeholder = placeholder;
        ui.textInputField.focus();
    };

	        const handleTextSubmit = () => {
        if (readOnly) return;

        const text = ui.textInputField.value;
        const trimmed = text.trim();
        if (trimmed !== '') {
            if (state.textInsertTool === 'edit-text' && editSession?.type === 'drawing' && typeof editSession.index === 'number') {
                state.drawings = state.drawings.map((d, i) => (i === editSession.index ? { ...d, text } : d));
            } else if (state.textInsertTool === 'edit-note' && editSession?.type === 'note' && typeof editSession.id === 'string') {
                state.notes = state.notes.map((n) => {
                    if (String(n.id ?? '') !== editSession.id) return n;
                    return { ...n, text };
                });
            } else if (state.textInsertTool === 'note') {
                state.notes = [
                    ...state.notes,
                    {
                        id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
                        time: state.currentTime,
                        x: clamp(state.notePosition.x, 0, 1),
                        y: clamp(state.notePosition.y, 0, 1),
                        targetX: clamp(state.notePosition.x, 0, 1),
                        targetY: clamp(state.notePosition.y, 0, 1),
                        text,
                        maxWidth: 320,
                        fontSize: state.fontSize,
                    },
                ];
            } else {
                state.drawings = [
                    ...state.drawings,
                    {
                        tool: 'text',
                        x: state.textPosition.x,
                        y: state.textPosition.y,
                        text,
                        time: state.currentTime,
                        color: state.drawColor,
                        lineWidth: state.lineWidth,
                        fontSize: state.fontSize,
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
        editSession = null;
	        scheduleAutosave();
	    };

	    const startNoteInlineEdit = (noteId) => {
	        if (readOnly) return;
	        const note = state.notes.find((n) => String(n.id ?? '') === noteId);
	        if (!note) return;

	        state.editingNoteId = noteId;
	        editSession = { type: 'note', id: noteId, original: String(note.text ?? '') };
	        renderNotes();
	    };

    const renderNotes = () => {
        const rect = ui.stage.getBoundingClientRect();
        const width = rect.width || 1;
        const height = rect.height || 1;

        const byId = new Map();
        Array.from(ui.noteLayer.querySelectorAll('[data-note-id]')).forEach((el) => {
            byId.set(el.getAttribute('data-note-id'), el);
        });

        const connectorById = new Map();
        Array.from(ui.noteLayer.querySelectorAll('[data-note-connector-for]')).forEach((el) => {
            connectorById.set(el.getAttribute('data-note-connector-for'), el);
        });

        const targetById = new Map();
        Array.from(ui.noteLayer.querySelectorAll('[data-note-target-for]')).forEach((el) => {
            targetById.set(el.getAttribute('data-note-target-for'), el);
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
                        'absolute rounded-2xl border-2 border-zinc-200 bg-white text-zinc-800 shadow-lg select-none';
                    el.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.15)';

                    const header = document.createElement('div');
                    header.className = 'flex items-center justify-between gap-2 px-3 pt-2.5';

                    const left = document.createElement('div');
                    left.className = 'text-[10px] font-semibold text-zinc-400 uppercase tracking-wider';
                    left.textContent = 'Memo';

                    const right = document.createElement('div');
                    right.className = 'flex items-center gap-1.5';

                    const collapseBtn = document.createElement('button');
                    collapseBtn.type = 'button';
                    collapseBtn.setAttribute('data-note-collapse', '1');
                    collapseBtn.className =
                        'rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 transition-colors';
                    collapseBtn.textContent = '–';

                    const closeBtn = document.createElement('button');
                    closeBtn.type = 'button';
                    closeBtn.setAttribute('data-note-close', '1');
                    closeBtn.className =
                        'rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 transition-colors';
                    closeBtn.textContent = '×';

                    right.appendChild(collapseBtn);
                    right.appendChild(closeBtn);
                    header.appendChild(left);
                    header.appendChild(right);
                    el.appendChild(header);

                    const body = document.createElement('div');
                    body.className = 'px-3 pb-2.5 pt-1';
                    el.appendChild(body);

                    const tail = document.createElement('div');
                    tail.setAttribute('data-note-tail', '1');
                    tail.className =
                        'absolute w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-white';
                    tail.style.filter = 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))';
                    el.appendChild(tail);

                    const textEl = document.createElement('div');
                    textEl.setAttribute('data-note-text', '1');
                    textEl.className = 'whitespace-pre-wrap leading-relaxed';
                    body.appendChild(textEl);

                    const resizeHandle = document.createElement('div');
                    resizeHandle.setAttribute('data-note-resize', '1');
                    resizeHandle.className =
                        'absolute bottom-1.5 right-1.5 h-3 w-3 cursor-se-resize rounded border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 hover:border-zinc-400 transition-colors';
                    el.appendChild(resizeHandle);

                    ui.noteLayer.appendChild(el);

                    el.addEventListener('contextmenu', (event) => {
                        if (readOnly) return;
                        event.preventDefault();
                        const noteId = el.getAttribute('data-note-id') || '';
                        if (noteId === '') return;
                        if (confirm('この吹き出しを削除しますか？')) {
                            state.notes = state.notes.filter((n) => String(n.id ?? '') !== noteId);
                            renderNotes();
                            scheduleAutosave();
                        }
                    });

                    el.addEventListener('pointerdown', (event) => {
                        if (readOnly) return;
                        if (state.selectedTool !== 'move') return;
                        if (event.button !== 0) return;
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
                            pendingNoteEdit = null;
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

                        pendingNoteEdit = {
                            id: noteId,
                            clientX: event.clientX,
                            clientY: event.clientY,
                        };
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
                        renderNotes();
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
                            renderNotes();
                            scheduleAutosave();
                        }
                    });
                }

                let connector = connectorById.get(id);
                if (!connector) {
                    connector = document.createElement('div');
                    connector.setAttribute('data-note-connector-for', id);
                    connector.className = 'absolute h-0.5 bg-white/50 pointer-events-none hidden';
                    ui.noteLayer.appendChild(connector);
                    connectorById.set(id, connector);
                }

                let targetHandle = targetById.get(id);
                if (!targetHandle) {
                    targetHandle = document.createElement('div');
                    targetHandle.setAttribute('data-note-target-for', id);
                    targetHandle.className =
                        'absolute h-3 w-3 rounded-full bg-yellow-300/90 ring-2 ring-black/40 cursor-crosshair hidden';
                    ui.noteLayer.appendChild(targetHandle);
                    targetById.set(id, targetHandle);

                    targetHandle.addEventListener('pointerdown', (event) => {
                        if (readOnly) return;
                        if (state.selectedTool !== 'move') return;
                        if (event.button !== 0) return;
                        event.preventDefault();
                        event.stopPropagation();

                        const noteId = targetHandle.getAttribute('data-note-target-for') || '';
                        if (noteId === '') return;

                        const stageRect = ui.stage.getBoundingClientRect();
                        const sx = stageRect.width || 1;
                        const sy = stageRect.height || 1;

                        const note = state.notes.find((n) => String(n.id ?? '') === noteId);
                        if (!note) return;

                        targetHandle.setPointerCapture(event.pointerId);
                        state.noteDrag = {
                            mode: 'target',
                            id: noteId,
                            startClientX: event.clientX,
                            startClientY: event.clientY,
                            startTargetX: clamp(Number(note.targetX ?? note.x ?? 0), 0, 1),
                            startTargetY: clamp(Number(note.targetY ?? note.y ?? 0), 0, 1),
                            stageW: sx,
                            stageH: sy,
                        };
                    });
                }

	                const noteTextEl = el.querySelector('[data-note-text]');
	                if (noteTextEl) {
	                    if (!noteTextEl.hasAttribute('data-note-editor-bound')) {
	                        noteTextEl.setAttribute('data-note-editor-bound', '1');

	                        noteTextEl.addEventListener('keydown', (event) => {
	                            if (!noteTextEl.isContentEditable) return;
	                            if (event.key === 'Enter') {
	                                event.preventDefault();
	                                noteTextEl.blur();
	                            }
	                            if (event.key === 'Escape') {
	                                event.preventDefault();
	                                const noteId = el.getAttribute('data-note-id') || '';
	                                if (editSession?.type === 'note' && editSession.id === noteId) {
	                                    noteTextEl.textContent = String(editSession.original ?? '');
	                                }
	                                noteTextEl.blur();
	                            }
	                        });

	                        noteTextEl.addEventListener('blur', () => {
	                            const noteId = el.getAttribute('data-note-id') || '';
	                            if (noteId === '' || state.editingNoteId !== noteId) return;

	                            const value = String(noteTextEl.textContent ?? '').trim();
	                            state.notes = state.notes.map((n) => {
	                                if (String(n.id ?? '') !== noteId) return n;
	                                return { ...n, text: value };
	                            });

	                            state.editingNoteId = null;
	                            editSession = null;
	                            renderNotes();
	                            scheduleAutosave();
	                        });
	                    }

	                    const isEditing = state.editingNoteId === id;
	                    const collapsed = !!note.collapsed;
	                    const full = String(note.text ?? '');

	                    // Check if this element was already in edit mode
	                    const wasEditing = noteTextEl.contentEditable === 'true';
	                    const isFocused = document.activeElement === noteTextEl;

	                    // Only update textContent if not currently focused
	                    if (!isFocused) {
	                        const displayText = isEditing ? full : (collapsed ? `${full.slice(0, 18)}${full.length > 18 ? '…' : ''}` : full);
	                        if (noteTextEl.textContent !== displayText) {
	                            noteTextEl.textContent = displayText;
	                        }
	                    }

	                    noteTextEl.style.fontSize = `${Number(note.fontSize || state.fontSize || 14)}px`;

	                    noteTextEl.contentEditable = isEditing ? 'true' : 'false';
	                    noteTextEl.classList.toggle('outline', isEditing);
	                    noteTextEl.classList.toggle('outline-2', isEditing);
	                    noteTextEl.classList.toggle('outline-yellow-300/80', isEditing);
	                    noteTextEl.classList.toggle('bg-yellow-50/10', isEditing);

	                    // Show placeholder style when empty and editing
	                    if (isEditing && full === '') {
	                        noteTextEl.setAttribute('data-placeholder', 'テキストを入力...');
	                    } else {
	                        noteTextEl.removeAttribute('data-placeholder');
	                    }

	                    // Only focus if entering edit mode for the first time and not already focused
	                    if (isEditing && !wasEditing && !isFocused) {
	                        requestAnimationFrame(() => {
	                            try {
	                                noteTextEl.focus();
	                            } catch {
	                                // ignore
	                            }
	                        });
	                    }
	                }

                const xPx = clamp(Number(note.x || 0), 0, 1) * width;
                const yPx = clamp(Number(note.y || 0), 0, 1) * height;
                el.style.left = `${xPx}px`;
                el.style.top = `${yPx}px`;
                const maxWidth = clamp(Number(note.maxWidth || 320), 160, 520);
                el.style.width = note.collapsed ? '11rem' : `${maxWidth}px`;

	                const tail = el.querySelector('[data-note-tail]');
	                if (tail) {
	                    tail.style.display = note.collapsed && state.editingNoteId !== id ? 'none' : 'block';
	                }

                const targetX = clamp(Number(note.targetX ?? note.x ?? 0), 0, 1) * width;
                const targetY = clamp(Number(note.targetY ?? note.y ?? 0), 0, 1) * height;

                const bubbleWidth = el.offsetWidth || maxWidth;
                const bubbleHeight = el.offsetHeight || 44;

                const bubbleLeft = xPx;
                const bubbleTop = yPx;
                const bubbleRight = xPx + bubbleWidth;
                const bubbleBottom = yPx + bubbleHeight;

                const bubbleCenterX = (bubbleLeft + bubbleRight) / 2;
                const bubbleCenterY = (bubbleTop + bubbleBottom) / 2;

                let anchorX = bubbleCenterX;
                let anchorY = bubbleBottom;

                const isTargetInsideBubble =
                    targetX >= bubbleLeft &&
                    targetX <= bubbleRight &&
                    targetY >= bubbleTop &&
                    targetY <= bubbleBottom;

                if (!isTargetInsideBubble) {
                    const dx = targetX - bubbleCenterX;
                    const dy = targetY - bubbleCenterY;
                    const padding = 14;

                    if (Math.abs(dx) > Math.abs(dy)) {
                        anchorX = dx < 0 ? bubbleLeft : bubbleRight;
                        anchorY = clamp(targetY, bubbleTop + padding, bubbleBottom - padding);
                    } else {
                        anchorY = dy < 0 ? bubbleTop : bubbleBottom;
                        anchorX = clamp(targetX, bubbleLeft + padding, bubbleRight - padding);
                    }
                }

                const lineDx = targetX - anchorX;
                const lineDy = targetY - anchorY;
                const length = Math.hypot(lineDx, lineDy);
                const angle = Math.atan2(lineDy, lineDx);

	                connector.style.display = 'none';
                connector.style.left = `${anchorX}px`;
                connector.style.top = `${anchorY}px`;
                connector.style.width = `${Math.max(0, length)}px`;
                connector.style.transform = `rotate(${angle}rad)`;
                connector.style.transformOrigin = '0 0';

	                targetHandle.style.display = 'none';
                targetHandle.style.left = `${targetX - 6}px`;
                targetHandle.style.top = `${targetY - 6}px`;

	                if (tail) {
	                    tail.style.display = 'none';
	                }

                el.style.display = 'block';
            });

        byId.forEach((el, id) => {
            if (!visibleIds.has(String(id))) {
                el.style.display = 'none';
            }
        });

        connectorById.forEach((el, id) => {
            if (!visibleIds.has(String(id))) {
                el.style.display = 'none';
            }
        });

        targetById.forEach((el, id) => {
            if (!visibleIds.has(String(id))) {
                el.style.display = 'none';
            }
        });
    };

    const renderTextOverlays = () => {
        const byId = new Map();
        Array.from(ui.noteLayer.querySelectorAll('[data-text-id]')).forEach((el) => {
            byId.set(el.getAttribute('data-text-id'), el);
        });

        const visibleIds = new Set();

        state.drawings
            .filter((d) => d && d.tool === 'text' && typeof d.time === 'number' && Math.abs(d.time - state.currentTime) <= 2)
            .forEach((drawing, index) => {
                const id = String(drawing.id ?? '');
                if (id === '') {
                    return;
                }

                visibleIds.add(id);

                let el = byId.get(id);
                if (!el) {
                    el = document.createElement('div');
                    el.setAttribute('data-text-id', id);
                    el.className =
                        'absolute select-none rounded px-1.5 py-0.5 text-white bg-[#4a4a4a] border border-white/10 shadow-sm';

                    el.addEventListener('pointerdown', (event) => {
                        if (readOnly) return;
                        if (state.selectedTool !== 'move') return;
                        if (event.button !== 0) return;
                        event.preventDefault();
                        event.stopPropagation();

                        const textId = el.getAttribute('data-text-id') || '';
                        if (textId === '') return;

                        const drawingIndex = state.drawings.findIndex((d) => String(d?.id ?? '') === textId);
                        if (drawingIndex === -1) return;

                        pendingTextEdit = { id: textId, clientX: event.clientX, clientY: event.clientY };

                        el.setPointerCapture(event.pointerId);
                        state.textDrag = {
                            id: textId,
                            index: drawingIndex,
                            startClientX: event.clientX,
                            startClientY: event.clientY,
                            startX: Number(state.drawings[drawingIndex].x || 0),
                            startY: Number(state.drawings[drawingIndex].y || 0),
                        };
                    });

                    el.addEventListener('pointermove', (event) => {
                        if (readOnly) return;
                        if (!state.textDrag) return;
                        if (state.selectedTool !== 'move') return;

                        if (pendingTextEdit && pendingTextEdit.id === state.textDrag.id) {
                            const dx = Math.abs(event.clientX - pendingTextEdit.clientX);
                            const dy = Math.abs(event.clientY - pendingTextEdit.clientY);
                            if (dx > 4 || dy > 4) {
                                pendingTextEdit = null;
                            }
                        }

                        const effectiveZoom = clamp(state.zoom * resolvedZoomBase, 0.5, 4);
                        const dx = (event.clientX - state.textDrag.startClientX) / effectiveZoom;
                        const dy = (event.clientY - state.textDrag.startClientY) / effectiveZoom;

                        state.drawings = state.drawings.map((d, i) => {
                            if (i !== state.textDrag.index) return d;
                            return { ...d, x: state.textDrag.startX + dx, y: state.textDrag.startY + dy };
                        });
                    });

                    el.addEventListener('pointerup', (event) => {
                        if (!state.textDrag) return;

                        const candidate = pendingTextEdit;
                        pendingTextEdit = null;

                        const dragged =
                            Math.abs(event.clientX - state.textDrag.startClientX) > 4 ||
                            Math.abs(event.clientY - state.textDrag.startClientY) > 4;
                        const textId = state.textDrag.id;
                        state.textDrag = null;

                        if (!dragged && candidate && candidate.id === textId) {
                            state.editingTextId = textId;
                            editSession = {
                                type: 'text',
                                id: textId,
                                original: el.textContent ?? '',
                            };
                            return;
                        }

                        scheduleAutosave();
                    });

                    el.addEventListener('pointercancel', () => {
                        state.textDrag = null;
                        pendingTextEdit = null;
                    });

                    el.addEventListener('keydown', (event) => {
                        if (!el.isContentEditable) return;
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            el.blur();
                        }
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            if (editSession?.type === 'text' && editSession.id === id) {
                                el.textContent = String(editSession.original ?? '');
                            }
                            el.blur();
                        }
                    });

                    el.addEventListener('blur', () => {
                        if (state.editingTextId !== id) return;

                        const value = String(el.textContent ?? '').trim();
                        state.drawings = state.drawings.map((d) => (String(d?.id ?? '') === id ? { ...d, text: value } : d));
                        state.editingTextId = null;
                        editSession = null;
                        scheduleAutosave();
                    });

                    ui.noteLayer.appendChild(el);
                    byId.set(id, el);
                }

                el.style.left = `${Number(drawing.x || 0)}px`;
                el.style.top = `${Number(drawing.y || 0)}px`;
                el.style.fontSize = `${Number(drawing.fontSize || state.fontSize || 14)}px`;

                const isEditing = state.editingTextId === id;
                if (!isEditing) {
                    el.textContent = String(drawing.text ?? '');
                }

                el.contentEditable = isEditing ? 'true' : 'false';
                el.classList.toggle('outline', isEditing);
                el.classList.toggle('outline-2', isEditing);
                el.classList.toggle('outline-yellow-300/80', isEditing);

                if (isEditing && document.activeElement !== el) {
                    requestAnimationFrame(() => {
                        try {
                            el.focus();
                            const range = document.createRange();
                            range.selectNodeContents(el);
                            range.collapse(false);
                            const selection = window.getSelection();
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                        } catch {
                            // ignore
                        }
                    });
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
        if (readOnly) return;
        if (!snapshotUrl) {
            setStatus('動画をアップロードしてから撮影してください');
            setTimeout(() => setStatus(''), 2000);
            return;
        }
        if (!ui.video.src || ui.video.src === '') {
            setStatus('動画が読み込まれていません');
            setTimeout(() => setStatus(''), 2000);
            return;
        }
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
        if (readOnly) return;
        if (!saveUrl) {
            if (!silent) {
                setStatus('動画をアップロードしてから保存してください');
                setTimeout(() => setStatus(''), 2000);
            }
            return;
        }

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
                    fontSize: state.fontSize,
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
            if (!state.zoomInitialized) {
                const fit = computeFitZoom();
                // 枠内フィットをそのまま 100% とする
                state.zoom = clamp(fit / resolvedZoomBase, 0.1, 1);
                state.zoomDisplayBase = state.zoom || 1;
                state.zoomInitialized = true;
                applyZoom();
            }
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

    ui.video.addEventListener('play', () => {
        if (!desiredPlaying) {
            desiredPlaying = true;
        }
        syncPlayingState();
    });
    ui.video.addEventListener('playing', syncPlayingState);
    ui.video.addEventListener('pause', () => {
        if (desiredPlaying) {
            desiredPlaying = false;
        }
        syncPlayingState();
    });
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
        state.comparisons = [];
        updatePlaybackUi();
        renderSnapshots();
        renderComparisons();
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
                ui.video.src = '';
                ui.video.removeAttribute('src');
                setVideoStatus();
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
                ui.video.src = '';
                ui.video.removeAttribute('src');
                setVideoStatus();
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
            ui.video.src = '';
            ui.video.removeAttribute('src');
            setVideoStatus();
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

    if (ui.share) {
        ui.share.addEventListener('click', async () => {
            const shareUrl = root.dataset.shareUrl || '';

            if (shareUrl === '') {
                setStatus('共有URLが未発行です');
                setTimeout(() => setStatus(''), 1500);
                return;
            }

            if (navigator.share) {
                try {
                    await navigator.share({ url: shareUrl });
                    return;
                } catch {
                    // ignore
                }
            }

            try {
                await navigator.clipboard.writeText(shareUrl);
                setStatus('共有URLをコピーしました');
                setTimeout(() => setStatus(''), 1500);
            } catch {
                window.prompt('共有URL', shareUrl);
            }
        });
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

    ui.fontSize.addEventListener('input', () => {
        state.fontSize = clamp(Number(ui.fontSize.value), 10, 48);
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

    if (ui.comparisonModeButton) {
        ui.comparisonModeButton.addEventListener('click', () => {
            if (readOnly) return;
            state.comparisonMode = !state.comparisonMode;
            state.selectedSnapshotsForComparison = [];

            ui.comparisonModeButton.textContent = state.comparisonMode ? '選択中...' : '作成モード';
            ui.comparisonModeButton.classList.toggle('bg-green-600', state.comparisonMode);
            ui.comparisonModeButton.classList.toggle('hover:bg-green-700', state.comparisonMode);
            ui.comparisonModeButton.classList.toggle('bg-[#0078d4]', !state.comparisonMode);
            ui.comparisonModeButton.classList.toggle('hover:bg-[#106ebe]', !state.comparisonMode);

            if (ui.comparisonModeHint) {
                ui.comparisonModeHint.classList.toggle('hidden', !state.comparisonMode);
            }

            renderSnapshots();
        });
    }

    // 比較検索フィルター
    if (ui.comparisonSearch) {
        ui.comparisonSearch.addEventListener('input', (e) => {
            if (readOnly) return;
            state.comparisonSearchTerm = e.target.value;
            renderComparisons();
        });
    }

    // 比較ソート
    if (ui.comparisonSort) {
        ui.comparisonSort.addEventListener('change', (e) => {
            if (readOnly) return;
            state.comparisonSortMode = e.target.value;
            renderComparisons();
        });
    }

    // 比較お気に入りフィルター
    if (ui.comparisonFavoritesOnly) {
        ui.comparisonFavoritesOnly.addEventListener('change', (e) => {
            if (readOnly) return;
            state.comparisonFavoritesOnly = e.target.checked;
            renderComparisons();
        });
    }

    ui.stage.addEventListener('pointerdown', (event) => {
        if (readOnly) return;
        if (state.selectedTool !== 'note') return;
        if (event.button !== 0) return;

        const pos = getMousePos(event);
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = ui.canvas.width / dpr;
        const cssHeight = ui.canvas.height / dpr;

        const x = clamp(pos.x / (cssWidth || 1), 0, 1);
        const y = clamp(pos.y / (cssHeight || 1), 0, 1);

        // Create note immediately with empty text
        const newNote = {
            id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
            time: state.currentTime,
            x,
            y,
            targetX: x,
            targetY: y,
            text: '',
            maxWidth: 320,
            fontSize: state.fontSize,
        };

        state.notes = [...state.notes, newNote];

        // Switch to move tool
        state.selectedTool = 'move';
        updateToolbarUi();

        // Start editing immediately (this will call renderNotes)
        requestAnimationFrame(() => {
            startNoteInlineEdit(newNote.id);
        });

        scheduleAutosave();
    });

    ui.noteLayer.addEventListener('pointermove', (event) => {
        if (readOnly) return;
        if (!state.noteDrag) return;
        if (state.selectedTool !== 'move') return;

        if (pendingNoteEdit && pendingNoteEdit.id === state.noteDrag.id) {
            const dx = Math.abs(event.clientX - pendingNoteEdit.clientX);
            const dy = Math.abs(event.clientY - pendingNoteEdit.clientY);
            if (dx > 4 || dy > 4) {
                pendingNoteEdit = null;
            }
        }

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

        if (state.noteDrag.mode === 'target') {
            const nextX = clamp(state.noteDrag.startTargetX + dx / (state.noteDrag.stageW || 1), 0, 1);
            const nextY = clamp(state.noteDrag.startTargetY + dy / (state.noteDrag.stageH || 1), 0, 1);

            state.notes = state.notes.map((n) => {
                if (String(n.id ?? '') !== state.noteDrag.id) return n;
                return { ...n, targetX: nextX, targetY: nextY };
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

    ui.noteLayer.addEventListener('pointerup', (event) => {
        if (!state.noteDrag) return;

        const candidate = pendingNoteEdit;
        pendingNoteEdit = null;

        const dragged = Math.abs(event.clientX - state.noteDrag.startClientX) > 4 || Math.abs(event.clientY - state.noteDrag.startClientY) > 4;
        const noteId = state.noteDrag.id;

        state.noteDrag = null;

        if (!dragged && candidate && candidate.id === noteId) {
            startNoteInlineEdit(noteId);
            return;
        }

        renderNotes();
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

    let togglePlayTimeout = null;
    const handleTogglePlay = (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!ui.video.currentSrc) {
            setStatus('動画が読み込まれていません（Open Video で選択してください）');
            setTimeout(() => setStatus(''), 2000);
            return;
        }

        // デバウンス: 連続クリックを防ぐ
        if (togglePlayTimeout) {
            clearTimeout(togglePlayTimeout);
        }

        togglePlayTimeout = setTimeout(() => {
            togglePlayTimeout = null;
        }, 100);

        // 即座に状態を切り替え
        const shouldPlay = ui.video.paused;

        if (shouldPlay) {
            desiredPlaying = true;
            state.isPlaying = true;
            setPlayingIcon();

            ui.video.play().catch((error) => {
                console.error(error);
                desiredPlaying = false;
                state.isPlaying = false;
                setPlayingIcon();
                const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
                setStatus(name ? `再生できませんでした（${name}）` : '再生できませんでした');
                setTimeout(() => setStatus(''), 2500);
            });
        } else {
            desiredPlaying = false;
            state.isPlaying = false;
            setPlayingIcon();
            ui.video.pause();
        }
    };

    ui.togglePlay.addEventListener('click', handleTogglePlay, { capture: true });
    ui.togglePlay.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
    }, { capture: true });

    ui.stepPrev.addEventListener('click', () => {
        const frameTime = 1 / 30;
        ui.video.currentTime = clamp((ui.video.currentTime || 0) - frameTime, 0, ui.video.duration || 0);
    });

    ui.stepNext.addEventListener('click', () => {
        const frameTime = 1 / 30;
        ui.video.currentTime = clamp((ui.video.currentTime || 0) + frameTime, 0, ui.video.duration || 0);
    });

    const zoomStep = 0.1; // 10%
    ui.zoomOut.addEventListener('click', () => {
        state.zoom = Math.max(0.1, state.zoom - zoomStep);
        applyZoom();
    });

    ui.zoomIn.addEventListener('click', () => {
        state.zoom = Math.min(3, state.zoom + zoomStep);
        applyZoom();
    });

    ui.stage.addEventListener('pointerdown', (event) => {
        if (readOnly) return;
        if (state.selectedTool === 'note') return;
        if (event.button !== 0) return;

        const pos = getMousePos(event);
        const drawingIndex = findDrawingAtPoint(pos.x, pos.y);
        const isDraftingAngle = state.selectedTool === 'angle' && state.isDrawing && state.currentDrawing?.tool === 'angle';
        const shouldAutoSwitchToMove = !isDraftingAngle && drawingIndex !== -1 && state.selectedTool !== 'move';
        if (!state.selectedTool && !shouldAutoSwitchToMove) {
            return;
        }

        if (shouldAutoSwitchToMove) {
            state.selectedTool = 'move';
            updateToolbarUi();
            updateDrawingOptionsUi();
        }

        ui.stage.setPointerCapture(event.pointerId);
        startDrawing(event);
    });

    ui.stage.addEventListener('pointermove', (event) => {
        if (readOnly) return;
        draw(event);
    });

    ui.stage.addEventListener('pointerup', (event) => {
        if (readOnly) return;
        stopDrawing(event);
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

            if (event.altKey && state.selectedTool === 'move') {
                const pos = getMousePos(event);
                const idx = findDrawingAtPoint(pos.x, pos.y);
                const drawing = idx !== -1 ? state.drawings[idx] : null;

                if (drawing && drawing.tool === 'magnifier') {
                    const direction = event.deltaY < 0 ? 1 : -1;
                    if (event.shiftKey) {
                        const nextHandleRadius = clamp(Number(drawing.handleRadius ?? 12) + direction * 2, 8, 30);
                        if (nextHandleRadius !== Number(drawing.handleRadius ?? 12)) {
                            state.drawings = state.drawings.map((d, i) =>
                                i === idx ? { ...d, handleRadius: nextHandleRadius } : d
                            );
                            scheduleAutosave();
                        }
                        return;
                    }

                    const nextZoom = clamp(Number(drawing.zoom || 2) + direction * 0.2, 1.2, 4);
                    if (nextZoom !== Number(drawing.zoom || 2)) {
                        state.drawings = state.drawings.map((d, i) => (i === idx ? { ...d, zoom: nextZoom } : d));
                        scheduleAutosave();
                    }
                    return;
                }
            }

            const direction = event.deltaY < 0 ? 1 : -1;
            const step = 0.1; // 10%ずつ
            const next = clamp(state.zoom + direction * step, 0.1, 3);
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
                editSession = null;
                state.textInsertTool = 'text';
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
            ui.video,
            ui.stage,
        );
        renderTextOverlays();
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
