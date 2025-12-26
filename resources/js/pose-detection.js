/**
 * Pose Detection Module for Video Note
 * Uses TensorFlow.js MoveNet for browser-based pose detection
 */

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// Keypoint names from MoveNet
const KEYPOINT_NAMES = [
    'nose',
    'left_eye', 'right_eye',
    'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder',
    'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee',
    'left_ankle', 'right_ankle',
];

// Skeleton connections for drawing
const SKELETON_CONNECTIONS = [
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
];

// State
let detector = null;
let modelLoading = false;
let modelLoaded = false;
let tfReady = false;

/**
 * Ensure TensorFlow.js backend is ready
 */
async function ensureTfReady() {
    if (!tfReady) {
        await tf.ready();
        tfReady = true;
    }
}

/**
 * Load the pose detection model
 * @param {string} modelType - 'lightning' or 'thunder' (SinglePose)
 * @returns {Promise<void>}
 */
export async function loadPoseModel(modelType = 'lightning') {
    if (modelLoaded) return;
    if (modelLoading) {
        // Wait for existing load to complete
        while (modelLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return;
    }

    modelLoading = true;

    try {
        // Wait for TensorFlow.js backend to be ready
        await ensureTfReady();

        // Map simple names to TensorFlow.js modelType constants
        const modelTypeMap = {
            'lightning': poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            'thunder': poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        };

        const actualModelType = modelTypeMap[modelType] || modelTypeMap['lightning'];

        const detectorConfig = {
            modelType: actualModelType,
            enableSmoothing: true,
        };

        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
        );

        modelLoaded = true;
        modelLoading = false;
        currentModelType = `singlepose_${modelType}`;

        return detector;
    } catch (error) {
        modelLoading = false;
        throw new Error(`Failed to load pose model: ${error.message}`);
    }
}

/**
 * Check if model is loaded
 * @returns {boolean}
 */
export function isModelLoaded() {
    return modelLoaded;
}

/**
 * Detect poses in a video frame
 * @param {HTMLVideoElement} videoElement - The video element to process
 * @param {number} minConfidence - Minimum confidence threshold (0-1)
 * @returns {Promise<Array>} Array of detected poses
 */
export async function detectPose(videoElement, minConfidence = 0.3) {
    if (!detector) {
        throw new Error('Pose model not loaded. Call loadPoseModel() first.');
    }

    try {
        const poses = await detector.estimatePoses(videoElement, {
            flipHorizontal: false,
        });

        // Filter by confidence and format keypoints
        return poses.map(pose => ({
            keypoints: pose.keypoints.map(kp => ({
                name: kp.name,
                score: kp.score,
                x: kp.x,
                y: kp.y,
            })).filter(kp => kp.score >= minConfidence),
            box: pose.box,
            score: pose.score,
        }));
    } catch (error) {
        console.error('Pose detection error:', error);
        return [];
    }
}

/**
 * Convert video coordinates to board/canvas coordinates
 * @param {number} x - X coordinate in video space
 * @param {number} y - Y coordinate in video space
 * @param {HTMLVideoElement} video - The video element
 * @param {HTMLElement} stage - The stage/canvas container
 * @returns {Object} {x, y} in board coordinates
 */
export function videoToBoardCoordinates(x, y, video, stage) {
    const videoRect = video.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();

    // Calculate scale factors (video may be scaled to fit)
    const scaleX = videoRect.width / video.videoWidth;
    const scaleY = videoRect.height / video.videoHeight;

    // Transform to stage coordinates
    return {
        x: (videoRect.left - stageRect.left) + x * scaleX,
        y: (videoRect.top - stageRect.top) + y * scaleY,
    };
}

/**
 * Extract a specific keypoint trajectory from pose data
 * @param {Array} poses - Array of pose detections with time
 * @param {string} keypointName - Name of keypoint to track
 * @param {HTMLVideoElement} video - Video element for coordinate conversion
 * @param {HTMLElement} stage - Stage element for coordinate conversion
 * @returns {Array} Array of {x, y, time, score} points
 */
export function extractTrajectoryPoint(poses, keypointName, video, stage) {
    const trajectory = [];

    for (const poseData of poses) {
        const keypoint = poseData.keypoints?.find(kp => kp.name === keypointName);
        if (keypoint && keypoint.score >= 0.3) {
            const boardCoords = videoToBoardCoordinates(
                keypoint.x,
                keypoint.y,
                video,
                stage
            );
            trajectory.push({
                x: boardCoords.x,
                y: boardCoords.y,
                time: poseData.time,
                score: keypoint.score,
            });
        }
    }

    return trajectory;
}

