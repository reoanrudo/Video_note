/**
 * Video Analysis - API Client
 * Handles API communication for saving annotations, snapshots, and tags
 */

import { postJson } from './utils.js';

/**
 * Save annotations to the server
 * @param {string} saveUrl - The API endpoint URL
 * @param {Object} state - State object containing drawings, snapshots, notes, tags
 * @param {Function} setStatus - Status update function
 * @param {boolean} silent - Whether to suppress status messages
 * @returns {Promise<void>}
 */
export async function saveAnnotations(saveUrl, state, setStatus, silent = false) {
    if (!silent) {
        setStatus('保存中…');
    }

    try {
        const payload = {
            drawings: state.drawings,
            snapshots: state.frameSnapshots,
            notes: state.notes,
            tags: state.tags,
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
        throw error;
    }
}

/**
 * Capture and save a video frame snapshot
 * @param {string} snapshotUrl - The API endpoint URL
 * @param {HTMLVideoElement} video - Video element
 * @param {number} currentTime - Current video time
 * @param {string|null} memo - Optional memo for the snapshot
 * @returns {Promise<Object>} Response containing url and path
 */
export async function captureSnapshot(snapshotUrl, video, currentTime, memo = null) {
    const off = document.createElement('canvas');
    off.width = video.videoWidth || 1920;
    off.height = video.videoHeight || 1080;
    const offCtx = off.getContext('2d');
    if (!offCtx) throw new Error('No canvas context');

    offCtx.drawImage(video, 0, 0);

    const image = off.toDataURL('image/png');
    const time = currentTime || 0;

    const res = await postJson(snapshotUrl, { image, time });

    return {
        time,
        url: res.url,
        path: res.path,
        memo,
    };
}

/**
 * Create autosave debounced function
 * @param {Function} saveFn - Save function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced save function
 */
export function createAutosave(saveFn, delay = 2000) {
    let timeoutId = null;

    return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            saveFn();
            timeoutId = null;
        }, delay);
    };
}

/**
 * Create batch save function for multiple items
 * @param {Function} saveFn - Single save function
 * @returns {Function} Batch save function
 */
export function createBatchSave(saveFn) {
    let pending = false;
    let needsSave = false;

    const flush = async () => {
        if (!needsSave) return;
        pending = true;
        needsSave = false;

        try {
            await saveFn();
        } finally {
            pending = false;
            if (needsSave) {
                flush();
            }
        }
    };

    return {
        trigger: () => {
            needsSave = true;
            if (!pending) {
                flush();
            }
        },
        flush,
    };
}
