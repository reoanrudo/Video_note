import {
    loadPoseModel,
    loadMultiPoseModel,
    detectPose,
    videoToBoardCoordinates,
    extractTrajectoryPoint,
    smoothTrajectory,
    getSkeletonConnections,
    getKeypointNames,
    getPoseAtTime,
    calculateVelocity,
    getConfidenceColor,
    isModelLoaded,
    dispose as disposePoseModel,
} from './pose-detection.js';
import { buildUi } from './ui-builder.js';
import {
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
} from './utils.js';
import {
    createApplyZoom,
    setupZoomButtons,
    startPan,
    handlePan,
    endPan,
    isPanActive,
} from './zoom-pan.js';
import {
    saveAnnotations,
    captureSnapshot,
    createAutosave,
    createBatchSave,
} from './api-client.js';

export { buildUi };


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
            } else if (drawing.tool === 'pose-track') {
                drawPoseTrajectory(ctx, drawing, currentTime, video, stage);
            } else if (drawing.tool === 'tactical-track') {
                drawTacticalCircles(ctx, drawing, currentTime, video, stage);
                drawFadingTrails(ctx, drawing, currentTime, video, stage);
            } else if (drawing.tool === 'tactical-board') {
                drawTacticalBoard(ctx, drawing, currentTime, video, stage);
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

    // Render tactical tracking preview (during active tracking)
    // We need to access global state, so we'll get it from the video element's data
    const root = document.getElementById('video-analysis');
    if (root && root._tacticalState) {
        const tacticalState = root._tacticalState;
        if (tacticalState.active && tacticalState.mode === 'tracking' && Object.keys(tacticalState.peopleTracks).length > 0) {
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const cssWidth = canvas.width / dpr;
            const cssHeight = canvas.height / dpr;

            const effectiveZoom = Number.isFinite(zoom) ? clamp(zoom, 0.1, 6) : 1;
            const cx = cssWidth / 2;
            const cy = cssHeight / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(effectiveZoom, effectiveZoom);
            ctx.translate(-cx, -cy);

            // Draw live tactical tracking
            const previewDrawing = {
                tracks: tacticalState.peopleTracks,
                trailDuration: tacticalState.trailDuration,
            };
            drawTacticalCircles(ctx, previewDrawing, currentTime, video, stage);
            drawFadingTrails(ctx, previewDrawing, currentTime, video, stage);

            ctx.restore();
        }
    }
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

// Pose tracking rendering functions
function drawPoseTrajectory(ctx, drawing, currentTime, video, stage) {
    if (!drawing.poses || drawing.poses.length < 1) return;

    const showKeypoints = drawing.showKeypoints !== false;
    const showSkeleton = drawing.showSkeleton !== false;
    const showTrajectory = drawing.showTrajectory !== false;
    const trajectoryPoint = drawing.trajectoryPoint || 'left_ankle';
    const color = drawing.color || '#00FFFF';

    // Calculate opacity based on time
    const timeDiff = Math.abs(drawing.time - currentTime);
    let opacity = 1;
    const endTime = drawing.endTime || (drawing.time + 5); // Default 5 second duration
    const inRange = currentTime >= drawing.time && currentTime <= endTime;

    if (!inRange) {
        opacity = 0;
    } else if (timeDiff > 2) {
        opacity = 0;
    } else if (timeDiff > 1) {
        opacity = 1 - (timeDiff - 1);
    }
    ctx.globalAlpha = opacity;

    if (showTrajectory && drawing.trajectory && drawing.trajectory[trajectoryPoint]) {
        drawTrajectoryPath(ctx, drawing.trajectory[trajectoryPoint], color);
    }

    // Get current pose for this time
    const currentPose = getPoseAtTime(drawing, currentTime, 0.1);
    if (currentPose) {
        if (showSkeleton) {
            drawPoseSkeleton(ctx, currentPose, video, stage, color);
        }
        if (showKeypoints) {
            drawPoseKeypoints(ctx, currentPose.keypoints, video, stage, color);
        }
    }

    ctx.globalAlpha = 1.0;
}

function drawTrajectoryPath(ctx, trajectory, color) {
    if (!trajectory || trajectory.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    ctx.moveTo(trajectory[0].x, trajectory[0].y);
    for (let i = 1; i < trajectory.length; i++) {
        ctx.lineTo(trajectory[i].x, trajectory[i].y);
    }
    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    for (const point of trajectory) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPoseSkeleton(ctx, pose, video, stage, color) {
    if (!pose.keypoints) return;

    const connections = getSkeletonConnections();
    const keypointsByName = {};
    for (const kp of pose.keypoints) {
        keypointsByName[kp.name] = kp;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (const [kp1Name, kp2Name] of connections) {
        const kp1 = keypointsByName[kp1Name];
        const kp2 = keypointsByName[kp2Name];

        if (kp1 && kp2 && kp1.score >= 0.3 && kp2.score >= 0.3) {
            const p1 = videoToBoardCoordinates(kp1.x, kp1.y, video, stage);
            const p2 = videoToBoardCoordinates(kp2.x, kp2.y, video, stage);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }
}

function drawPoseKeypoints(ctx, keypoints, video, stage, color) {
    if (!keypoints) return;

    for (const kp of keypoints) {
        if (kp.score < 0.3) continue;

        const pos = videoToBoardCoordinates(kp.x, kp.y, video, stage);
        const kpColor = getConfidenceColor(kp.score);

        ctx.fillStyle = kpColor;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

// ========== Tactical Tracking Functions (Multi-Person) ==========

/**
 * Draw position circles for tactical tracking
 */
function drawTacticalCircles(ctx, drawing, currentTime, video, stage) {
    if (!drawing.tracks) return;

    const trailDuration = drawing.trailDuration || 4.0;

    for (const [personId, track] of Object.entries(drawing.tracks)) {
        if (!track.positions || track.positions.length === 0) continue;

        // Filter positions within trail duration
        const recentPositions = track.positions.filter(p => {
            return p.time && currentTime >= p.time && currentTime - p.time <= trailDuration;
        });

        for (const pos of recentPositions) {
            const age = currentTime - pos.time;
            const opacity = 1 - (age / trailDuration);
            if (opacity <= 0) continue;

            const boardPos = videoToBoardCoordinates(pos.x, pos.y, video, stage);
            const color = track.color || '#FF0000';

            ctx.globalAlpha = opacity * 0.8;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(boardPos.x, boardPos.y, 15, 0, Math.PI * 2);
            ctx.stroke();

            // Fill with semi-transparent color
            ctx.fillStyle = color + '40'; // 25% opacity
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;
}

/**
 * Draw fading trails for tactical tracking
 */
function drawFadingTrails(ctx, drawing, currentTime, video, stage) {
    if (!drawing.tracks) return;

    const trailDuration = drawing.trailDuration || 4.0;

    for (const [personId, track] of Object.entries(drawing.tracks)) {
        if (!track.positions || track.positions.length < 2) continue;

        // Filter positions within trail duration
        const recentPositions = track.positions.filter(p => {
            return p.time && currentTime >= p.time && currentTime - p.time <= trailDuration;
        }).sort((a, b) => a.time - b.time);

        if (recentPositions.length < 2) continue;

        const color = track.color || '#FF0000';

        // Draw connected trail segments
        for (let i = 0; i < recentPositions.length - 1; i++) {
            const p1 = recentPositions[i];
            const p2 = recentPositions[i + 1];

            const age = currentTime - p1.time;
            const opacity = 1 - (age / trailDuration);
            if (opacity <= 0) continue;

            const boardPos1 = videoToBoardCoordinates(p1.x, p1.y, video, stage);
            const boardPos2 = videoToBoardCoordinates(p2.x, p2.y, video, stage);

            ctx.globalAlpha = opacity * 0.6;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(boardPos1.x, boardPos1.y);
            ctx.lineTo(boardPos2.x, boardPos2.y);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1.0;
}

/**
 * Draw tactical board with formation overlay
 */
function drawTacticalBoard(ctx, drawing, currentTime, video, stage) {
    if (!drawing.formation) return;
    const formation = FORMATIONS[drawing.formation];
    if (!formation) return;

    const players = drawing.players || [];
    const homeColor = '#3b82f6'; // Blue for home team
    const awayColor = '#f97316'; // Orange for away team

    // Draw field outline (semi-transparent green background)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    const fieldWidth = ctx.canvas.width / (window.devicePixelRatio || 1);
    const fieldHeight = ctx.canvas.height / (window.devicePixelRatio || 1);
    const margin = 40;
    const fieldX = margin;
    const fieldY = margin;
    const fieldW = fieldWidth - margin * 2;
    const fieldH = fieldHeight - margin * 2;

    // Draw field background
    ctx.fillRect(fieldX, fieldY, fieldW, fieldH);
    ctx.strokeRect(fieldX, fieldY, fieldW, fieldH);

    // Draw center line
    ctx.beginPath();
    ctx.moveTo(fieldX + fieldW / 2, fieldY);
    ctx.lineTo(fieldX + fieldW / 2, fieldY + fieldH);
    ctx.stroke();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(fieldX + fieldW / 2, fieldY + fieldH / 2, fieldH * 0.1, 0, Math.PI * 2);
    ctx.stroke();

    // Draw penalty areas
    const penaltyWidth = fieldW * 0.16;
    const penaltyHeight = fieldH * 0.14;
    ctx.strokeRect(fieldX + (fieldW - penaltyWidth) / 2, fieldY, penaltyWidth, penaltyHeight);
    ctx.strokeRect(fieldX + (fieldW - penaltyWidth) / 2, fieldY + fieldH - penaltyHeight, penaltyWidth, penaltyHeight);

    // Draw goal areas (6-yard box)
    const goalAreaWidth = fieldW * 0.08;
    const goalAreaHeight = fieldH * 0.04;
    ctx.strokeRect(fieldX + (fieldW - goalAreaWidth) / 2, fieldY, goalAreaWidth, goalAreaHeight);
    ctx.strokeRect(fieldX + (fieldW - goalAreaWidth) / 2, fieldY + fieldH - goalAreaHeight, goalAreaWidth, goalAreaHeight);

    // Draw players from formation
    const drawPlayer = (player, color) => {
        const x = fieldX + player.x * fieldW;
        const y = fieldY + player.y * fieldH;
        const radius = 18;

        // Draw player circle
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.label, x, y);
    };

    // Draw home team
    if (formation.home) {
        for (const player of formation.home) {
            // Check if player position has been modified
            const savedPlayer = players.find(p => p.label === player.label && p.team === 'home');
            const posToDraw = savedPlayer || player;
            drawPlayer(posToDraw, homeColor);
        }
    }

    // Draw away team
    if (formation.away) {
        for (const player of formation.away) {
            // Check if player position has been modified
            const savedPlayer = players.find(p => p.label === player.label && p.team === 'away');
            const posToDraw = savedPlayer || player;
            drawPlayer(posToDraw, awayColor);
        }
    }

    // Draw any additional players that were added/modified
    for (const player of players) {
        if (!formation.home?.find(p => p.label === player.label && p.team === 'home') &&
            !formation.away?.find(p => p.label === player.label && p.team === 'away')) {
            drawPlayer(player, player.team === 'home' ? homeColor : awayColor);
        }
    }
}

/**
 * Assign team color to person based on index
 */
function assignTeamColor(personIndex) {
    const teamAColors = ['#FF0000', '#FF4444', '#FF6666', '#FF8888', '#FFAAAA'];
    const teamBColors = ['#0000FF', '#4444FF', '#6666FF', '#8888FF', '#AAAaff'];

    // Alternate between teams
    if (personIndex % 2 === 0) {
        return teamAColors[Math.floor(personIndex / 2) % teamAColors.length];
    } else {
        return teamBColors[Math.floor(personIndex / 2) % teamBColors.length];
    }
}

/**
 * Update people tracks with new poses
 */
function updatePeopleTracks(poses, currentTime, state) {
    const tacticalState = state.tacticalTracking;
    const maxDist = 100; // Maximum distance in video coordinates for matching

    for (const pose of poses) {
        // Find ankle positions (prefer left ankle)
        const leftAnkle = pose.keypoints?.find(kp => kp.name === 'left_ankle');
        const rightAnkle = pose.keypoints?.find(kp => kp.name === 'right_ankle');

        const ankle = (leftAnkle && leftAnkle.score >= tacticalState.minConfidence) ? leftAnkle :
                     (rightAnkle && rightAnkle.score >= tacticalState.minConfidence) ? rightAnkle : null;

        if (!ankle) continue;

        let matchedId = null;
        let minDist = maxDist;

        // Find closest existing track
        for (const [id, track] of Object.entries(tacticalState.peopleTracks)) {
            if (track.positions.length === 0) continue;

            const lastPos = track.positions[track.positions.length - 1];
            const dist = Math.hypot(ankle.x - lastPos.x, ankle.y - lastPos.y);

            if (dist < minDist) {
                minDist = dist;
                matchedId = id;
            }
        }

        if (matchedId) {
            // Update existing track
            tacticalState.peopleTracks[matchedId].positions.push({
                x: ankle.x,
                y: ankle.y,
                time: currentTime,
            });
            tacticalState.peopleTracks[matchedId].lastSeen = currentTime;
        } else {
            // Create new track if under max people limit
            const currentCount = Object.keys(tacticalState.peopleTracks).length;
            if (currentCount < tacticalState.maxPeople) {
                const newId = `person_${Date.now()}_${currentCount}`;
                tacticalState.peopleTracks[newId] = {
                    color: assignTeamColor(currentCount),
                    positions: [{ x: ankle.x, y: ankle.y, time: currentTime }],
                    lastSeen: currentTime,
                };
            }
        }
    }

    // Clean up old positions (older than trail duration)
    for (const track of Object.values(tacticalState.peopleTracks)) {
        const cutoffTime = currentTime - tacticalState.trailDuration;
        track.positions = track.positions.filter(p => p.time >= cutoffTime);
    }
}

/**
 * Clean up tracks that haven't been seen recently
 */
function cleanupStaleTracks(state, currentTime) {
    const tacticalState = state.tacticalTracking;
    const staleThreshold = 2.0; // Seconds before track is considered stale

    for (const [id, track] of Object.entries(tacticalState.peopleTracks)) {
        if (currentTime - track.lastSeen > staleThreshold) {
            delete tacticalState.peopleTracks[id];
        }
    }
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
        tags: Array.isArray(initial.tags) ? initial.tags : [],
        frameSnapshots: Array.isArray(initial.snapshots) ? initial.snapshots : [],
        contextMenu: null,
        editingTextId: null,
        editingNoteId: null,
        textDrag: null,
        angleDraftPhase: null,
        zoomDisplayBase: 1,
        zoomInitialized: false,
        // Pose tracking state
        poseTracking: {
            active: false,
            model: null,
            modelLoading: false,
            modelLoaded: false,
            currentTrack: null,
            tracks: [],
            detectorConfig: {
                modelType: 'lightning',
                enableSmoothing: true,
                minConfidence: 0.3,
                frameSkip: 3,
            },
            trajectoryPoint: 'left_ankle',
            showSkeleton: true,
            showTrajectory: true,
            showKeypoints: true,
            frameCount: 0,
            lastProcessedTime: 0,
        },
        // Tactical tracking state (multi-person for sports analysis)
        tacticalTracking: {
            active: false,
            modelLoaded: false,
            modelLoading: false,
            mode: 'idle', // 'idle', 'tracking', 'review'
            peopleTracks: {}, // Map: personId -> { positions: [], color: '', lastSeen: time }
            trailDuration: 4.0, // seconds
            teamColors: {
                teamA: ['#FF0000', '#FF4444', '#FF6666', '#FF8888', '#FFAAAA'],
                teamB: ['#0000FF', '#4444FF', '#6666FF', '#8888FF', '#AAAaff']
            },
            maxPeople: 22, // 11v11
            lastFrameTime: 0,
            frameSkip: 3, // Process every 3rd frame for performance
            frameCount: 0,
            recordedTracks: {}, // For saving tactical track data
            trackingStartTime: 0,
            minConfidence: 0.25, // Lower threshold for multi-person
        },
        // Pan state (Freeform-like navigation)
        panMode: false,
        panStartX: 0,
        panStartY: 0,
        panOffsetX: 0,
        panOffsetY: 0,
        isSpacePressed: false,
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


    // Update cursor based on current state
    const updateCursor = () => {
        if (state.panMode) {
            ui.canvas.style.cursor = 'grabbing';
        } else if (state.isSpacePressed) {
            ui.canvas.style.cursor = 'grab';
        } else if (state.selectedTool === 'move') {
            ui.canvas.style.cursor = 'default';
        } else {
            ui.canvas.style.cursor = 'default';
        }
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
        ui.mediaWrap.style.transform = `translate(${state.panOffsetX}px, ${state.panOffsetY}px) scale(${effectiveZoom})`;
        ui.mediaWrap.style.transformOrigin = 'center center';
        ui.noteLayer.style.transform = `translate(${state.panOffsetX}px, ${state.panOffsetY}px) scale(${effectiveZoom})`;
        ui.noteLayer.style.transformOrigin = 'center center';
        ui.canvas.style.transform = `translate(${state.panOffsetX}px, ${state.panOffsetY}px)`;

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

        // Pose options
        const showPose = state.selectedTool === 'pose-track';
        ui.poseOptions.classList.toggle('hidden', !showPose);
        if (showPose) {
            ui.trajectoryPoint.value = state.poseTracking.trajectoryPoint;
            ui.showSkeleton.checked = state.poseTracking.showSkeleton;
            ui.showTrajectory.checked = state.poseTracking.showTrajectory;
        }
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

	    let tagMarkersKey = '';

	    const renderTagMarkers = () => {
	        if (!ui.tagMarkers) return;

	        const duration = state.duration || 0;
	        const tags = state.tags.filter((t) => t && typeof t.time === 'number');
	        const key = `${duration}:${tags.map((t) => Number(t.time).toFixed(3)).join(',')}`;

	        if (key === tagMarkersKey) {
	            return;
	        }

	        tagMarkersKey = key;

	        if (duration <= 0 || tags.length === 0) {
	            ui.tagMarkers.innerHTML = '';
	            return;
	        }

	        ui.tagMarkers.innerHTML = tags
	            .map((tag) => {
	                const left = clamp((tag.time / duration) * 100, 0, 100);
	                return `<div class="absolute top-0 h-full w-1 rounded-full" style="left:${left}%;background-color:${tag.color};opacity:0.7"></div>`;
	            })
	            .join('');
	    };

	    const renderTags = () => {
	        if (!ui.tags) return;

	        const tags = state.tags.filter((t) => t && typeof t.time === 'number');
	        if (tags.length === 0) {
	            ui.tags.innerHTML = `<div class="text-xs text-gray-400">タグなし</div>`;
	            renderTagMarkers();
	            return;
	        }

	        // Sort by time
	        const sortedTags = [...tags].sort((a, b) => a.time - b.time);

	        ui.tags.innerHTML = sortedTags
	            .map((tag) => {
	                const deleteButton = readOnly ? '' : `
	                    <button
	                        type="button"
	                        data-action="delete-tag"
	                        data-tag="${tag.id}"
	                        class="ml-2 text-gray-400 hover:text-red-400 transition-colors"
	                        title="Delete tag"
	                    >×</button>
	                `;

	                return `
	                    <div
	                        class="flex items-center gap-2 px-2 py-1.5 rounded bg-[#333] hover:bg-[#3a3a3a] cursor-pointer transition-colors group"
	                        data-tag-id="${tag.id}"
	                        style="border-left: 3px solid ${tag.color}"
	                    >
	                        <span class="text-xs font-mono text-gray-400">${formatTime(tag.time)}</span>
	                        <span class="text-sm flex-1 truncate">${escapeHtml(tag.name)}</span>
	                        ${deleteButton}
	                    </div>
	                `;
	            })
	            .join('');

	        // Add click handlers for seeking
	        ui.tags.querySelectorAll('[data-tag-id]').forEach((el) => {
	            el.addEventListener('click', (event) => {
	                const tagId = el.getAttribute('data-tag-id');
	                const tag = state.tags.find((t) => t.id === tagId);
	                if (tag) {
	                    ui.video.currentTime = clamp(tag.time, 0, state.duration || tag.time);
	                }
	            });
	        });

	        // Add delete handlers
	        ui.tags.querySelectorAll('[data-action="delete-tag"]').forEach((btn) => {
	            btn.addEventListener('click', (event) => {
	                if (readOnly) return;
	                event.preventDefault();
	                event.stopPropagation();

	                const tagId = btn.getAttribute('data-tag');
	                if (!tagId) return;

	                if (confirm('このタグを削除しますか？')) {
	                    state.tags = state.tags.filter((t) => t.id !== tagId);
	                    renderTags();
	                    scheduleAutosave();
	                }
	            });
	        });

	        renderTagMarkers();
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

        // Pan mode: middle click, Space + left click, or right click
        if (event.button === 1 || // middle click
            (event.button === 0 && state.isSpacePressed) || // Space + left click
            event.button === 2) { // right click
            event.preventDefault();
            state.panMode = true;
            state.panStartX = event.clientX;
            state.panStartY = event.clientY;
            updateCursor();
            return;
        }

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
        // Pan mode handling (Freeform-like navigation)
        if (state.panMode) {
            const dx = event.clientX - state.panStartX;
            const dy = event.clientY - state.panStartY;
            state.panOffsetX += dx;
            state.panOffsetY += dy;
            state.panStartX = event.clientX;
            state.panStartY = event.clientY;
            applyZoom();
            return;
        }


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

        // Exit pan mode (must be first check after move)
        if (state.panMode) {
            state.panMode = false;
            updateCursor();
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

    // Pose tracking workflow functions
    let poseTrackingHandler = null;
    let trackingStartTime = 0;
    let recordedPoses = [];

    async function startPoseTracking() {
        if (!state.poseTracking.modelLoaded || !ui.video) {
            setStatus('AI model not ready');
            return;
        }

        trackingStartTime = ui.video.currentTime;
        recordedPoses = [];
        state.poseTracking.frameCount = 0;
        state.poseTracking.lastProcessedTime = 0;

        // Set playback speed to 0.5x for better tracking
        ui.video.playbackRate = 0.5;

        // Start video playback if not playing
        if (ui.video.paused) {
            await ui.video.play();
            state.isPlaying = true;
            setPlayingIcon();
        }

        // Add timeupdate handler for pose detection
        poseTrackingHandler = async () => {
            const currentTime = ui.video.currentTime;
            const frameSkip = state.poseTracking.detectorConfig.frameSkip;

            // Process every Nth frame
            state.poseTracking.frameCount++;
            if (state.poseTracking.frameCount % frameSkip !== 0) {
                return;
            }

            // Skip if already processed this time
            if (Math.abs(currentTime - state.poseTracking.lastProcessedTime) < 0.1) {
                return;
            }
            state.poseTracking.lastProcessedTime = currentTime;

            console.log('Pose detection attempt at time:', currentTime);

            try {
                const poses = await detectPose(ui.video, state.poseTracking.detectorConfig.minConfidence);
                console.log('Detected poses:', poses.length, poses);

                if (poses.length > 0) {
                    // Store pose with time
                    recordedPoses.push({
                        time: currentTime,
                        keypoints: poses[0].keypoints,
                        box: poses[0].box,
                        score: poses[0].score,
                    });

                    setStatus(`Tracking: ${recordedPoses.length} poses captured`);
                } else {
                    console.log('No poses detected');
                }
            } catch (error) {
                console.error('Pose detection error:', error);
            }
        };

        ui.video.addEventListener('timeupdate', poseTrackingHandler);
        state.poseTracking.active = true;
        setStatus('Tracking... Press Space to stop');
    }

    function stopPoseTracking() {
        if (poseTrackingHandler) {
            ui.video.removeEventListener('timeupdate', poseTrackingHandler);
            poseTrackingHandler = null;
        }

        // Reset playback speed
        if (ui.video) {
            ui.video.playbackRate = state.playbackRate;
        }

        state.poseTracking.active = false;

        // Process recorded poses into trajectory
        if (recordedPoses.length > 0) {
            // Create pose track drawing
            const id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `pose-track-${Date.now()}`;
            const trajectoryPoint = state.poseTracking.trajectoryPoint;

            // Compute trajectory for selected keypoint
            const trajectory = {};
            trajectory[trajectoryPoint] = extractTrajectoryPoint(
                recordedPoses,
                trajectoryPoint,
                ui.video,
                ui.stage
            );

            // Smooth trajectory
            trajectory[trajectoryPoint] = smoothTrajectory(
                trajectory[trajectoryPoint],
                5
            );

            const poseTrack = {
                tool: 'pose-track',
                id: id,
                time: trackingStartTime,
                endTime: ui.video.currentTime,
                color: state.drawColor,
                lineWidth: state.lineWidth,
                trajectoryPoint: trajectoryPoint,
                showSkeleton: state.poseTracking.showSkeleton,
                showTrajectory: state.poseTracking.showTrajectory,
                showKeypoints: state.poseTracking.showKeypoints,
                poses: recordedPoses,
                trajectory: trajectory,
                space: 'board',
            };

            state.drawings = [...state.drawings, poseTrack];
            setStatus(`Tracking complete: ${recordedPoses.length} poses`);

            // Auto-save
            saveAnnotations({ silent: true });
        } else {
            setStatus('No poses captured');
        }

        recordedPoses = [];
    }

    // ========== Tactical Tracking Implementation ==========

    let tacticalTrackingHandler = null;
    let tacticalTrackingStartTime = 0;
    let recordedTacticalTracks = {};

    function startTacticalTracking() {
        state.tacticalTracking.mode = 'tracking';
        state.tacticalTracking.peopleTracks = {};
        state.tacticalTracking.frameCount = 0;
        recordedTacticalTracks = {};
        tacticalTrackingStartTime = ui.video.currentTime;

        // Set slower playback for better tracking
        const originalSpeed = state.playbackRate;
        ui.video.playbackRate = 0.5;

        // Store state for preview rendering
        root._tacticalState = state.tacticalTracking;

        setStatus('Tracking all players... Press Space to stop');

        tacticalTrackingHandler = async () => {
            const currentTime = ui.video.currentTime;
            const frameCount = state.tacticalTracking.frameCount;

            // Process every Nth frame for performance
            if (frameCount % state.tacticalTracking.frameSkip !== 0) {
                state.tacticalTracking.frameCount++;
                return;
            }

            try {
                const poses = await detectPose(ui.video, state.tacticalTracking.minConfidence);

                if (poses && poses.length > 0) {
                    // Add time to each pose
                    const posesWithTime = poses.map(pose => ({
                        ...pose,
                        time: currentTime,
                    }));

                    // Update people tracks
                    updatePeopleTracks(posesWithTime, currentTime, state);

                    // Clean up stale tracks
                    cleanupStaleTracks(state, currentTime);

                    // Record for saving
                    for (const [personId, track] of Object.entries(state.tacticalTracking.peopleTracks)) {
                        if (!recordedTacticalTracks[personId]) {
                            recordedTacticalTracks[personId] = {
                                color: track.color,
                                positions: [],
                            };
                        }
                        // Add latest position
                        if (track.positions.length > 0) {
                            const latestPos = track.positions[track.positions.length - 1];
                            recordedTacticalTracks[personId].positions.push(latestPos);
                        }
                    }
                }
            } catch (error) {
                console.error('Tactical tracking error:', error);
            }

            state.tacticalTracking.frameCount++;
        };

        ui.video.addEventListener('timeupdate', tacticalTrackingHandler);
        state.tacticalTracking.active = true;
    }

    function stopTacticalTracking() {
        if (tacticalTrackingHandler) {
            ui.video.removeEventListener('timeupdate', tacticalTrackingHandler);
            tacticalTrackingHandler = null;
        }

        // Reset playback speed
        if (ui.video) {
            ui.video.playbackRate = state.playbackRate;
        }

        state.tacticalTracking.active = false;
        state.tacticalTracking.mode = 'idle';

        // Clear preview state
        if (root._tacticalState) {
            delete root._tacticalState;
        }

        // Process recorded tracks into tactical drawing
        const trackCount = Object.keys(recordedTacticalTracks).length;
        if (trackCount > 0) {
            // Create tactical track drawing
            const id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `tactical-track-${Date.now()}`;

            const tacticalTrack = {
                tool: 'tactical-track',
                id: id,
                time: tacticalTrackingStartTime,
                endTime: ui.video.currentTime,
                trailDuration: state.tacticalTracking.trailDuration,
                tracks: recordedTacticalTracks,
                space: 'board',
            };

            state.drawings = [...state.drawings, tacticalTrack];
            setStatus(`Tactical tracking complete: ${trackCount} players tracked`);

            // Auto-save
            saveAnnotations({ silent: true });
        } else {
            setStatus('No players tracked');
        }

        recordedTacticalTracks = {};
        state.tacticalTracking.peopleTracks = {};
    }

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
            state.tags = Array.isArray(annotations.tags) ? annotations.tags : [];
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
        btn.addEventListener('click', async () => {
            if (readOnly) return;
            const toolId = btn.getAttribute('data-tool');

            // Handle pose-track tool selection
            if (toolId === 'pose-track' && state.selectedTool !== 'pose-track') {
                // Start pose tracking
                state.selectedTool = 'pose-track';
                updateToolbarUi();
                updateDrawingOptionsUi();

                // Load model if not already loaded
                if (!state.poseTracking.modelLoaded) {
                    setStatus('Loading AI model...');
                    state.poseTracking.modelLoading = true;
                    try {
                        await loadPoseModel(state.poseTracking.detectorConfig.modelType);
                        state.poseTracking.modelLoaded = true;
                        state.poseTracking.active = true;
                        setStatus('AI Ready - Click video to start tracking');
                    } catch (error) {
                        setStatus('Failed to load AI model');
                        console.error('Pose model loading error:', error);
                        state.selectedTool = null;
                        updateToolbarUi();
                    } finally {
                        state.poseTracking.modelLoading = false;
                    }
                } else {
                    state.poseTracking.active = true;
                    setStatus('AI Ready - Click video to start tracking');
                }
            } else if (toolId === 'pose-track' && state.selectedTool === 'pose-track') {
                // Deselect pose-track
                state.selectedTool = null;
                state.poseTracking.active = false;
                stopPoseTracking();
                updateToolbarUi();
                updateDrawingOptionsUi();
                setStatus('');
            } else if (toolId === 'tactical-track' && state.selectedTool !== 'tactical-track') {
                // Start tactical tracking
                state.selectedTool = 'tactical-track';
                updateToolbarUi();
                updateDrawingOptionsUi();

                // Load multi-pose model if not already loaded
                if (!state.tacticalTracking.modelLoaded) {
                    setStatus('Loading AI multi-pose model...');
                    state.tacticalTracking.modelLoading = true;
                    try {
                        await loadMultiPoseModel();
                        state.tacticalTracking.modelLoaded = true;
                        state.tacticalTracking.active = true;
                        setStatus('Tactical Ready - Click to start tracking');
                    } catch (error) {
                        setStatus('Failed to load AI model');
                        console.error('Tactical model loading error:', error);
                        state.selectedTool = null;
                        updateToolbarUi();
                    } finally {
                        state.tacticalTracking.modelLoading = false;
                    }
                } else {
                    state.tacticalTracking.active = true;
                    setStatus('Tactical Ready - Click to start tracking');
                }
            } else if (toolId === 'tactical-track' && state.selectedTool === 'tactical-track') {
                // Deselect tactical-track
                state.selectedTool = null;
                state.tacticalTracking.active = false;
                stopTacticalTracking();
                updateToolbarUi();
                updateDrawingOptionsUi();
                setStatus('');
            } else {
                // Normal tool selection
                state.selectedTool = state.selectedTool === toolId ? null : toolId;
                updateToolbarUi();
                updateDrawingOptionsUi();
            }
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

    // Pose options event listeners
    ui.trajectoryPoint.addEventListener('change', () => {
        if (readOnly) return;
        state.poseTracking.trajectoryPoint = ui.trajectoryPoint.value;
        scheduleAutosave();
    });

    ui.showSkeleton.addEventListener('change', () => {
        if (readOnly) return;
        state.poseTracking.showSkeleton = ui.showSkeleton.checked;
        scheduleAutosave();
    });

    ui.showTrajectory.addEventListener('change', () => {
        if (readOnly) return;
        state.poseTracking.showTrajectory = ui.showTrajectory.checked;
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

        // Handle pose tracking - stop tracking when pause pressed
        if (state.poseTracking.active && !ui.video.paused) {
            stopPoseTracking();
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

        // Handle pose-track tool - start/stop tracking on click
        if (state.selectedTool === 'pose-track') {
            if (state.poseTracking.active && !state.poseTracking.currentTrack) {
                // Start tracking
                startPoseTracking();
            } else if (state.poseTracking.active) {
                // Stop tracking
                stopPoseTracking();
            }
            return;
        }

        // Handle tactical-track tool - start/stop tracking on click
        if (state.selectedTool === 'tactical-track') {
            if (state.tacticalTracking.active && state.tacticalTracking.mode === 'idle') {
                // Start tracking
                startTacticalTracking();
                // Auto-play video for tracking
                if (ui.video.paused) {
                    ui.video.play();
                }
            } else if (state.tacticalTracking.active && state.tacticalTracking.mode === 'tracking') {
                // Stop tracking
                stopTacticalTracking();
                // Pause video
                if (!ui.video.paused) {
                    ui.video.pause();
                }
            }
            return;
        }

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

            // Ctrl + wheel for smooth zoom (Mac pinch gesture equivalent)
            if (event.ctrlKey) {
                const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05;
                state.zoom = clamp(state.zoom * zoomFactor, 0.1, 3);
                applyZoom();
                return;
            }

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


    // Prevent middle-click auto-scroll (browser default behavior)
    ui.stage.addEventListener('auxclick', (event) => {
        if (event.button === 1) { // middle click
            event.preventDefault();
        }
    }, { signal });

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

    // Tag event handlers
    let selectedTagColor = TAG_COLORS[0];

    const openTagInput = () => {
        if (readOnly) return;
        ui.tagInput.classList.remove('hidden');
        ui.tagName.value = '';
        ui.tagName.focus();
        // Reset color selection
        selectedTagColor = TAG_COLORS[0];
        ui.tagColorButtons.forEach((btn) => {
            const color = btn.getAttribute('data-tag-color');
            if (color === selectedTagColor) {
                btn.classList.add('border-white');
                btn.classList.remove('border-transparent');
            } else {
                btn.classList.remove('border-white');
                btn.classList.add('border-transparent');
            }
        });
    };

    const closeTagInput = () => {
        ui.tagInput.classList.add('hidden');
        ui.tagName.value = '';
        selectedTagColor = TAG_COLORS[0];
    };

    const createTag = (name, color, time) => {
        const id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
        const tag = {
            id,
            name: name.trim() || 'Tag',
            color,
            time: time ?? ui.video.currentTime ?? 0,
        };
        state.tags.push(tag);
        renderTags();
        scheduleAutosave();
        return tag;
    };

    // Add Tag button
    if (ui.addTag) {
        ui.addTag.addEventListener('click', () => {
            openTagInput();
        });
    }

    // Tag color selection
    ui.tagColorButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const color = btn.getAttribute('data-tag-color');
            if (color) {
                selectedTagColor = color;
                ui.tagColorButtons.forEach((b) => {
                    b.classList.remove('border-white');
                    b.classList.add('border-transparent');
                });
                btn.classList.add('border-white');
                btn.classList.remove('border-transparent');
            }
        });
    });

    // Tag Save button
    if (ui.tagSave) {
        ui.tagSave.addEventListener('click', () => {
            const name = ui.tagName.value.trim();
            if (name) {
                createTag(name, selectedTagColor);
                closeTagInput();
            }
        });
    }

    // Tag Cancel button
    if (ui.tagCancel) {
        ui.tagCancel.addEventListener('click', () => {
            closeTagInput();
        });
    }

    // Tag name input - Enter to save, Escape to cancel
    if (ui.tagName) {
        ui.tagName.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const name = ui.tagName.value.trim();
                if (name) {
                    createTag(name, selectedTagColor);
                    closeTagInput();
                }
            } else if (event.key === 'Escape') {
                closeTagInput();
            }
        });
    }

    // Tactical Board event handlers
    const openFormationSelector = () => {
        if (readOnly) return;
        ui.formationSelector.classList.remove('hidden');
    };

    const closeFormationSelector = () => {
        ui.formationSelector.classList.add('hidden');
    };

    const createTacticalBoard = (formation) => {
        const id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
        const board = {
            id,
            tool: 'tactical-board',
            time: ui.video.currentTime || 0,
            formation,
            players: [],
            space: 'board',
        };
        state.drawings.push(board);
        closeFormationSelector();
        scheduleAutosave();
        return board;
    };

    // Add Tactical Board button
    if (ui.addTacticalBoard) {
        ui.addTacticalBoard.addEventListener('click', () => {
            openFormationSelector();
        });
    }

    // Formation Create button
    if (ui.formationCreate) {
        ui.formationCreate.addEventListener('click', () => {
            const formation = ui.formationSelect.value;
            if (formation && FORMATIONS[formation]) {
                createTacticalBoard(formation);
            }
        });
    }

    // Formation Cancel button
    if (ui.formationCancel) {
        ui.formationCancel.addEventListener('click', () => {
            closeFormationSelector();
        });
    }

    // Space key tracking for pan mode (Freeform-like navigation)
    document.addEventListener(
        'keydown',
        (event) => {
            if (event.key === ' ' && !state.editingTextId) {
                event.preventDefault();

                // Handle tactical tracking stop
                if (state.tacticalTracking.active && state.tacticalTracking.mode === 'tracking') {
                    stopTacticalTracking();
                    if (!ui.video.paused) {
                        ui.video.pause();
                    }
                    return;
                }

                // Handle pose tracking stop
                if (state.poseTracking.active && state.selectedTool === 'pose-track') {
                    stopPoseTracking();
                    return;
                }

                state.isSpacePressed = true;
                updateCursor();
            }
        },
        { signal }
    );

    document.addEventListener(
        'keyup',
        (event) => {
            if (event.key === ' ') {
                state.isSpacePressed = false;
                if (!state.panMode) {
                    updateCursor();
                }
            }
        },
        { signal }
    );

    // T key for quick tag creation
    document.addEventListener(
        'keydown',
        (event) => {
            if (event.key === 't' || event.key === 'T') {
                // Only trigger if not editing text or tag input
                if (state.editingTextId) return;
                if (!ui.tagInput.classList.contains('hidden')) return;
                if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

                event.preventDefault();
                openTagInput();
            }
        },
        { signal }
    );


    renderSnapshots();
    renderTags();
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
