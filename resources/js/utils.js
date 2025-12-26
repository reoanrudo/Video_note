/**
 * Video Analysis - Utility Functions
 */

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
        tag: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
        target: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    };

    return icons[name] ?? '';
}

const DRAW_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#FFA500'];

const TAG_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

const FORMATIONS = {
    '4-4-2': {
        home: [
            { x: 0.5, y: 0.08, label: 'GK' },
            { x: 0.2, y: 0.25, label: 'LB' }, { x: 0.4, y: 0.25, label: 'CB' },
            { x: 0.6, y: 0.25, label: 'CB' }, { x: 0.8, y: 0.25, label: 'RB' },
            { x: 0.15, y: 0.45, label: 'LM' }, { x: 0.38, y: 0.45, label: 'CM' },
            { x: 0.62, y: 0.45, label: 'CM' }, { x: 0.85, y: 0.45, label: 'RM' },
            { x: 0.3, y: 0.65, label: 'ST' }, { x: 0.7, y: 0.65, label: 'ST' },
        ],
        away: [
            { x: 0.5, y: 0.92, label: 'GK' },
            { x: 0.2, y: 0.75, label: 'LB' }, { x: 0.4, y: 0.75, label: 'CB' },
            { x: 0.6, y: 0.75, label: 'CB' }, { x: 0.8, y: 0.75, label: 'RB' },
            { x: 0.15, y: 0.55, label: 'LM' }, { x: 0.38, y: 0.55, label: 'CM' },
            { x: 0.62, y: 0.55, label: 'CM' }, { x: 0.85, y: 0.55, label: 'RM' },
            { x: 0.3, y: 0.35, label: 'ST' }, { x: 0.7, y: 0.35, label: 'ST' },
        ],
    },
    '4-3-3': {
        home: [
            { x: 0.5, y: 0.08, label: 'GK' },
            { x: 0.2, y: 0.25, label: 'LB' }, { x: 0.4, y: 0.25, label: 'CB' },
            { x: 0.6, y: 0.25, label: 'CB' }, { x: 0.8, y: 0.25, label: 'RB' },
            { x: 0.3, y: 0.45, label: 'CM' }, { x: 0.5, y: 0.42, label: 'CDM' },
            { x: 0.7, y: 0.45, label: 'CM' },
            { x: 0.15, y: 0.62, label: 'LW' }, { x: 0.5, y: 0.68, label: 'ST' },
            { x: 0.85, y: 0.62, label: 'RW' },
        ],
        away: [
            { x: 0.5, y: 0.92, label: 'GK' },
            { x: 0.2, y: 0.75, label: 'LB' }, { x: 0.4, y: 0.75, label: 'CB' },
            { x: 0.6, y: 0.75, label: 'CB' }, { x: 0.8, y: 0.75, label: 'RB' },
            { x: 0.3, y: 0.55, label: 'CM' }, { x: 0.5, y: 0.58, label: 'CDM' },
            { x: 0.7, y: 0.55, label: 'CM' },
            { x: 0.15, y: 0.38, label: 'LW' }, { x: 0.5, y: 0.32, label: 'ST' },
            { x: 0.85, y: 0.38, label: 'RW' },
        ],
    },
    '3-5-2': {
        home: [
            { x: 0.5, y: 0.08, label: 'GK' },
            { x: 0.3, y: 0.25, label: 'CB' }, { x: 0.5, y: 0.25, label: 'CB' },
            { x: 0.7, y: 0.25, label: 'CB' },
            { x: 0.15, y: 0.42, label: 'LWB' }, { x: 0.35, y: 0.45, label: 'CM' },
            { x: 0.5, y: 0.42, label: 'CDM' }, { x: 0.65, y: 0.45, label: 'CM' },
            { x: 0.85, y: 0.42, label: 'RWB' },
            { x: 0.35, y: 0.65, label: 'ST' }, { x: 0.65, y: 0.65, label: 'ST' },
        ],
        away: [
            { x: 0.5, y: 0.92, label: 'GK' },
            { x: 0.3, y: 0.75, label: 'CB' }, { x: 0.5, y: 0.75, label: 'CB' },
            { x: 0.7, y: 0.75, label: 'CB' },
            { x: 0.15, y: 0.58, label: 'LWB' }, { x: 0.35, y: 0.55, label: 'CM' },
            { x: 0.5, y: 0.58, label: 'CDM' }, { x: 0.65, y: 0.55, label: 'CM' },
            { x: 0.85, y: 0.58, label: 'RWB' },
            { x: 0.35, y: 0.35, label: 'ST' }, { x: 0.65, y: 0.35, label: 'ST' },
        ],
    },
    '4-2-3-1': {
        home: [
            { x: 0.5, y: 0.08, label: 'GK' },
            { x: 0.2, y: 0.25, label: 'LB' }, { x: 0.4, y: 0.25, label: 'CB' },
            { x: 0.6, y: 0.25, label: 'CB' }, { x: 0.8, y: 0.25, label: 'RB' },
            { x: 0.35, y: 0.42, label: 'CDM' }, { x: 0.65, y: 0.42, label: 'CDM' },
            { x: 0.15, y: 0.55, label: 'LW' }, { x: 0.38, y: 0.52, label: 'CAM' },
            { x: 0.62, y: 0.52, label: 'CAM' }, { x: 0.85, y: 0.55, label: 'RW' },
            { x: 0.5, y: 0.68, label: 'ST' },
        ],
        away: [
            { x: 0.5, y: 0.92, label: 'GK' },
            { x: 0.2, y: 0.75, label: 'LB' }, { x: 0.4, y: 0.75, label: 'CB' },
            { x: 0.6, y: 0.75, label: 'CB' }, { x: 0.8, y: 0.75, label: 'RB' },
            { x: 0.35, y: 0.58, label: 'CDM' }, { x: 0.65, y: 0.58, label: 'CDM' },
            { x: 0.15, y: 0.45, label: 'LW' }, { x: 0.38, y: 0.48, label: 'CAM' },
            { x: 0.62, y: 0.48, label: 'CAM' }, { x: 0.85, y: 0.45, label: 'RW' },
            { x: 0.5, y: 0.32, label: 'ST' },
        ],
    },
    '5-3-2': {
        home: [
            { x: 0.5, y: 0.08, label: 'GK' },
            { x: 0.15, y: 0.25, label: 'LWB' }, { x: 0.35, y: 0.25, label: 'CB' },
            { x: 0.5, y: 0.25, label: 'CB' }, { x: 0.65, y: 0.25, label: 'CB' },
            { x: 0.85, y: 0.25, label: 'RWB' },
            { x: 0.25, y: 0.45, label: 'CM' }, { x: 0.5, y: 0.42, label: 'CDM' },
            { x: 0.75, y: 0.45, label: 'CM' },
            { x: 0.35, y: 0.65, label: 'ST' }, { x: 0.65, y: 0.65, label: 'ST' },
        ],
        away: [
            { x: 0.5, y: 0.92, label: 'GK' },
            { x: 0.15, y: 0.75, label: 'LWB' }, { x: 0.35, y: 0.75, label: 'CB' },
            { x: 0.5, y: 0.75, label: 'CB' }, { x: 0.65, y: 0.75, label: 'CB' },
            { x: 0.85, y: 0.75, label: 'RWB' },
            { x: 0.25, y: 0.55, label: 'CM' }, { x: 0.5, y: 0.58, label: 'CDM' },
            { x: 0.75, y: 0.55, label: 'CM' },
            { x: 0.35, y: 0.35, label: 'ST' }, { x: 0.65, y: 0.35, label: 'ST' },
        ],
    },
};

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
    { separator: true },
    { id: 'tag', icon: 'tag', label: 'Tag' },
    { id: 'tactical-board', icon: 'target', label: 'Tactical Board', badge: 'Board' },
    { id: 'pose-track', icon: 'activity', label: 'Pose Tracking', badge: 'AI' },
    { id: 'tactical-track', icon: 'target', label: 'Tactical Tracking', badge: 'Soccer' },
];

export {
    getCsrfToken,
    clamp,
    formatTime,
    parseJsonScript,
    escapeHtml,
    escapeAttribute,
    postJson,
    svgIcon,
    DRAW_COLORS,
    TAG_COLORS,
    FORMATIONS,
    TOOL_DEFS,
};
