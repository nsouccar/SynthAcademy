import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

/**
 * EnvelopeNode - DAHDSR Envelope Generator
 *
 * Automatically modulates different parameters based on what it's connected to:
 * - Connected to Oscillator/Mixer → Modulates Volume (Amplitude)
 * - Connected to Filter → Modulates Filter Cutoff Frequency
 *
 * DAHDSR stages:
 * - Delay: Time before envelope starts
 * - Attack: Time to reach peak
 * - Hold: Time to hold at peak
 * - Decay: Time to fall to sustain level
 * - Sustain: Level held while note is pressed
 * - Release: Time to fade to zero after note release
 */
export function EnvelopeNode({ id, data }) {
    const { setNodes } = useReactFlow();
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(null); // Which point is being dragged

    // DAHDSR parameters (in seconds, except sustain which is 0-1)
    const [delay, setDelay] = useState(data?.delay || 0);
    const [attack, setAttack] = useState(data?.attack || 0.01);
    const [hold, setHold] = useState(data?.hold || 0);
    const [decay, setDecay] = useState(data?.decay || 0.1);
    const [sustain, setSustain] = useState(data?.sustain || 0.7);
    const [release, setRelease] = useState(data?.release || 1.0);

    // Tutorial mode
    const tutorialMode = data?.tutorialMode || false;
    const blurredParams = data?.blurredParams || [];

    console.log('EnvelopeNode - tutorialMode:', tutorialMode, 'blurredParams:', blurredParams);

    // Helper to check if a parameter should be blurred
    const isParamBlurred = (paramName) => {
        return tutorialMode && blurredParams.includes(paramName);
    };

    // Dispatch tutorial parameter change events
    const handleParameterChange = (parameter, value, setter) => {
        setter(value);
        if (tutorialMode) {
            window.dispatchEvent(new CustomEvent('tutorialParameterChange', {
                detail: { nodeId: id, parameter, value }
            }));
        }
    };

    // Curve parameters (-1 to 1, where 0 is linear, negative is logarithmic, positive is exponential)
    const [attackCurve, setAttackCurve] = useState(data?.attackCurve || 0);
    const [decayCurve, setDecayCurve] = useState(data?.decayCurve || 0);
    const [releaseCurve, setReleaseCurve] = useState(data?.releaseCurve || 0);

    // Additional parameters for filter envelope
    const [baseFrequency, setBaseFrequency] = useState(data?.baseFrequency || 200);
    const [octaves, setOctaves] = useState(data?.octaves || 4);

    // Helper function to draw a curved segment using quadratic bezier
    const drawCurvedSegment = (ctx, x1, y1, x2, y2, curve) => {
        if (curve === 0) {
            // Linear - just draw a straight line
            ctx.lineTo(x2, y2);
        } else {
            // Curved - use quadratic bezier curve
            // curve: -1 (log) to +1 (exp)
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            // Control point offset based on curve amount
            const perpX = -(y2 - y1);
            const perpY = (x2 - x1);
            const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);

            if (perpLen > 0) {
                const offsetAmount = curve * Math.min(perpLen * 0.3, 30);
                const cpX = midX + (perpX / perpLen) * offsetAmount;
                const cpY = midY + (perpY / perpLen) * offsetAmount;

                ctx.quadraticCurveTo(cpX, cpY, x2, y2);
            } else {
                ctx.lineTo(x2, y2);
            }
        }
    };

    // Draw DAHDSR envelope visualization
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas completely
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);

        // Calculate time scale - use fixed total time for consistent visualization
        const totalTime = 4; // Fixed 4 second display window
        const padding = 10;
        const graphWidth = width - (padding * 2);
        const graphHeight = height - (padding * 2);

        const timeToX = (time) => padding + (time / totalTime) * graphWidth;
        const levelToY = (level) => padding + graphHeight - (level * graphHeight);

        // Calculate envelope key points in time
        const t1 = delay;
        const t2 = delay + attack;
        const t3 = delay + attack + hold;
        const t4 = delay + attack + hold + decay;
        const t5 = Math.min(t4 + 0.3, totalTime - release); // Sustain display duration
        const t6 = t5 + release;

        // Calculate envelope points
        const points = [
            { x: timeToX(0), y: levelToY(0) },
            { x: timeToX(t1), y: levelToY(0) },
            { x: timeToX(t2), y: levelToY(1) },
            { x: timeToX(t3), y: levelToY(1) },
            { x: timeToX(t4), y: levelToY(sustain) },
            { x: timeToX(t5), y: levelToY(sustain) },
            { x: timeToX(t6), y: levelToY(0) }
        ];

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (i / 4) * graphHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw envelope curve with gradient fill
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding);
        ctx.lineTo(points[1].x, height - padding);
        drawCurvedSegment(ctx, points[1].x, height - padding, points[2].x, points[2].y, attackCurve);
        ctx.lineTo(points[3].x, points[3].y);
        drawCurvedSegment(ctx, points[3].x, points[3].y, points[4].x, points[4].y, decayCurve);
        ctx.lineTo(points[5].x, points[5].y);
        drawCurvedSegment(ctx, points[5].x, points[5].y, points[6].x, points[6].y, releaseCurve);
        ctx.lineTo(points[6].x, height - padding);
        ctx.closePath();
        ctx.fill();

        // Draw envelope line with curves
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y); // Delay
        drawCurvedSegment(ctx, points[1].x, points[1].y, points[2].x, points[2].y, attackCurve); // Attack
        ctx.lineTo(points[3].x, points[3].y); // Hold
        drawCurvedSegment(ctx, points[3].x, points[3].y, points[4].x, points[4].y, decayCurve); // Decay
        ctx.lineTo(points[5].x, points[5].y); // Sustain
        drawCurvedSegment(ctx, points[5].x, points[5].y, points[6].x, points[6].y, releaseCurve); // Release
        ctx.stroke();

        // Draw control points with labels
        const controlPoints = [
            { x: points[1].x, y: points[1].y, label: 'D', active: isDragging === 'delay' },
            { x: points[2].x, y: points[2].y, label: 'A', active: isDragging === 'attack' },
            { x: points[3].x, y: points[3].y, label: 'H', active: isDragging === 'hold' },
            { x: points[4].x, y: points[4].y, label: 'D/S', active: isDragging === 'decay' },
            { x: points[6].x, y: points[6].y, label: 'R', active: isDragging === 'release' }
        ];

        controlPoints.forEach(point => {
            // Draw point
            ctx.fillStyle = point.active ? '#ffff00' : '#f5576c';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.active ? 7 : 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(point.label, point.x, point.y - 12);
        });

        // Draw curve control handles (small circles on the midpoints)
        const curveHandles = [
            {
                x: (points[1].x + points[2].x) / 2,
                y: (points[1].y + points[2].y) / 2,
                label: 'AC',
                active: isDragging === 'attackCurve'
            },
            {
                x: (points[3].x + points[4].x) / 2,
                y: (points[3].y + points[4].y) / 2,
                label: 'DC',
                active: isDragging === 'decayCurve'
            },
            {
                x: (points[5].x + points[6].x) / 2,
                y: (points[5].y + points[6].y) / 2,
                label: 'RC',
                active: isDragging === 'releaseCurve'
            }
        ];

        curveHandles.forEach(handle => {
            // Draw small circle
            ctx.fillStyle = handle.active ? '#00ffff' : 'rgba(100, 200, 255, 0.7)';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, handle.active ? 5 : 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

    }, [delay, attack, hold, decay, sustain, release, attackCurve, decayCurve, releaseCurve, isDragging]);

    // Handle mouse interactions for dragging
    const handleCanvasMouseMove = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        // Scale mouse coordinates to canvas coordinates
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const width = canvas.width;
        const height = canvas.height;
        const totalTime = 4;
        const padding = 10;
        const graphWidth = width - (padding * 2);
        const graphHeight = height - (padding * 2);

        const xToTime = (x) => Math.max(0, ((x - padding) / graphWidth) * totalTime);
        const yToLevel = (y) => Math.max(0, Math.min(1, 1 - ((y - padding) / graphHeight)));

        // Update the appropriate parameter based on what's being dragged
        if (isDragging === 'delay') {
            const newDelay = Math.max(0, Math.min(2, xToTime(mouseX)));
            setDelay(Number(newDelay.toFixed(3)));
        } else if (isDragging === 'attack') {
            const newTime = xToTime(mouseX);
            const newAttack = Math.max(0.001, Math.min(2, newTime - delay));
            setAttack(Number(newAttack.toFixed(3)));
        } else if (isDragging === 'hold') {
            const newTime = xToTime(mouseX);
            const newHold = Math.max(0, Math.min(2, newTime - delay - attack));
            setHold(Number(newHold.toFixed(3)));
        } else if (isDragging === 'decay') {
            const newTime = xToTime(mouseX);
            const newDecay = Math.max(0.001, Math.min(3, newTime - delay - attack - hold));
            const newSustain = yToLevel(mouseY);
            setDecay(Number(newDecay.toFixed(3)));
            setSustain(Number(newSustain.toFixed(2)));
        } else if (isDragging === 'release') {
            // For release, we calculate backwards from the mouse position
            const newTime = xToTime(mouseX);
            const sustainStart = delay + attack + hold + decay;
            const newRelease = Math.max(0.001, Math.min(5, newTime - sustainStart - 0.3));
            setRelease(Number(newRelease.toFixed(3)));
        } else if (isDragging === 'attackCurve') {
            // Vertical mouse movement controls curve amount
            const centerY = height / 2;
            const curve = Math.max(-1, Math.min(1, (centerY - mouseY) / (height / 4)));
            setAttackCurve(Number(curve.toFixed(2)));
        } else if (isDragging === 'decayCurve') {
            const centerY = height / 2;
            const curve = Math.max(-1, Math.min(1, (centerY - mouseY) / (height / 4)));
            setDecayCurve(Number(curve.toFixed(2)));
        } else if (isDragging === 'releaseCurve') {
            const centerY = height / 2;
            const curve = Math.max(-1, Math.min(1, (centerY - mouseY) / (height / 4)));
            setReleaseCurve(Number(curve.toFixed(2)));
        }
    }, [isDragging, delay, attack, hold, decay]);

    const handleCanvasMouseDown = (e) => {
        e.stopPropagation(); // Stop ReactFlow from capturing this event

        const canvas = canvasRef.current;
        if (!canvas) {
            console.log('No canvas ref');
            return;
        }

        // Get the canvas position (not the wrapper div)
        const rect = canvas.getBoundingClientRect();

        console.log('Canvas clicked at:', e.clientX, e.clientY);
        console.log('Canvas rect:', rect);

        // Scale mouse coordinates to canvas coordinates
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        console.log('Scaled mouse pos:', mouseX, mouseY);

        // Calculate envelope points (same as in draw)
        const width = canvas.width;
        const height = canvas.height;
        const totalTime = 4; // Fixed 4 second display
        const padding = 10;
        const graphWidth = width - (padding * 2);
        const graphHeight = height - (padding * 2);

        const timeToX = (time) => padding + (time / totalTime) * graphWidth;
        const levelToY = (level) => padding + graphHeight - (level * graphHeight);

        const t1 = delay;
        const t2 = delay + attack;
        const t3 = delay + attack + hold;
        const t4 = delay + attack + hold + decay;
        const t5 = Math.min(t4 + 0.3, totalTime - release);
        const t6 = t5 + release;

        const points = [
            { x: timeToX(0), y: levelToY(0) },
            { x: timeToX(t1), y: levelToY(0) },
            { x: timeToX(t2), y: levelToY(1) },
            { x: timeToX(t3), y: levelToY(1) },
            { x: timeToX(t4), y: levelToY(sustain) },
            { x: timeToX(t5), y: levelToY(sustain) },
            { x: timeToX(t6), y: levelToY(0) }
        ];

        // Check curve handles first (smaller hit areas)
        const curveHandles = [
            {
                x: (points[1].x + points[2].x) / 2,
                y: (points[1].y + points[2].y) / 2,
                type: 'attackCurve'
            },
            {
                x: (points[3].x + points[4].x) / 2,
                y: (points[3].y + points[4].y) / 2,
                type: 'decayCurve'
            },
            {
                x: (points[5].x + points[6].x) / 2,
                y: (points[5].y + points[6].y) / 2,
                type: 'releaseCurve'
            }
        ];

        for (let i = 0; i < curveHandles.length; i++) {
            const handle = curveHandles[i];
            const distance = Math.sqrt(Math.pow(mouseX - handle.x, 2) + Math.pow(mouseY - handle.y, 2));
            if (distance < 15) {
                setIsDragging(handle.type);
                console.log('✓ Started dragging curve:', handle.type);
                return;
            }
        }

        // Then check main control points
        const controlPoints = [
            { x: points[1].x, y: points[1].y, type: 'delay' },
            { x: points[2].x, y: points[2].y, type: 'attack' },
            { x: points[3].x, y: points[3].y, type: 'hold' },
            { x: points[4].x, y: points[4].y, type: 'decay' },
            { x: points[6].x, y: points[6].y, type: 'release' }
        ];

        for (let i = 0; i < controlPoints.length; i++) {
            const point = controlPoints[i];
            const distance = Math.sqrt(Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2));
            if (distance < 20) {
                setIsDragging(point.type);
                console.log('✓ Started dragging:', point.type);
                return;
            }
        }
        console.log('No control point clicked');
    };

    // Add global mouse listeners when dragging
    useEffect(() => {
        if (!isDragging) return;

        const handleGlobalMouseMove = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCanvasMouseMove(e);
        };

        const handleGlobalMouseUp = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Stopped dragging');
            setIsDragging(null);
        };

        document.addEventListener('mousemove', handleGlobalMouseMove, { capture: true });
        document.addEventListener('mouseup', handleGlobalMouseUp, { capture: true });

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
            document.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });
        };
    }, [isDragging, handleCanvasMouseMove]);

    // Update node data when parameters change
    useEffect(() => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            delay,
                            attack,
                            hold,
                            decay,
                            sustain,
                            release,
                            attackCurve,
                            decayCurve,
                            releaseCurve,
                            baseFrequency,
                            octaves
                        }
                    };
                }
                return node;
            })
        );
    }, [delay, attack, hold, decay, sustain, release, attackCurve, decayCurve, releaseCurve, baseFrequency, octaves, id, setNodes]);

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: '2px solid #fff',
                borderRadius: 8,
                padding: 12,
                minWidth: 180,
                color: '#fff',
                fontSize: '0.85em'
            }}
        >
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#fff', width: 10, height: 10 }}
            />

            {/* Title - draggable area */}
            <div
                className="drag-handle"
                style={{
                    fontWeight: 'bold',
                    marginBottom: 8,
                    textAlign: 'center',
                    fontSize: '1em',
                    cursor: 'move',
                    padding: '4px 0'
                }}
            >
                Envelope
            </div>

            {/* Content area - prevent node dragging */}
            <div className="nopan nodrag">
                {/* DAHDSR Visualization Canvas */}
                <div
                    onMouseDown={handleCanvasMouseDown}
                    style={{
                        position: 'relative',
                        marginBottom: 12,
                        cursor: isDragging ? 'grabbing' : 'crosshair',
                        borderRadius: 4,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={240}
                        height={120}
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            pointerEvents: 'none'
                        }}
                    />
                </div>

            {/* Attack */}
            <div className="nodrag nopan" style={{
                marginBottom: 6,
                filter: isParamBlurred('attack') ? 'blur(5px)' : 'none',
                opacity: isParamBlurred('attack') ? 0.5 : 1,
                transition: 'all 0.3s ease',
                pointerEvents: isParamBlurred('attack') ? 'none' : 'auto'
            }}>
                <label style={{ display: 'block', fontSize: '0.75em', marginBottom: 2 }}>
                    Attack: {attack.toFixed(3)}s
                </label>
                <input
                    type="range"
                    min="0.001"
                    max="2"
                    step="0.001"
                    value={attack}
                    onChange={(e) => handleParameterChange('attack', Number(e.target.value), setAttack)}
                    style={{ width: '100%' }}
                />
            </div>

            {/* Decay */}
            <div className="nodrag nopan" style={{
                marginBottom: 6,
                filter: isParamBlurred('decay') ? 'blur(5px)' : 'none',
                opacity: isParamBlurred('decay') ? 0.5 : 1,
                transition: 'all 0.3s ease',
                pointerEvents: isParamBlurred('decay') ? 'none' : 'auto'
            }}>
                <label style={{ display: 'block', fontSize: '0.75em', marginBottom: 2 }}>
                    Decay: {decay.toFixed(3)}s
                </label>
                <input
                    type="range"
                    min="0.001"
                    max="3"
                    step="0.001"
                    value={decay}
                    onChange={(e) => handleParameterChange('decay', Number(e.target.value), setDecay)}
                    style={{ width: '100%' }}
                />
            </div>

            {/* Sustain */}
            <div className="nodrag nopan" style={{
                marginBottom: 6,
                filter: isParamBlurred('sustain') ? 'blur(5px)' : 'none',
                opacity: isParamBlurred('sustain') ? 0.5 : 1,
                transition: 'all 0.3s ease',
                pointerEvents: isParamBlurred('sustain') ? 'none' : 'auto'
            }}>
                <label style={{ display: 'block', fontSize: '0.75em', marginBottom: 2 }}>
                    Sustain: {sustain.toFixed(2)}
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={sustain}
                    onChange={(e) => handleParameterChange('sustain', Number(e.target.value), setSustain)}
                    style={{ width: '100%' }}
                />
            </div>

            {/* Release */}
            <div className="nodrag nopan" style={{
                marginBottom: 6,
                filter: isParamBlurred('release') ? 'blur(5px)' : 'none',
                opacity: isParamBlurred('release') ? 0.5 : 1,
                transition: 'all 0.3s ease',
                pointerEvents: isParamBlurred('release') ? 'none' : 'auto'
            }}>
                <label style={{ display: 'block', fontSize: '0.75em', marginBottom: 2 }}>
                    Release: {release.toFixed(3)}s
                </label>
                <input
                    type="range"
                    min="0.001"
                    max="5"
                    step="0.001"
                    value={release}
                    onChange={(e) => handleParameterChange('release', Number(e.target.value), setRelease)}
                    style={{ width: '100%' }}
                />
            </div>

            {/* Filter envelope parameters (collapsed by default) */}
            <details style={{ marginTop: 8, fontSize: '0.75em' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    Filter Envelope Settings
                </summary>
                <div style={{ marginTop: 6 }}>
                    <label style={{ display: 'block', marginBottom: 2 }}>
                        Base Freq: {baseFrequency}Hz
                    </label>
                    <input
                        type="range"
                        min="20"
                        max="5000"
                        step="10"
                        value={baseFrequency}
                        onChange={(e) => setBaseFrequency(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />

                    <label style={{ display: 'block', marginTop: 4, marginBottom: 2 }}>
                        Range: {octaves} octaves
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={octaves}
                        onChange={(e) => setOctaves(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
            </details>
            </div>
            {/* End content area */}

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#fff', width: 10, height: 10 }}
            />
        </div>
    );
}
