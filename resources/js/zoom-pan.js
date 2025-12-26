/**
 * Video Analysis - Zoom and Pan Functions
 * Handles zoom and pan functionality for the video canvas
 */

import { clamp } from './utils.js';

/**
 * Create applyZoom function
 * @param {Object} ui - UI element references
 * @param {Object} state - State object
 * @param {number} resolvedZoomBase - Resolved zoom base value
 * @returns {Function} applyZoom function
 */
export function createApplyZoom(ui, state, resolvedZoomBase) {
    return () => {
        const effectiveZoom = clamp(state.zoom * resolvedZoomBase, 0.1, 6);
        ui.mediaWrap.style.transform = `translate(${state.panOffsetX}px, ${state.panOffsetY}px) scale(${effectiveZoom})`;
        ui.mediaWrap.style.transformOrigin = 'center center';
        ui.noteLayer.style.transform = `translate(${state.panOffsetX}px, ${state.panOffsetY}px) scale(${effectiveZoom})`;
        ui.noteLayer.style.transformOrigin = 'center center';
        ui.canvas.style.transform = `translate(${state.panOffsetX}px, ${state.panOffsetY}px)`;

        const base = state.zoomDisplayBase && Number.isFinite(state.zoomDisplayBase) ? state.zoomDisplayBase : 1;
        const displayPct = clamp((state.zoom / base) * 100, 1, 999);
        ui.zoomLabel.textContent = `${Math.round(displayPct)}%`;
    };
}

/**
 * Set up zoom button event listeners
 * @param {Object} ui - UI element references
 * @param {Object} state - State object
 * @param {Function} applyZoom - applyZoom function
 */
export function setupZoomButtons(ui, state, applyZoom) {
    const zoomStep = 0.1; // 10%

    ui.zoomOut.addEventListener('click', () => {
        state.zoom = Math.max(0.1, state.zoom - zoomStep);
        applyZoom();
    });

    ui.zoomIn.addEventListener('click', () => {
        state.zoom = Math.min(3, state.zoom + zoomStep);
        applyZoom();
    });
}

/**
 * Start pan mode
 * @param {Object} state - State object
 * @param {Object} event - Mouse event
 * @param {Function} updateCursor - Cursor update function
 * @returns {boolean} True if pan mode was started
 */
export function startPan(state, event, updateCursor) {
    if (event.button === 1 || // middle click
        (event.button === 0 && state.isSpacePressed) || // Space + left click
        event.button === 2) { // right click
        event.preventDefault();
        state.panMode = true;
        state.panStartX = event.clientX;
        state.panStartY = event.clientY;
        updateCursor();
        return true;
    }
    return false;
}

/**
 * Handle pan movement
 * @param {Object} state - State object
 * @param {Object} event - Mouse event
 * @param {Function} applyZoom - applyZoom function
 * @returns {boolean} True if pan was handled
 */
export function handlePan(state, event, applyZoom) {
    if (state.panMode) {
        const dx = event.clientX - state.panStartX;
        const dy = event.clientY - state.panStartY;
        state.panOffsetX += dx;
        state.panOffsetY += dy;
        state.panStartX = event.clientX;
        state.panStartY = event.clientY;
        applyZoom();
        return true;
    }
    return false;
}

/**
 * End pan mode
 * @param {Object} state - State object
 * @param {Function} updateCursor - Cursor update function
 */
export function endPan(state, updateCursor) {
    if (state.panMode) {
        state.panMode = false;
        updateCursor();
    }
}

/**
 * Check if pan mode is active
 * @param {Object} state - State object
 * @returns {boolean}
 */
export function isPanActive(state) {
    return state.panMode;
}