/**
 * Apply moving average smoothing to trajectory
 * @param {Array} trajectory - Array of {x, y, time} points
 * @param {number} windowSize - Number of points to average
 * @returns {Array} Smoothed trajectory
 */
export function smoothTrajectory(trajectory, windowSize = 5) {
    if (trajectory.length <= windowSize) {
        return [...trajectory];
    }

    const smoothed = [];

    for (let i = 0; i < trajectory.length; i++) {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(trajectory.length, i + Math.ceil(windowSize / 2));
        const window = trajectory.slice(start, end);

        // Weighted average (center point has more weight)
        let sumX = 0;
        let sumY = 0;
        let sumWeight = 0;

        for (let j = 0; j < window.length; j++) {
            const distance = Math.abs(j - (i - start));
            const weight = windowSize - distance;
            sumX += window[j].x * weight;
            sumY += window[j].y * weight;
            sumWeight += weight;
        }

        smoothed.push({
            x: sumX / sumWeight,
            y: sumY / sumWeight,
            time: trajectory[i].time,
            score: trajectory[i].score || 0,
        });
    }

    return smoothed;
}

/**
 * Get skeleton connections for drawing
 * @returns {Array} Array of [keypoint1, keypoint2] pairs
 */
export function getSkeletonConnections() {
    return SKELETON_CONNECTIONS;
}

/**
 * Get all keypoint names
 * @returns {Array} Array of keypoint names
 */
export function getKeypointNames() {
    return KEYPOINT_NAMES;
}

/**
 * Find pose nearest to a specific time
 * @param {Object} drawing - Pose track drawing object
 * @param {number} time - Target time
 * @param {number} tolerance - Time tolerance in seconds
 * @returns {Object|null} Nearest pose or null
 */
export function getPoseAtTime(drawing, time, tolerance = 0.1) {
    if (!drawing.poses || drawing.poses.length === 0) {
        return null;
    }

    // Binary search for closest pose
    let left = 0;
    let right = drawing.poses.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const poseTime = drawing.poses[mid].time;

        if (Math.abs(poseTime - time) <= tolerance) {
            return drawing.poses[mid];
        }

        if (poseTime < time) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    // Check nearest boundary
    if (left < drawing.poses.length) {
        if (Math.abs(drawing.poses[left].time - time) <= tolerance) {
            return drawing.poses[left];
        }
    }
    if (right >= 0) {
        if (Math.abs(drawing.poses[right].time - time) <= tolerance) {
            return drawing.poses[right];
        }
    }

    return null;
}

/**
 * Calculate velocity between trajectory points
 * @param {Array} trajectory - Array of {x, y, time} points
 * @param {number} index - Index of point to calculate velocity for
 * @returns {Object} {vx, vy, speed} or null
 */
export function calculateVelocity(trajectory, index) {
    if (index < 1 || index >= trajectory.length) {
        return null;
    }

    const p1 = trajectory[index - 1];
    const p2 = trajectory[index];

    const dt = p2.time - p1.time;
    if (dt <= 0) return null;

    const vx = (p2.x - p1.x) / dt;
    const vy = (p2.y - p1.y) / dt;
    const speed = Math.sqrt(vx * vx + vy * vy);

    return { vx, vy, speed };
}

/**
 * Get color based on confidence score
 * @param {number} score - Confidence score (0-1)
 * @returns {string} CSS color
 */
export function getConfidenceColor(score) {
    if (score >= 0.7) return '#00FF00'; // Green - high confidence
    if (score >= 0.4) return '#FFFF00'; // Yellow - medium confidence
    return '#FF0000'; // Red - low confidence
}

/**
 * Load the multi-pose detection model for tactical tracking
 * @returns {Promise<void>}
 */
export async function loadMultiPoseModel() {
    if (modelLoaded && detector) return;
    if (modelLoading) {
        while (modelLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return;
    }

    modelLoading = true;

    try {
        await ensureTfReady();

        const detectorConfig = {
            modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
            enableSmoothing: true,
        };

        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
        );

        modelLoaded = true;
        modelLoading = false;
        currentModelType = 'multipose_lightning';

        return detector;
    } catch (error) {
        modelLoading = false;
        throw new Error(`Failed to load multi-pose model: ${error.message}`);
    }
}

/**
 * Get current detector model type
 * @returns {string|null} 'singlepose' or 'multipose' or null
 */
export function getCurrentModelType() {
    if (!detector) return null;
    // Store model type when loading for tracking
    return currentModelType || null;
}

// Track current model type for debugging
let currentModelType = null;

/**
 * Dispose of the detector to free memory
 */
export function dispose() {
    if (detector) {
        detector.dispose();
        detector = null;
        modelLoaded = false;
        currentModelType = null;
    }
}
